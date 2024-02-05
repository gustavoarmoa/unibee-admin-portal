import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, message } from "antd";
import { IProfile, UserInvoice } from "../shared.types";
import { ColumnsType } from "antd/es/table";
import { INVOICE_STATUS, SUBSCRIPTION_STATUS } from "../constants";
import { LoadingOutlined } from "@ant-design/icons";
import { getInvoiceList } from "../requests";
import dayjs from "dayjs";
import "../shared.css";
import { showAmount } from "../helpers";
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([]);

  const goToDetail = (invoiceId: string) => (evt: any) => {
    console.log("go to detail: ", evt.target);
    if (evt.target.closest(".unibee-user-id-wrapper")) {
      return;
    }
    navigate(`${APP_PATH}invoice/${invoiceId}`);
  };

  const goToUser = () => {
    console.log("got to user");
  };

  const columns: ColumnsType<UserInvoice> = [
    {
      title: "Invoice Name",
      dataIndex: "invoiceName",
      key: "invoiceName",
      // render: (text) => <a>{text}</a>,
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amt, iv) => (
        <div>
          <span>{showAmount(amt, iv.currency)}</span>
          <span
            style={{ fontSize: "11px", color: "#757575" }}
          >{` (tax: ${showAmount(iv.taxAmount, iv.currency)})`}</span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s, iv) => (
        <span>{INVOICE_STATUS[s as keyof typeof INVOICE_STATUS]}</span>
      ),
    },
    {
      title: "Start",
      dataIndex: "periodStart",
      key: "periodStart",
      render: (d, plan) =>
        d == 0 ? "" : dayjs(d * 1000).format("YYYY-MMM-DD"), // new Date(d * 1000).toLocaleDateString(),
    },
    {
      title: "End",
      dataIndex: "periodEnd",
      key: "periodEnd",
      render: (d, plan) =>
        d == 0 ? "" : dayjs(d * 1000).format("YYYY-MMM-DD"), // new Date(d * 1000).toLocaleDateString(),
    },
    {
      title: "User Id",
      dataIndex: "userId",
      key: "userId",

      render: (userId, iv) => (
        <div className="unibee-user-id-wrapper" id={userId} onClick={goToUser}>
          <a>{userId}</a>
        </div>
      ),
    },
  ];

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getInvoiceList({ page: 0 });
        setLoading(false);
        console.log("res getting invoice list: ", res);
        const code = res.data.code;
        if (code != 0) {
          code == 61 && relogin();
          throw new Error(res.data.message);
        }
        setInvoiceList(res.data.data.Invoices);
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          console.log(`err getting invoice: `, err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <Table
        columns={columns}
        dataSource={invoiceList}
        rowKey={"id"}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onRow={(iv, rowIndex) => {
          return {
            onClick: goToDetail(iv.invoiceId),
          };
        }}
      />
    </div>
  );
};

export default Index;
