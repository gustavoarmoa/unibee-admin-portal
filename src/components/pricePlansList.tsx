import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Space, Table, Tag, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  MinusOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  SettingFilled,
  SmileOutlined,
  SyncOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  // BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  // Link,
} from "react-router-dom";

const CURRENCY_SYMBOL: { [key: string]: string } = {
  CNY: "¥",
  USD: "$",
};

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

interface DataType {
  // key: string;
  id: number;
  planName: string; // plan name
  description: string;
  // age: number;
  // address: string;
  amount: number;
  currency: string;
  intervalUnit: string;
  intervalCount: number;

  price: string;
  // tags: string[];
  isPublished: boolean;
}

const columns: ColumnsType<DataType> = [
  {
    title: "Name",
    dataIndex: "planName",
    key: "planName",
    render: (text) => <a>{text}</a>,
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
  },
  {
    title: "Price",
    dataIndex: "price",
    key: "price",
    render: (_, p) => {
      return (
        <span>{`${CURRENCY_SYMBOL[p.currency]} ${p.amount}/${p.intervalCount}${
          p.intervalUnit
        } `}</span>
      );
    },
  },
  {
    title: "is published",
    dataIndex: "isPublished",
    key: "isPublished",
    render: (_, isPublished) =>
      isPublished ? (
        <CheckCircleOutlined style={{ color: "green" }} />
      ) : (
        <MinusOutlined style={{ color: "red" }} />
      ),
  },
  {
    title: "Action",
    key: "action",
    render: (_, record) => (
      <Space size="middle">
        <a>Edit</a>
        {/* <a>Delete</a> */}
      </Space>
    ),
  },
];

const Index = () => {
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DataType[]>([]);

  const normalize = (data: any): DataType[] => {
    // console.log("normalize: ", data);
    const plans = data.map((d: any) => {
      return {
        id: d.plan.id,
        amount: d.plan.amount,
        planName: d.plan.planName,
        description: d.plan.description,
        currency: d.plan.currency,
        intervalCount: d.plan.intervalCount,
        intervalUnit: d.plan.intervalUnit,
        isPublished: true,
      };
    });
    // console.log("after norM: ", plans);
    return plans;
  };

  useEffect(() => {
    const token = localStorage.getItem("merchantToken");
    axios
      .post(
        `${API_URL}/merchant/plan/subscription_plan_list`,
        {
          merchantId: 15621,
          type: 1,
          status: 0,
          currency: "usd",
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("subscription list res: ", res);
        const statuCode = res.data.code;
        if (statuCode != 0) {
          if (statuCode == 61) {
            console.log("invalid token");
            navigate(`${APP_PATH}login`, {
              state: { msg: "session expired, please re-login" },
            });
            return;
          }
          throw new Error(res.data.message);
        }
        setPlan(normalize(res.data.data.Plans));
      })
      .catch((err) => {
        console.log("get subscription list err: ", err);
        setErrMsg(err.message);
      });
  }, []);

  return (
    <>
      <div
        style={{ padding: "16px 0", display: "flex", justifyContent: "end" }}
      >
        <Button
          type="primary"
          onClick={() => {
            navigate(`${APP_PATH}price-plan/new`);
          }}
        >
          New plan
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={plan}
        rowKey={"id"}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log("row click: ", record, "///", rowIndex);
              navigate(`${APP_PATH}price-plan/${record.id}`);
            }, // click row
            // onDoubleClick: (event) => {}, // double click row
            // onContextMenu: (event) => {}, // right button click row
            // onMouseEnter: (event) => {}, // mouse enter row
            // onMouseLeave: (event) => {}, // mouse leave row
          };
        }}
      />
    </>
  );
};

export default Index;
