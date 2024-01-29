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
import { UserInvoice, TInvoicePerm } from "../../shared.types";
import { CURRENCY } from "../../constants";

const APP_PATH = import.meta.env.BASE_URL;
const PAGE_SIZE = 10;

const Index = ({ user }: { user: IProfile | null }) => {
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // pagination props
  const [newInvoiceModal, setNewInvoiceModal] = useState(false);
  const [invoiceIdx, setInvoiceIdx] = useState(-1); // -1: not selected, any action button: (delete, edit,refund) will set this value to the selected invoiceIdx
  const [deleteMode, setDeleteMode] = useState(false);
  const navigate = useNavigate();
  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const getPermission = (iv: UserInvoice | null): TInvoicePerm => {
    const p = {
      editable: false,
      savable: false,
      creatable: false,
      deletable: false,
      refundable: false,
      downloadable: false,
      sendable: false,
    };
    if (iv == null) {
      return p;
    }
    if (iv.subscriptionId == null || iv.subscriptionId == "") {
      // manually created invoice
      if (iv.invoiceId == "") {
        // no record in the backend, first-time creation
        p.savable = true; // ???
      } else if (iv.link == "") {
        // invoice record exist in backend, but not created(user won't see it)
        p.savable = true; // ???
        p.creatable = true;
        p.editable = true;
        p.deletable = true;
      } // else {}
    }
    return p;
  };

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
      render: (amt, invoice) => (
        <a>{showAmount(amt, invoice.currency, true)}</a>
      ),
    },
    {
      title: "Subscription Amt",
      dataIndex: "subscriptionAmount",
      key: "subscriptionAmount",
      render: (amt, invoice) => (
        <a>{showAmount(amt, invoice.currency, true)}</a>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (
        _,
        record // use fn to generate these icons, only show available ones.
      ) => (
        <Space size="middle">
          <span onClick={toggleNewInvoiceModal} style={{ cursor: `pointer` }}>
            <EditOutlined onClick={() => console.log("hehe, editing...")} />
          </span>
          <span
            onClick={() => {
              toggleNewInvoiceModal();
              setDeleteMode(true);
            }}
            style={{ cursor: "pointer" }}
          >
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
      setDeleteMode(false);
    }
    setNewInvoiceModal(!newInvoiceModal);
  };

  const onPageChange = (page: number, pageSize: number) => {
    // console.log("page change: ", page, "//", pageSize);
    setPage(page - 1);
  };

  const normalizeAmt = (iv: UserInvoice[]) => {
    iv.forEach((v) => {
      const c = v.currency;
      const f = CURRENCY[c].stripe_factor;
      v.subscriptionAmount /= f;
      v.subscriptionAmountExcludingTax /= f;
      v.taxAmount /= f;
      v.totalAmount /= f;
      v.totalAmountExcludingTax /= f;
      v.lines.forEach((l) => {
        (l.amount as number) /= f;
        (l.amountExcludingTax as number) /= f;
        (l.tax as number) /= f;
        (l.unitAmountExcludingTax as number) /= f;
      });
    });
  };

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
      normalizeAmt(invoiceListRes.data.data.Invoices);
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
          // readonly={invoiceIdx != -1}
          readonly={false}
          deleteMode={deleteMode}
          detail={invoiceIdx == -1 ? null : invoiceList[invoiceIdx]}
          // items={invoiceIdx == -1 ? null : invoiceList[invoiceIdx].lines}
          permission={getPermission(
            invoiceIdx == -1 ? null : invoiceList[invoiceIdx]
          )}
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
