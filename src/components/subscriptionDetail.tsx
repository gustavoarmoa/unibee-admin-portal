import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Space,
  Table,
  Tag,
  Button,
  Form,
  Input,
  Select,
  message,
  Spin,
  Modal,
} from "antd";
import { getPlanList, getSubDetail } from "../requests";
import { ISubscriptionType, IPlan } from "../shared.types";
import update from "immutability-helper";
import Plan from "./plan";

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null); // null: not selected
  const [modalOpen, setModalOpen] = useState(false);
  // const [preview, setPreview] = useState<IPreview | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [terminateModal, setTerminateModal] = useState(false);
  const [activeSub, setActiveSub] = useState<ISubscriptionType | null>(null); // null: when page is loading, no data is ready yet.

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value
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

  useEffect(() => {
    // const subId = location.state && location.state.subscriptionId;
    const pathName = window.location.pathname.split("/");
    const subId = pathName.pop();
    if (subId == null) {
      return;
    }
    const fetchData = async () => {
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
        if (err instanceof Error) {
          console.log("err: ", err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
        return;
      }

      //   Quantity: number;
      //   AddonPlanId: number;
      const s: any = subDetailRes.data.data;
      const localActiveSub: ISubscriptionType = { ...s.subscription };
      localActiveSub.addons = s.addons.map((a: any) => ({
        ...a.AddonPlan,
        Quantity: a.Quantity,
        AddonPlanId: a.AddonPlan.id,
      }));
      console.log("active sub: ", localActiveSub);
      setActiveSub(s.subscription);
      setSelectedPlan(s.planId.id);

      let plans: IPlan[] = planListRes.data.data.Plans.map((p: any) => {
        const p2 = p.plan;
        if (p.plan.type == 2) {
          // addon plan
          return null;
        }
        if (
          p.plan.id != 31 &&
          p.plan.id != 37 &&
          p.plan.id != 38 &&
          p.plan.id != 32 &&
          p.plan.id != 41
        ) {
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
          const addonIdx = localActiveSub.addons.findIndex(
            (subAddon) => subAddon.AddonPlanId == plans[planIdx].addons![i].id
          );
          if (addonIdx != -1) {
            plans[planIdx].addons![i].checked = true;
            plans[planIdx].addons![i].quantity =
              localActiveSub.addons[addonIdx].Quantity;
          }
        }
      }
      setPlans(plans);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <>
      <Spin spinning={loading} fullscreen />
      {contextHolder}
      {/* <Modal
        title="Terminate Subscription"
        open={terminateModal}
        onOk={onTerminateSub}
        onCancel={() => setTerminateModal(false)}
      >
        <div>subscription detail here</div>
  </Modal> */}
      {/* selectedPlan != null && (
        <Modal
          title="Subscription Update Preview"
          open={modalOpen}
          onOk={onConfirm}
          onCancel={toggleModal}
          width={"640px"}
        >
          {preview && (
            <>
              {preview.invoices.map((i, idx) => (
                <Row key={idx} gutter={[16, 16]}>
                  <Col span={6}>{`${showAmount(i.amount, i.currency)}`}</Col>
                  <Col span={18}>{i.description}</Col>
                </Row>
              ))}
              <hr />
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <span style={{ fontSize: "18px" }}>Total</span>
                </Col>
                <Col span={18}>
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {" "}
                    {`${showAmount(preview.totalAmount, preview.currency)}`}
                  </span>
                </Col>
              </Row>
            </>
          )}
        </Modal>
              ) */}
      <div
        style={{
          height: "64px",
          border: "1px solid #EEE",
          borderRadius: "6px",
          padding: "8px",
        }}
      >
        User Info
      </div>
      <div style={{ display: "flex", gap: "18px" }}>
        {plans.map((p) => (
          <Plan
            key={p.id}
            plan={p}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            onAddonChange={onAddonChange}
            isActive={p.id == activeSub?.planId}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "68px",
        }}
      >
        {plans.length != 0 && (
          <>
            <Button
              type="primary"
              onClick={() => {
                console.log("open modal");
              }}
              disabled={selectedPlan == null}
            >
              Confirm
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button type="primary" onClick={() => setTerminateModal(true)}>
              Terminate Subscription
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default Index;
