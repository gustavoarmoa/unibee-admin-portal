import React, { CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Divider, Row, Table, Tabs, message } from "antd";
import type { TabsProps } from "antd";
import { Checkbox } from "antd";
import type { CheckboxProps } from "antd";
import { IProfile } from "../shared.types";
import { ColumnsType } from "antd/es/table";
import { SUBSCRIPTION_STATUS } from "../constants";
import { LoadingOutlined } from "@ant-design/icons";
import { searchUserReq } from "../requests";
import { ramdonString } from "../helpers";

const columns: ColumnsType<IProfile> = [
  {
    title: "First Name",
    dataIndex: "firstName",
    key: "firstName",
    // render: (text) => <a>{text}</a>,
  },
  {
    title: "Last Name",
    dataIndex: "lastName",
    key: "lastName",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
  },
  {
    title: "Created at",
    dataIndex: "gmtCreate",
    key: "gmtCreate",
    render: (d, plan) => new Date(d).toLocaleDateString(),
  },
  {
    title: "Subscription",
    dataIndex: "subscriptionName",
    key: "subscriptionName",
  },
  {
    title: "Sub Status",
    dataIndex: "subscriptionStatus",
    key: "subscriptionStatus",
    render: (status, plan) => SUBSCRIPTION_STATUS[status],
  },
  {
    title: "Sub Amt",
    key: "recurringAmount",
    // render: (amt, record) => <span>{amt}</span>,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<IProfile[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await searchUserReq();
        res.data.data.userAccounts.forEach(
          (a: any) => (a.id = ramdonString(8))
        );
        console.log("res getting user: ", res);
        setUsers(res.data.data.userAccounts);
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          console.log(`err getting user: `, err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
      }
    };
    fetchData();
  }, []);

  console.log("users: ", users);
  return (
    <div>
      <div>search</div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey={"id"}
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log("row click: ", record, "///", rowIndex);
              // navigate(`${APP_PATH}plan/${record.id}`);
            },
          };
        }}
      />
    </div>
  );
};

export default Index;

/**
 * 
 * <Table
        columns={columns}
        dataSource={users}
        rowKey={"id"}
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log("row click: ", record, "///", rowIndex);
              // navigate(`${APP_PATH}plan/${record.id}`);
            },
          };
        }}
      />
 */
