import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Space, Table, Tag } from "antd";
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
    render: (_, p, idx) => {
      console.log("abcidx: ", "/", p, "/", idx);
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
    console.log("normalize: ", data);
    let plans = data.map((d: any) => {
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
    console.log("after norM: ", plans);
    return plans;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .post(
        `${API_URL}/subscription/v1/subscription_plan_list`,
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
            throw new Error(res.data.message);
          }
          setErrMsg(res.data.message);
        }
        setPlan(normalize(res.data.data.Plans));
      })
      .catch((err) => {
        console.log("get subscription list err: ", err);
        setErrMsg(err.message);
      });
  }, []);

  return <Table columns={columns} dataSource={plan} rowKey={"id"} />;
};

export default Index;
