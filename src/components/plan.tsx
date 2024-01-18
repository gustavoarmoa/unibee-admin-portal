import React, { useEffect, useState } from "react";
import { Checkbox, Input } from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { showAmount } from "../helpers";
// import { ISubscriptionType, IPlan } from "../shared.types";
import { IPlan } from "../shared.types";

/*
interface IAddon extends IPlan {
  quantity: number | null;
  checked: boolean;
}

interface IPlan {
  id: number;
  planName: string;
  description: string;
  type: number; // 1: main plan, 2: add-on
  amount: number;
  currency: string;
  intervalUnit: string;
  intervalCount: number;
  status: number;
  addons?: IAddon[];
}

*/

interface IPLanProps {
  plan: IPlan;
  selectedPlan: number | null;
  isActive: boolean; // whether current plan is the one user has subscribed(Y: highlight it)
  setSelectedPlan: (p: number) => void;
  onAddonChange: (
    addonId: number,
    quantity: number | null,
    checked: boolean | null
  ) => void;
}

const Index = ({
  plan,
  selectedPlan,
  isActive,
  setSelectedPlan,
  onAddonChange,
}: IPLanProps) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const addonCheck = (addonId: number) => (e: CheckboxChangeEvent) => {
    onAddonChange(addonId, null, e.target.checked);
  };
  const addonQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddonChange(Number(e.target.id), Number(e.target.value), null);
  };

  useEffect(() => {
    let amount = plan.amount;
    if (plan.addons != null && plan.addons.length > 0) {
      plan.addons.forEach((a) => {
        if (a.checked && Number.isInteger(Number(a.quantity))) {
          amount += Number(a.amount) * Number(a.quantity);
        }
      });
      if (isNaN(amount)) {
        amount = plan.amount;
      }
    }
    setTotalAmount(amount);
  }, [plan]);

  return (
    <div>
      <div
        style={{
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isActive ? (
          <span style={{ color: "orange" }}>Current Subscription</span>
        ) : null}
      </div>
      <div
        onClick={() => setSelectedPlan(plan.id)}
        style={{
          width: "240px",
          height: "320px",
          padding: "8px",
          border: `1px solid ${isActive ? "orange" : "#EEE"}`,
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "24px",
          background: selectedPlan == plan.id ? "#FFF" : "#FBFBFB",
          boxShadow:
            selectedPlan == plan.id
              ? "rgba(0, 0, 0, 0.35) 0px 5px 15px"
              : "unset",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: "28px" }}>{plan.planName}</div>
        <div>{plan.description}</div>

        {plan.addons && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {plan.addons.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Checkbox onChange={addonCheck(a.id)} checked={a.checked}>
                  <div style={{ display: "flex" }}>
                    <div>
                      <div
                        style={{
                          width: "120px",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.planName}
                      </div>
                      <div style={{ fontSize: "11px" }}>{` ${showAmount(
                        a.amount,
                        a.currency
                      )}/${a.intervalCount == 1 ? "" : a.intervalCount}${
                        a.intervalUnit
                      }`}</div>
                    </div>

                    <Input
                      id={a.id.toString()}
                      value={a.quantity || 0}
                      onChange={addonQuantityChange}
                      disabled={!a.checked}
                      size="small"
                      style={{ width: "64px", height: "24px" }}
                      placeholder="count"
                    />
                  </div>
                </Checkbox>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: "14px" }}>{`${showAmount(
          plan.amount,
          plan.currency
        )}/${plan.intervalCount == 1 ? "" : plan.intervalCount}${
          plan.intervalUnit
        }`}</div>
        <div style={{ fontSize: "24px" }}>
          Total:&nbsp;
          {`${showAmount(totalAmount, plan.currency)}/${
            plan.intervalCount == 1 ? "" : plan.intervalCount
          }${plan.intervalUnit}`}
        </div>
      </div>
    </div>
  );
};

export default Index;