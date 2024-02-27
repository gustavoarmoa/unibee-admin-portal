import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Pagination,
  Popover,
  Row,
  Spin,
  Table,
  message,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import update from 'immutability-helper';
import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { SUBSCRIPTION_STATUS } from '../../constants';
import { daysBetweenDate, showAmount } from '../../helpers';
import { useRelogin } from '../../hooks';
import {
  createPreviewReq,
  extendDueDate,
  getPlanList,
  getPlanList2,
  getSubDetail,
  getSubTimeline,
  resumeSub,
  setSimDateReq,
  terminateSub,
  updateSubscription,
} from '../../requests';
import {
  IPlan,
  IPreview,
  IProfile,
  ISubscriptionType,
} from '../../shared.types';
import { useAppConfigStore } from '../../stores';
import CancelPendingSubModal from './modals/cancelPendingSub';
import ChangePlanModal from './modals/changePlan';
import ExtendSubModal from './modals/extendSub';
import ResumeSubModal from './modals/resumeSub';
import TerminateSubModal from './modals/terminateSub';
import UpdateSubPreviewModal from './modals/updateSubPreview';

import '../../shared.css';
// const APP_PATH = import.meta.env.BASE_URL;

const Index = ({ setUserId }: { setUserId: (userId: number) => void }) => {
  // const navigate = useNavigate();
  // const appConfigStore = useAppConfigStore();
  const relogin = useRelogin();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [confirmming, setConfirming] = useState(false);
  const [dueDateModal, setDueDateModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [changePlanModal, setChangePlanModal] = useState(false);
  const [cancelSubModalOpen, setCancelSubModalOpen] = useState(false); // newly created sub has status == created if user hasn't paid yet, user(or admin) can cancel this sub.
  const [preview, setPreview] = useState<IPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminateModal, setTerminateModal] = useState(false);
  const [resumeModal, setResumeModal] = useState(false);
  const [activeSub, setActiveSub] = useState<ISubscriptionType | null>(null); // null: when page is loading, no data is ready yet.
  const [endSubMode, setEndSubMode] = useState<1 | 2 | null>(null); // 1: immediate, 2: end of this billing cycole, null: not selected
  // const [simDate, setSimDate] = useState('');
  const [simDateOpen, setSimDateOpen] = useState(false);
  const simDateContainerRef = useRef(null);
  const hideSimDate = () => setSimDateOpen(false);
  useOnClickOutside(simDateContainerRef, hideSimDate);

  const toggleTerminateModal = () => setTerminateModal(!terminateModal);
  const toggleResumeSubModal = () => setResumeModal(!resumeModal);
  const toggleSetDueDateModal = () => setDueDateModal(!dueDateModal);
  const toggleChangPlanModal = () => setChangePlanModal(!changePlanModal);
  const toggleCancelSubModal = () => setCancelSubModalOpen(!cancelSubModalOpen);

  const onSimDateChange = async (date: any, dateString: string) => {
    console.log(
      date,
      '///',
      dateString,
      '///',
      dayjs(new Date(dateString)).unix(),
    );
    try {
      const res = await setSimDateReq(
        activeSub?.subscriptionId as string,
        dayjs(new Date(dateString)).unix(),
      );
      console.log('set sim date res: ', res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      message.success('New simulation date set.');
      fetchData();
      toggleSimDateOpen();
    } catch (err) {
      if (err instanceof Error) {
        console.log('err creating preview: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };
  const toggleSimDateOpen = () => setSimDateOpen(!simDateOpen);

  const showSimDatePicker = () => {
    if (
      activeSub == null ||
      activeSub.testClock == null ||
      activeSub.testClock < 0
    ) {
      return false;
    }
    return true;
  };

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value. I don't want to define 2 fn to do similar jobs.
    checked: boolean | null, // ditto
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
          console.log('q: ', q);
          if (!Number.isInteger(q) || q <= 0) {
            valid = false;
            break;
          }
        }
      }
    }
    if (!valid) {
      message.error('Addon quantity must be greater than 0.');
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
    console.log('active sub addon bfr preview: ', addons);
    let previewRes;
    try {
      previewRes = await createPreviewReq(
        activeSub!.subscriptionId,
        selectedPlan as number,
        addons.map((a) => ({
          quantity: a.quantity as number,
          addonPlanId: a.id,
        })),
      );
      console.log('subscription update preview res: ', previewRes);
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
        console.log('err creating preview: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
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
        preview?.prorationDate as number,
      );
      setConfirming(false);
      console.log('update subscription submit res: ', updateSubRes);
      const code = updateSubRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(updateSubRes.data.message);
      }
    } catch (err) {
      setConfirming(false);
      setPreviewModalOpen(false);
      if (err instanceof Error) {
        console.log('err submitting plan update: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }

    if (updateSubRes.data.data.paid) {
      message.success('Plan updated');
    } else {
      message.success('Plan updated, but not paid');
    }
    togglePreviewModal();
    toggleChangPlanModal();
    fetchData();
  };

  const onTerminateSub = async () => {
    if (endSubMode == null) {
      message.error('Please choose when to end this subscription');
      return;
    }
    try {
      setLoading(true);
      const terminateRes = await terminateSub(
        activeSub?.subscriptionId as string,
        endSubMode == 1,
      );
      console.log('terminate sub res: ', terminateRes);
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
          ? 'Subscription ended'
          : 'Subscription will end on the end of this billing cycle',
      );
      setEndSubMode(null); // force users to choose a endMode before submitting.
      fetchData();
    } catch (err) {
      setLoading(false);
      // setTerminateModal(false);
      toggleTerminateModal();
      if (err instanceof Error) {
        console.log('err terminating sub: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const onResumeSub = async () => {
    try {
      setLoading(true);
      const resumeRes = await resumeSub(activeSub?.subscriptionId as string);
      console.log('resume sub res: ', resumeRes);
      const code = resumeRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(resumeRes.data.message);
      }
      setLoading(false);
      // setResumeModal(false);
      toggleResumeSubModal();
      message.success('Subscription resumed.');
      fetchData();
    } catch (err) {
      setLoading(false);
      // setResumeModal(false);
      toggleResumeSubModal();
      if (err instanceof Error) {
        console.log('err resuming sub: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  // fetch current subscription detail, and all active plans.
  const fetchData = async () => {
    // const subId = location.state && location.state.subscriptionId;
    const pathName = window.location.pathname.split('/');
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
        getPlanList2({
          type: 1,
          status: 2,
          page: 0,
          count: 100,
        }), // type:1 (main plan), status: 2 (active), let's assume there are at most 100 active plan
      ]));
      console.log('subDetail/planList: ', subDetailRes, '//', planListRes);
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
        console.log('err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
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
    localActiveSub.unfinishedSubscriptionPendingUpdate =
      s.unfinishedSubscriptionPendingUpdate;
    if (localActiveSub.unfinishedSubscriptionPendingUpdate != null) {
      if (
        localActiveSub.unfinishedSubscriptionPendingUpdate.updateAddons != null
      ) {
        localActiveSub.unfinishedSubscriptionPendingUpdate.updateAddons =
          localActiveSub.unfinishedSubscriptionPendingUpdate.updateAddons.map(
            (a: any) => ({
              ...a.addonPlan,
              quantity: a.quantity,
              addonPlanId: a.addonPlan.id,
            }),
          );
      }
    }

    /*
interface ISubAddon extends IPlan {
  // when update subscription plan, I need to know which addons users have selected,
  // then apply them on the plan
  quantity: number;
  addonPlanId: number;
}
    */

    console.log('active sub: ', localActiveSub);

    setSelectedPlan(s.plan.id);
    setUserId(s.user.id);

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
    const planIdx = plans.findIndex((p) => p.id == s.plan.id);
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
                  subAddon.addonPlanId == plans[planIdx].addons![i].id,
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
    console.log(date, '//', dateStr, '///', activeSub?.currentPeriodEnd);
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
      console.log('extend due date res: ', extendRes);
      const code = extendRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(extendRes.data.message);
      }
    } catch (err) {
      setLoading(false);
      toggleSetDueDateModal();
      if (err instanceof Error) {
        console.log('err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }
    setLoading(false);
    message.success('Due date extended');
    toggleSetDueDateModal();
    fetchData(); // better to call message.success in fetchData cb(add a cb parameter to fetchData)
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div
        style={{
          display: showSimDatePicker() ? 'flex' : 'none',
          width: '540px',
        }}
        className="fixed right-8 top-2 flex h-12 items-center justify-between rounded-md bg-indigo-500 px-2 py-2 text-white"
      >
        <div>
          <span>current simulation time: &nbsp;</span>
          <span>
            {activeSub?.testClock}
            {/* activeSub != null && activeSub.testClock! > 0
              ? dayjs(new Date(activeSub.testClock! * 1000)).format(
                  'YYYY-MM-DD HH:mm:ss',
                )
              : '' */}
          </span>
        </div>
        <div ref={simDateContainerRef}>
          <Button onClick={toggleSimDateOpen}>Advance Time</Button>
          <DatePicker
            value={dayjs(
              activeSub == null || activeSub.testClock === 0
                ? new Date()
                : new Date(activeSub!.testClock! * 1000),
            )}
            onChange={onSimDateChange}
            open={simDateOpen}
            onBlur={toggleSimDateOpen}
            showTime
            showNow={false}
            getPopupContainer={(trigger: HTMLElement) =>
              trigger.parentNode as HTMLElement
            }
            style={{ visibility: 'hidden', width: 0, height: 0 }}
            format={'YYYY-MMM-DD HH:mm:ss'}
          />
        </div>
      </div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />{' '}
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
      {cancelSubModalOpen && (
        <CancelPendingSubModal
          subInfo={activeSub}
          closeModal={toggleCancelSubModal}
          refresh={fetchData}
        />
      )}
      {/* <UserInfoSection user={activeSub?.user || null} /> */}
      <SubscriptionInfoSection
        subInfo={activeSub}
        plans={plans}
        onDueDateChange={onDueDateChange}
        refresh={fetchData}
        toggleTerminateModal={toggleTerminateModal}
        toggleResumeSubModal={toggleResumeSubModal}
        toggleChangPlanModal={toggleChangPlanModal}
        toggleCancelSubModal={toggleCancelSubModal}
      />
    </>
  );
};

export default Index;

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px',
};
const colStyle: CSSProperties = { fontWeight: 'bold' };

interface ISubSectionProps {
  subInfo: ISubscriptionType | null;
  plans: IPlan[];
  onDueDateChange: (date: any, dateStr: string) => void;
  refresh: () => void;
  toggleTerminateModal: () => void;
  toggleResumeSubModal: () => void;
  toggleChangPlanModal: () => void;
  toggleCancelSubModal: () => void;
}
const SubscriptionInfoSection = ({
  subInfo,
  plans,
  onDueDateChange,
  refresh,
  toggleTerminateModal,
  toggleResumeSubModal,
  toggleChangPlanModal,
  toggleCancelSubModal,
}: ISubSectionProps) => {
  return (
    <>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={4} style={colStyle}>
          Plan Description
        </Col>
        <Col span={6}>{subInfo?.plan?.description}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {subInfo && SUBSCRIPTION_STATUS[subInfo.status]}{' '}
          <span
            style={{ cursor: 'pointer', marginLeft: '8px' }}
            onClick={refresh}
          >
            <SyncOutlined />
          </span>
          {subInfo && subInfo.status == 1 && (
            <Button type="link" onClick={toggleCancelSubModal}>
              Cancel
            </Button>
          )}
        </Col>
        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>{subInfo?.subscriptionId}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan Price
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Addons Price
        </Col>
        <Col span={6}>
          {subInfo &&
            subInfo.addons &&
            showAmount(
              subInfo!.addons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number },
                ) => sum + quantity * amount,
                0,
              ),
              subInfo!.currency,
            )}

          {subInfo && subInfo.addons && subInfo.addons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: '280px' }}>
                  {subInfo?.addons.map((a) => (
                    <Row key={a.id}>
                      <Col span={10}>{a.planName}</Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={' '}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Total Amount
        </Col>
        <Col span={6}>
          {subInfo?.amount && showAmount(subInfo.amount, subInfo.currency)}
          {subInfo && subInfo.taxScale && subInfo.taxScale != 0 ? (
            <span className="text-xs text-gray-500">
              {` (${subInfo.taxScale / 100}% tax incl)`}
            </span>
          ) : null}
        </Col>

        <Col span={4} style={colStyle}>
          Bill Period
        </Col>
        <Col span={6}>
          {subInfo != null && subInfo.plan != null
            ? `${subInfo.plan.intervalCount} ${subInfo.plan.intervalUnit}`
            : ''}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          First pay
        </Col>
        <Col span={6}>
          {subInfo && subInfo.firstPaidTime && (
            <span>
              {' '}
              {dayjs(new Date(subInfo.firstPaidTime * 1000)).format(
                'YYYY-MMM-DD',
              )}
            </span>
          )}
        </Col>
        <Col span={4} style={colStyle}>
          Next due date
        </Col>
        <Col span={10}>
          {subInfo && (
            <DatePicker
              format="YYYY-MMM-DD"
              allowClear={false}
              onChange={onDueDateChange}
              value={dayjs(new Date(subInfo.currentPeriodEnd * 1000))}
              disabledDate={(d) =>
                d.isBefore(
                  new Date(
                    subInfo?.currentPeriodEnd * 1000 + 1000 * 60 * 60 * 24,
                  ),
                )
              }
            />
          )}
          {subInfo != null &&
            subInfo.trialEnd != 0 &&
            subInfo.trialEnd > subInfo.currentPeriodEnd && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#f44336',
                  marginLeft: '6px',
                }}
              >
                +
                {daysBetweenDate(
                  subInfo.currentPeriodEnd * 1000,
                  subInfo.trialEnd * 1000,
                )}{' '}
                days →{' '}
                {dayjs(new Date(subInfo.trialEnd * 1000)).format('YYYY-MMM-DD')}
              </span>
            )}
        </Col>
      </Row>

      {subInfo && subInfo.status == 2 && (
        <div
          style={{
            margin: '24px 0',
            display: 'flex',
            justifyContent: 'start',
            alignItems: 'center',
            gap: '36px',
          }}
        >
          <Button onClick={toggleChangPlanModal}>Change Plan</Button>
          {subInfo.cancelAtPeriodEnd == 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button onClick={toggleTerminateModal}>End Subscription</Button>
            </div>
          ) : (
            <div>
              <span>Subscription will end on </span>
              <span style={{ color: 'red', marginRight: '8px' }}>
                {subInfo &&
                  // new Date(activeSub!.trialEnd * 1000).toLocaleString()
                  new Date(subInfo!.currentPeriodEnd * 1000).toLocaleString()}
              </span>
              <Button onClick={toggleResumeSubModal}>Resume</Button>
            </div>
          )}
        </div>
      )}
      {subInfo?.unfinishedSubscriptionPendingUpdate && (
        <PendingUpdateSection subInfo={subInfo} />
      )}
      <SubTimeline userId={subInfo?.userId} plans={plans} />
    </>
  );
};

const PendingUpdateSection = ({ subInfo }: { subInfo: ISubscriptionType }) => {
  const i = subInfo.unfinishedSubscriptionPendingUpdate;
  return (
    <>
      <Divider orientation="left" style={{ margin: '32px 0' }}>
        Pending Update
      </Divider>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>{i!.updatePlan.planName}</Col>
        <Col span={4} style={colStyle}>
          Plan Description
        </Col>
        <Col span={6}>{i!.updatePlan.description}</Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan Price
        </Col>
        <Col span={6}>
          {showAmount(i!.updatePlan.amount, i!.updatePlan.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Addons Price
        </Col>
        <Col span={6}>
          {i?.updateAddons &&
            showAmount(
              i.updateAddons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number },
                ) => sum + quantity * amount,
                0,
              ),
              i.updateCurrency,
            )}

          {i?.updateAddons && i.updateAddons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: '280px' }}>
                  {i?.updateAddons.map((a) => (
                    <Row key={a.id}>
                      <Col span={10}>{a.planName}</Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={' '}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Proration Amount
        </Col>
        <Col span={6}>{showAmount(i!.prorationAmount, i!.updateCurrency)}</Col>
        <Col span={4} style={colStyle}>
          <span>Paid</span>
        </Col>
        <Col span={6}>
          {i!.paid == 1 ? (
            <CheckCircleOutlined style={{ color: 'green' }} />
          ) : (
            <MinusOutlined style={{ color: 'red' }} />
          )}
          {i!.link != '' && (
            <a
              href={i!.link}
              target="_blank"
              style={{ marginLeft: '8px', fontSize: '11px' }}
            >
              Payment Link
            </a>
          )}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Total Amount
        </Col>
        <Col span={6}>
          {' '}
          {showAmount(i!.updateAmount, i!.updatePlan.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Bill Period
        </Col>
        <Col span={6}>
          {`${i!.updatePlan.intervalCount} ${i!.updatePlan.intervalUnit}`}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Effective Date
        </Col>
        <Col span={6}>
          {new Date(i!.effectTime * 1000).toLocaleDateString()}
        </Col>
        <Col span={4} style={colStyle}>
          Note
        </Col>
        <Col span={6}>{i?.note}</Col>
      </Row>
    </>
  );
};

// -------------
type SubTimeline = {
  currency: string;
  id: number;
  planId: number;
  planName: string;
  periodStart: number;
  periodEnd: number;
  subscriptionId: string;
  invoiceId: string;
};

const SubTimeline = ({
  userId,
  plans,
}: {
  userId: number | undefined;
  plans: IPlan[];
}) => {
  const relogin = useRelogin();
  // const appConfigStore = useAppConfigStore();
  // parent updated, how can I knwo that, and update myself
  const [timeline, setTimeline] = useState<SubTimeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const columns: ColumnsType<SubTimeline> = [
    {
      title: 'Plan',
      dataIndex: 'planId',
      key: 'planId',
      render: (planId) => plans.find((p) => p.id == planId)?.planName,
    },
    {
      title: 'Start',
      dataIndex: 'periodStart',
      key: 'periodStart',
      render: (d) => dayjs(d * 1000).format('YYYY-MMM-DD'), // new Date(d * 1000).toLocaleDateString(),
    },
    {
      title: 'End',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d) => dayjs(d * 1000).format('YYYY-MMM-DD'), // new Date(d * 1000).toLocaleDateString(),
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
    },
  ];

  const fetchTimeline = async () => {
    if (userId == null) {
      return;
    }
    try {
      setLoading(true);
      const timelineRes = await getSubTimeline({
        userId,
        page,
        count: PAGE_SIZE,
      });
      setLoading(false);
      console.log('timeline res: ', timelineRes);
      const code = timelineRes.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(timelineRes.data.message);
      }
      setTimeline(timelineRes.data.data.subscriptionTimeLines);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err getting sub timeline: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const onPageChange = (page: number, pageSize: number) => {
    setPage(page - 1);
  };

  useEffect(() => {
    fetchTimeline();
  }, [page]);

  useEffect(() => {
    fetchTimeline();
  }, [userId]);
  return (
    <>
      <Divider orientation="left" style={{ margin: '32px 0' }}>
        Subscription History
      </Divider>
      <Table
        columns={columns}
        dataSource={timeline}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              // console.log("row click: ", record, "///", rowIndex);
              // navigate(`${APP_PATH}plan/${record.id}`);
            },
          };
        }}
      />
      <div className="my-5 flex justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={500}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </>
  );
};
