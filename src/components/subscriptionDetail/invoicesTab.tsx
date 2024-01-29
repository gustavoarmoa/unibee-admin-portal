import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Input,
  Select,
  message,
  Spin,
  Pagination,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
// import { ISubscriptionType } from "../../shared.types";
import { getInvoiceList, downloadInvoice } from "../../requests";
import { IProfile } from "../../shared.types";
import NewInvoiceModal from "./modals/newInvoice";
import {
  CloseOutlined,
  DownloadOutlined,
  EditOutlined,
  LoadingOutlined,
  MailOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { showAmount } from "../../helpers";
import { UserInvoice } from "../../shared.types";

const APP_PATH = import.meta.env.BASE_URL;
const PAGE_SIZE = 10;

interface InvoiceShort {
  id: number;
  // merchantId: number;
  // invoiceId: string;
  invoiceName: string;
  totalAmount: number;
  subscriptionAmount: number;
  currency: string;
  /*
  taxAmount: number;
  subscriptionAmount: number;
  currency: string;
  periodStart: number;
  periodEnd: number;
  */
}

const Index = ({ user }: { user: IProfile | null }) => {
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // pagination props
  const [newInvoiceModal, setNewInvoiceModal] = useState(false);
  const [invoiceIdx, setInvoiceIdx] = useState(-1); // -1: not selected
  const navigate = useNavigate();
  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const columns: ColumnsType<UserInvoice> = [
    {
      title: "Plan",
      dataIndex: "invoiceName",
      key: "invoiceName",
      // render: (_, sub) => <a>{sub.plan?.planName}</a>,
    },
    {
      title: "Total amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amt, invoice) => <a>{showAmount(amt, invoice.currency)}</a>,
    },
    {
      title: "Subscription Amt",
      dataIndex: "subscriptionAmount",
      key: "subscriptionAmount",
      render: (amt, invoice) => <a>{showAmount(amt, invoice.currency)}</a>,
    },
    {
      title: "Action",
      key: "action",
      render: (
        _,
        record // use fn to generate these icons, only show available ones.
      ) => (
        <Space size="middle">
          <span onClick={toggleNewInvoiceModal} style={{ cursor: "pointer" }}>
            <EditOutlined />
          </span>
          <span style={{ cursor: "pointer" }}>
            <CloseOutlined />
          </span>
          <span style={{ cursor: "pointer" }}>
            <MailOutlined />
          </span>
          <span style={{ cursor: "pointer" }}>
            <UndoOutlined />
          </span>
          <span
            onClick={() => downloadInvoice(record.sendPdf)}
            style={{
              cursor: `${
                record.sendPdf != null && record.sendPdf != ""
                  ? "pointer"
                  : "not-allowed"
              }`,
            }}
          >
            <DownloadOutlined />
          </span>
        </Space>
      ),
    },
  ];

  const toggleNewInvoiceModal = () => {
    if (newInvoiceModal) {
      setInvoiceIdx(-1);
    }
    setNewInvoiceModal(!newInvoiceModal);
  };

  const onPageChange = (page: number, pageSize: number) => {
    // console.log("page change: ", page, "//", pageSize);
    setPage(page - 1);
  };

  const permission = () => {};

  const fetchData = async () => {
    if (user == null) {
      return;
    }
    setLoading(true);
    let invoiceListRes;
    try {
      invoiceListRes = await getInvoiceList({ page, userId: user!.id });
      console.log("invoice list res: ", invoiceListRes);
      const code = invoiceListRes.data.code;
      code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
      if (code != 0) {
        // TODO: save all the code as ENUM in constant,
        throw new Error(invoiceListRes.data.message);
      }
      setInvoiceList(invoiceListRes.data.data.Invoices);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err getting invoice list: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <div>
      {newInvoiceModal && (
        <NewInvoiceModal
          isOpen={true}
          readonly={invoiceIdx != -1}
          items={invoiceIdx == -1 ? null : invoiceList[invoiceIdx].lines}
          user={user}
          toggleModal={toggleNewInvoiceModal}
          refresh={fetchData}
        />
      )}
      <Table
        columns={columns}
        dataSource={invoiceList}
        rowKey={"id"}
        pagination={false}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              setInvoiceIdx(rowIndex as number);
            },
          };
        }}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "18px 0",
        }}
      >
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={500}
          size="small"
          onChange={onPageChange}
        />
        <Button
          type="primary"
          onClick={() => {
            setInvoiceIdx(-1);
            toggleNewInvoiceModal();
          }}
          disabled={user == null}
        >
          New Invoice
        </Button>
      </div>
    </div>
  );
};

export default Index;
