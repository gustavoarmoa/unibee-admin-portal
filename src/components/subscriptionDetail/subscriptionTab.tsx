import {
  Button,
  Col,
  DatePicker,
  Divider,
  Popover,
  Row,
  Spin,
  message,
} from "antd";
import dayjs from "dayjs";
import { CSSProperties, useEffect, useState } from "react";
import {
  IPlan,
  IPreview,
  IProfile,
  ISubscriptionType,
} from "../../shared.types";
import { useNavigate } from "react-router-dom";
import update from "immutability-helper";
import {
  createPreviewReq,
  extendDueDate,
  getPlanList,
  getSubDetail,
  resumeSub,
  terminateSub,
  updateSubscription,
} from "../../requests";
import { daysBetweenDate, showAmount } from "../../helpers";
import TerminateSubModal from "./modals/terminateSub";
import ResumeSubModal from "./modals/resumeSub";
import ExtendSubModal from "./modals/extendSub";
import ChangePlanModal from "./modals/changePlan";
import UpdateSubPreviewModal from "./modals/updateSubPreview";
import { SUBSCRIPTION_STATUS } from "../../constants";
import { InfoCircleOutlined, SyncOutlined } from "@ant-design/icons";

const APP_PATH = import.meta.env.BASE_URL;

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: "32px",
};
const Index = ({
  setUserProfile,
}: {
  setUserProfile: (user: IProfile) => void;
}) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [confirmming, setConfirming] = useState(false);
  const [dueDateModal, setDueDateModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");
  const [changePlanModal, setChangePlanModal] = useState(false);
  const [preview, setPreview] = useState<IPreview | null>(null);
  // const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [terminateModal, setTerminateModal] = useState(false);
  const [resumeModal, setResumeModal] = useState(false);
  const [activeSub, setActiveSub] = useState<ISubscriptionType | null>(null); // null: when page is loading, no data is ready yet.
  const [endSubMode, setEndSubMode] = useState<1 | 2 | null>(null); // 1: immediate, 2: end of this billing cycole, null: not selected

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const toggleTerminateModal = () => setTerminateModal(!terminateModal);
  const toggleResumeSubModal = () => setResumeModal(!resumeModal);
  const toggleSetDueDateModal = () => setDueDateModal(!dueDateModal);
  const toggleChangPlanModal = () => setChangePlanModal(!changePlanModal);

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value. I don't want to define 2 fn to do similar jobs.
    checked: boolean | null // ditto
  ) => {
    const planIdx = plans.findIndex((p) => p.id == selectedPlan);
    if (planIdx == -1) {
      return;
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId);
    if (addonIdx == -1) {
      return;
    }

    let newPlans = plans;
    if (quantity == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { checked: { $set: checked as boolean } } },
        },
      });
    } else if (checked == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { quantity: { $set: quantity as number } } },
        },
      });
    }
    setPlans(newPlans);
  };

  const togglePreviewModal = () => setPreviewModalOpen(!previewModalOpen);
  const openPreviewModal = () => {
    const plan = plans.find((p) => p.id == selectedPlan);
    let valid = true;
    if (plan?.addons != null && plan.addons.length > 0) {
      for (let i = 0; i < plan.addons.length; i++) {
        if (plan.addons[i].checked) {
          const q = Number(plan.addons[i].quantity);
          console.log("q: ", q);
          if (!Number.isInteger(q) || q <= 0) {
            valid = false;
            break;
          }
        }
      }
    }
    if (!valid) {
      message.error("Addon quantity must be greater than 0.");
      return;
    }
    togglePreviewModal();
    createPreview();
  };

  const createPreview = async () => {
    setPreview(null); // clear the last preview, otherwise, users might see the old value before the new value return
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    console.log("active sub addon bfr preview: ", addons);
    let previewRes;
    try {
      previewRes = await createPreviewReq(
        activeSub!.subscriptionId,
        selectedPlan as number,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        }))
      );
      console.log("subscription update preview res: ", previewRes);
      const code = previewRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(previewRes.data.message);
      }
      // setPreviewModalOpen(false);
      // togglePreviewModal();
    } catch (err) {
      // togglePreviewModal();
      setPreviewModalOpen(false);
      if (err instanceof Error) {
        console.log("err creating preview: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    const p: IPreview = previewRes.data.data;
    setPreview(p);
  };

  // confirm the changed plan
  const onConfirm = async () => {
    const plan = plans.find((p) => p.id == selectedPlan);
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : [];
    let updateSubRes;
    try {
      setConfirming(true);
      updateSubRes = await updateSubscription(
        activeSub?.subscriptionId as string,
        selectedPlan as number,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
        preview?.totalAmount as number,
        preview?.currency as string,
        preview?.prorationDate as number
      );
      console.log("update subscription submit res: ", updateSubRes);
      const code = updateSubRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(updateSubRes.data.message);
      }
    } catch (err) {
      setConfirming(false);
      setPreviewModalOpen(false);
      if (err instanceof Error) {
        console.log("err submitting plan update: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    if (updateSubRes.data.data.paid) {
      /*
        navigate(`${APP_PATH}profile/subscription`, {
          state: { msg: "Subscription updated" },
        });
        */
      // navigate(-1);
      togglePreviewModal();
      // setChangePlanModal(false);
      toggleChangPlanModal();
      setConfirming(false);
      fetchData();
      message.success("Plan updated");
      return;
    }
    setConfirming(false);
    togglePreviewModal();
    // ??????????????????
    // what if checkout form is opened, you can't ask admin to pay user's subscription fee.
    window.open(updateSubRes.data.data.link, "_blank");
  };

  const onTerminateSub = async () => {
    if (endSubMode == null) {
      message.error("Please choose when to end this subscription");
      return;
    }
    try {
      setLoading(true);
      const terminateRes = await terminateSub(
        activeSub?.subscriptionId as string,
        endSubMode == 1
      );
      console.log("terminate sub res: ", terminateRes);
      const code = terminateRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(terminateRes.data.message);
      }
      setLoading(false);
      // setTerminateModal(false);
      toggleTerminateModal();
      message.success(
        endSubMode == 1
          ? "Subscription ended"
          : "Subscription will end on the end of this billing cycle"
      );
      setEndSubMode(null); // force users to choose a endMode before submitting.
      fetchData();
    } catch (err) {
      setLoading(false);
      // setTerminateModal(false);
      toggleTerminateModal();
      if (err instanceof Error) {
        console.log("err terminating sub: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onResumeSub = async () => {
    try {
      setLoading(true);
      const resumeRes = await resumeSub(activeSub?.subscriptionId as string);
      console.log("resume sub res: ", resumeRes);
      const code = resumeRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(resumeRes.data.message);
      }
      setLoading(false);
      // setResumeModal(false);
      toggleResumeSubModal();
      message.success("Subscription resumed.");
      fetchData();
    } catch (err) {
      setLoading(false);
      // setResumeModal(false);
      toggleResumeSubModal();
      if (err instanceof Error) {
        console.log("err resuming sub: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  // fetch current subscription detail, and all active plans.
  const fetchData = async () => {
    // const subId = location.state && location.state.subscriptionId;
    const pathName = window.location.pathname.split("/");
    const subId = pathName.pop();
    if (subId == null) {
      // TODO: show page not exist, OR invalid subscription
      return;
    }

    setLoading(true);
    let subDetailRes, planListRes;
    try {
      const res = ([subDetailRes, planListRes] = await Promise.all([
        getSubDetail(subId),
        getPlanList(1),
      ]));
      console.log("subDetail/planList: ", subDetailRes, "//", planListRes);
      res.forEach((r) => {
        const code = r.data.code;
        code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
        if (code != 0) {
          // TODO: save all the code as ENUM in constant,
          throw new Error(r.data.message);
        }
      });
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }

    setLoading(false);
    const s = subDetailRes.data.data;
    const localActiveSub: ISubscriptionType = { ...s.subscription };
    localActiveSub.addons = s.addons?.map((a: any) => ({
      ...a.addonPlan,
      quantity: a.quantity,
      addonPlanId: a.addonPlan.id,
    }));
    localActiveSub.user = s.user;
    console.log("active sub: ", localActiveSub);

    setSelectedPlan(s.planId.id);
    setUserProfile(s.user);

    let plans: IPlan[] = planListRes.data.data.Plans.map((p: any) => {
      const p2 = p.plan;
      if (p.plan.type == 2) {
        // 1: main plan, 2: addon
        // addon plan
        return null;
      }
      if (p.plan.status != 2) {
        // 1: editing, 2: active, 3: inactive, 4: expired
        return null;
      }

      return {
        id: p2.id,
        planName: p2.planName,
        description: p2.description,
        type: p2.type,
        amount: p2.amount,
        currency: p2.currency,
        intervalUnit: p2.intervalUnit,
        intervalCount: p2.intervalCount,
        status: p2.status,
        addons: p.addons,
      };
    });
    plans = plans.filter((p) => p != null);
    const planIdx = plans.findIndex((p) => p.id == s.planId.id);
    // let's say we have planA(which has addonA1, addonA2, addonA3), planB, planC, user has subscribed to planA, and selected addonA1, addonA3
    // I need to find the index of addonA1,3 in planA.addons array,
    // then set their {quantity, checked: true} props on planA.addons, these props value are from subscription.addons array.
    if (planIdx != -1 && plans[planIdx].addons != null) {
      for (let i = 0; i < plans[planIdx].addons!.length; i++) {
        const addonIdx =
          localActiveSub.addons == null
            ? -1
            : localActiveSub.addons.findIndex(
                (subAddon) =>
                  subAddon.addonPlanId == plans[planIdx].addons![i].id
              );
        if (addonIdx != -1) {
          plans[planIdx].addons![i].checked = true;
          plans[planIdx].addons![i].quantity =
            localActiveSub.addons[addonIdx].quantity;
        }
      }
    }
    setPlans(plans);
    localActiveSub.plan = plans.find((p) => p.id == localActiveSub.planId);
    setActiveSub(localActiveSub);
  };

  const onDueDateChange = (date: any, dateStr: string) => {
    console.log(date, "//", dateStr, "///", activeSub?.currentPeriodEnd);
    setNewDueDate(dateStr);
    toggleSetDueDateModal();
  };

  const onExtendDueDate = async () => {
    setLoading(true);
    let extendRes;
    try {
      const hours =
        daysBetweenDate(activeSub!.currentPeriodEnd * 1000, newDueDate) * 24;
      extendRes = await extendDueDate(activeSub!.subscriptionId, hours);
      console.log("extend due date res: ", extendRes);
      const code = extendRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(extendRes.data.message);
      }
    } catch (err) {
      setLoading(false);
      toggleSetDueDateModal();
      if (err instanceof Error) {
        console.log("err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
    setLoading(false);
    message.success("Due date extended");
    toggleSetDueDateModal();
    fetchData(); // better to call message.success in fetchData cb(add a cb parameter to fetchData)
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Spin spinning={loading} fullscreen />
      <TerminateSubModal
        isOpen={terminateModal}
        loading={loading}
        terminateMode={endSubMode}
        setTerminateMode={setEndSubMode}
        subInfo={activeSub}
        onCancel={toggleTerminateModal}
        onConfirm={onTerminateSub}
      />
      <ResumeSubModal
        isOpen={resumeModal}
        loading={loading}
        subInfo={activeSub}
        onCancel={toggleResumeSubModal}
        onConfirm={onResumeSub}
      />
      <ExtendSubModal
        isOpen={dueDateModal}
        loading={loading}
        subInfo={activeSub}
        newDueDate={newDueDate}
        onCancel={toggleSetDueDateModal}
        onConfirm={onExtendDueDate}
        // setDueDate={setDueDate}
      />

      <ChangePlanModal
        isOpen={changePlanModal}
        subInfo={activeSub}
        selectedPlanId={selectedPlan}
        plans={plans}
        setSelectedPlan={setSelectedPlan}
        onAddonChange={onAddonChange}
        onCancel={toggleChangPlanModal}
        onConfirm={openPreviewModal}
      />

      <UpdateSubPreviewModal
        isOpen={previewModalOpen}
        loading={confirmming}
        previewInfo={preview}
        onCancel={togglePreviewModal}
        onConfirm={onConfirm}
      />

      <UserInfoSection user={activeSub?.user || null} />
      <SubscriptionInfoSection
        subInfo={activeSub}
        onDueDateChange={onDueDateChange}
        refresh={fetchData}
        toggleTerminateModal={toggleTerminateModal}
        toggleResumeSubModal={toggleResumeSubModal}
        toggleChangPlanModal={toggleChangPlanModal}
      />
    </>
  );
};

export default Index;

const UserInfoSection = ({ user }: { user: IProfile | null }) => {
  /*
    const userInfo = [
      // how to map it
      { label: "First name", value: user.firstName },
      { label: "Last name", value: user.lastName },
      { label: "Email", value: user.firstName },
      { label: "Phone", value: user.phone },
      { label: "Country", value: user.countryName },
      { label: "Billing address", value: user.adress },
      { label: "Payment method", value: user.paymentMethod },
      { label: "VAT number", value: user.vATNumber },
    ];
    */

  if (user == null) {
    return null;
  }

  return (
    <div>
      <Divider orientation="left" style={{ margin: "16px 0" }}>
        User info
      </Divider>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>First name</span>
        </Col>
        <Col span={6}>{user?.firstName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Last name</span>
        </Col>
        <Col span={6}>{user?.lastName}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Email</span>
        </Col>
        <Col span={6}>
          <a href={user?.email}>{user?.email} </a>
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Phone</span>
        </Col>
        <Col span={6}>{user?.phone}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Country</span>
        </Col>
        <Col span={6}>{user?.countryName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Billing address</span>
        </Col>
        <Col span={6}>{user?.adress}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Payment method</span>
        </Col>
        <Col span={6}>{user?.paymentMethod}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>VAT number</span>
        </Col>
        <Col span={6}>{user?.vATNumber}</Col>
      </Row>
    </div>
  );
};

interface ISubSectionProps {
  subInfo: ISubscriptionType | null;
  onDueDateChange: (date: any, dateStr: string) => void;
  refresh: () => void;
  toggleTerminateModal: () => void;
  toggleResumeSubModal: () => void;
  toggleChangPlanModal: () => void;
}
const SubscriptionInfoSection = ({
  subInfo,
  onDueDateChange,
  refresh,
  toggleTerminateModal,
  toggleResumeSubModal,
  toggleChangPlanModal,
}: ISubSectionProps) => {
  return (
    <>
      <Divider orientation="left" style={{ margin: "32px 0" }}>
        Subscription info
      </Divider>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Plan</span>
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Plan description</span>
        </Col>
        <Col span={6}>{subInfo?.plan?.description}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Status</span>
        </Col>
        <Col span={6}>
          {subInfo && SUBSCRIPTION_STATUS[subInfo.status]}{" "}
          <span
            style={{ cursor: "pointer", marginLeft: "8px" }}
            onClick={refresh}
          >
            <SyncOutlined />
          </span>
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Subscription Id</span>
        </Col>
        <Col span={6}>{subInfo?.subscriptionId}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Plan price</span>
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Addons price</span>
        </Col>
        <Col span={6}>
          {subInfo &&
            subInfo.addons &&
            showAmount(
              subInfo!.addons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number }
                ) => sum + quantity * amount,
                0
              ),
              subInfo!.currency
            )}

          {subInfo && subInfo.addons && subInfo.addons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: "280px" }}>
                  {subInfo?.addons.map((a) => (
                    <Row key={a.id}>
                      <Col span={10}>{a.planName}</Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={" "}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: "8px", cursor: "pointer" }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Total amount</span>
        </Col>
        <Col span={6}>
          {subInfo?.amount && showAmount(subInfo.amount, subInfo.currency)}
        </Col>

        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Bill period</span>
        </Col>
        <Col span={6}>
          {subInfo != null && subInfo.plan != null
            ? `${subInfo.plan.intervalCount} ${subInfo.plan.intervalUnit}`
            : ""}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>First pay</span>
        </Col>
        <Col span={6}>{subInfo?.firstPayTime}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Next due date</span>
        </Col>
        <Col span={6}>
          {subInfo && (
            <DatePicker
              format="YYYY-MM-DD"
              allowClear={false}
              onChange={onDueDateChange}
              // defaultValue={dayjs()}
              value={dayjs(new Date(subInfo.currentPeriodEnd * 1000))}
              disabledDate={(d) =>
                d.isBefore(
                  new Date(
                    subInfo?.currentPeriodEnd * 1000 + 1000 * 60 * 60 * 24
                  )
                )
              }
            />
          )}
          {/* activeSub?.currentPeriodEnd &&
              new Date(activeSub?.currentPeriodEnd * 1000).toLocaleDateString() */}
        </Col>
      </Row>

      {subInfo && subInfo.status == 2 && (
        <div
          style={{
            margin: "24px 0",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "36px",
          }}
        >
          <Button onClick={toggleChangPlanModal}>Change plan</Button>
          {subInfo.cancelAtPeriodEnd == 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Button onClick={toggleTerminateModal}>End subscription</Button>
              {/* <Radio.Group onChange={onEndSubModeChange} value={endSubMode}>
                  <Radio value={1}>immediately</Radio>
                  <Radio value={2}>end of this cycle</Radio>
            </Radio.Group> */}
            </div>
          ) : (
            <div>
              <span>Subscription will end on </span>
              <span style={{ color: "red", marginRight: "8px" }}>
                {subInfo &&
                  // new Date(activeSub!.trialEnd * 1000).toLocaleString()
                  new Date(subInfo!.currentPeriodEnd * 1000).toLocaleString()}
              </span>
              <Button onClick={toggleResumeSubModal}>Resume</Button>
            </div>
          )}
        </div>
      )}
      <Divider orientation="left" style={{ margin: "32px 0" }}>
        Subscription History
      </Divider>
    </>
  );
};
