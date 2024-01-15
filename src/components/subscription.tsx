import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Space, Table, Tag, Button, Form, Input, Select, message } from "antd";
import { getSublist } from "../requests";
import type { ColumnsType } from "antd/es/table";
import { showAmount } from "../helpers";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

interface IPlan {
  id: number;
  planName: string;
  description: string;
  currency: number;
  intervalCount: number;
  intervalUnit: string;
  amount: number;
}

interface IAddon extends IPlan {
  Quantity: number;
}

interface ISubscriptionType {
  id: number;
  subscriptionId: string;
  planId: number;
  userId: number;
  plan: IPlan;
  addons: [IAddon] | null;
  status: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
}

const columns: ColumnsType<ISubscriptionType> = [
  {
    title: "Plan name",
    dataIndex: "planName",
    key: "planName",
    render: (_, sub) => <a>{sub.plan.planName}</a>,
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
    render: (_, sub) => <a>{sub.plan.description}</a>,
  },
  {
    title: "Amount",
    dataIndex: "amount",
    key: "amount",
    render: (_, s) => {
      return (
        <span>{` ${showAmount(
          s.plan.amount +
            (s.addons == null
              ? 0
              : s.addons!.reduce(
                  // total subscription amount = plan amount + all addons(amount * quantity)
                  (
                    sum,
                    { Quantity, amount }: { Quantity: number; amount: number } // destructure the quantity and amount from addon obj
                  ) => {
                    return sum + Quantity * amount;
                  },
                  0
                )),
          s.plan.currency
        )} /${s.plan.intervalCount == 1 ? "" : s.plan.intervalCount}${
          s.plan.intervalUnit
        } `}</span>
      );
    },
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (_, sub) => {
      return <span>{sub.status}</span>;
    },
  },
  {
    title: "Start",
    dataIndex: "currentPeriodStart",
    key: "currentPeriodStart",
    render: (_, sub) => {
      return <span>{sub.currentPeriodStart}</span>;
    },
  },
  {
    title: "End",
    dataIndex: "currentPeriodEnd",
    key: "currentPeriodEnd",
    render: (_, sub) => {
      return <span>{sub.currentPeriodEnd}</span>;
    },
  },
  {
    title: "User",
    dataIndex: "userId",
    key: "userId",
  },
];

const Index = () => {
  const [subList, setSubList] = useState<ISubscriptionType[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  useEffect(() => {
    const fetchData = async () => {
      let subListRes;
      try {
        subListRes = await getSublist();
        console.log("sublist res: ", subListRes);
        const code = subListRes.data.code;
        code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
        if (code != 0) {
          // TODO: save all the code as ENUM in constant,
          throw new Error(subListRes.data.message);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log("err getting sub list: ", err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
        return;
      }
      const list: ISubscriptionType[] = subListRes.data.data.Subscriptions.map(
        (s: any) => {
          return {
            ...s.Subscription,
            plan: s.Plan,
            addons:
              s.Addons == null
                ? []
                : s.Addons.map((a: any) => ({
                    ...a.AddonPlan,
                    Quantity: a.Quantity,
                  })),
          };
        }
      );
      setSubList(list);
    };

    fetchData();
  }, []);

  return (
    <div>
      <Table
        columns={columns}
        dataSource={subList}
        rowKey={"id"}
        pagination={false}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log("row click: ", record, "///", rowIndex);
              // navigate(`${APP_PATH}price-plan/${record.id}`);
            }, // click row
            // onDoubleClick: (event) => {}, // double click row
            // onContextMenu: (event) => {}, // right button click row
            // onMouseEnter: (event) => {}, // mouse enter row
            // onMouseLeave: (event) => {}, // mouse leave row
          };
        }}
      />
    </div>
  );
};

export default Index;
