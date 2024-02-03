import { LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import { Col, Divider, Input, Row, Spin, message } from "antd";
import { CSSProperties, ChangeEvent, useEffect, useRef, useState } from "react";
import { appSearchReq } from "../requests";
import { useNavigate } from "react-router-dom";
import { useOnClickOutside } from "usehooks-ts";
import { UserInvoice, IProfile } from "../shared.types";
import { INVOICE_STATUS } from "../constants";
import { showAmount } from "../helpers";

const { Search } = Input;

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const resultWrapperRef = useRef(null);

  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([]);
  const [accountList, setAccountList] = useState<IProfile[]>([]);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const hide = () => setShowResult(false);
  const show = () => setShowResult(true);
  useOnClickOutside(resultWrapperRef, hide);

  const onEnter = async () => {
    if (term.trim() == "") {
      return;
    }

    setSearching(true);
    let res;
    try {
      setSearching(true);
      setShowResult(true);
      res = await appSearchReq(term);
      setSearching(false);
      console.log("app search res: ", res);
      const code = res.data.code;
      if (code != 0) {
        code == 61 && relogin();
        throw new Error(res.data.message);
      }
    } catch (err) {
      setSearching(false);
      setShowResult(false);
      if (err instanceof Error) {
        console.log("profile update err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      console.log("app search err: ", err);
      return;
    }
    const d = res.data.data;
    if (d.matchInvoice != null) {
      setInvoiceList(res.data.data.matchInvoice);
    } else if (d.matchUserAccounts != null) {
      setAccountList(d.matchUserAccounts);
    } else if (d.precisionMatchObject != null) {
      console.log("matched");
    }
  };

  const onTermChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setTerm(evt.target.value);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        position: "relative",
      }}
    >
      <Search
        value={term}
        onChange={onTermChange}
        // onKeyDown={onKeyDown}
        // loading={searching}
        onClick={show}
        onPressEnter={onEnter}
        allowClear={true}
        // prefix={<SearchOutlined />}
        placeholder="Search invoiceId, customer email"
        style={{ width: "320px" }}
      />
      <div
        ref={resultWrapperRef}
        style={{
          position: "absolute",
          top: "52px",
          width: "480px",
          height: "320px",
          visibility: `${showResult ? "visible" : "hidden"}`,
          background: "#FAFAFA",
          zIndex: "800",
          border: "1px solid #E0E0E0",
          borderRadius: "6px",
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
        }}
      >
        {searching ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {" "}
            <Spin
              spinning={true}
              indicator={<LoadingOutlined style={{ fontSize: "32px" }} spin />}
            />
          </div>
        ) : (
          <div style={{ position: "relative", padding: "12px" }}>
            <div>precision match</div>
            <Divider
              orientation="left"
              style={{ margin: "2px 0", color: "#757575" }}
            >
              Invoices
            </Divider>
            <InvoiceMatch list={invoiceList} />
            <Divider
              orientation="left"
              style={{ margin: "2px 0", color: "#757575" }}
            >
              Customers
            </Divider>
            <AccountMatch list={accountList} />
            <div>match custoemr</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

const rowStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  height: "32px",
};
const colStyle: CSSProperties = { fontWeight: "bold" };

const InvoiceMatch = ({ list }: { list: UserInvoice[] }) => {
  console.log("inv list: ", list);
  return (
    <div style={{ height: "160px", overflowY: "scroll" }}>
      <Row style={rowStyle}>
        <Col span={2} style={colStyle}>
          Name
        </Col>
        <Col span={1} style={colStyle}>
          Status
        </Col>
        <Col span={1} style={colStyle}>
          Amt
        </Col>
        <Col span={2} style={colStyle}>
          Start
        </Col>
        <Col span={2} style={colStyle}>
          End
        </Col>
      </Row>
      {list.map((iv) => (
        <Row style={rowStyle}>
          <Col span={2}>{iv.invoiceName}</Col>
          <Col span={1}>
            {INVOICE_STATUS[iv.status as keyof typeof INVOICE_STATUS]}
          </Col>
          <Col span={1}>{showAmount(iv.totalAmount, iv.currency)}</Col>
          <Col span={2}>
            {new Date(iv.periodStart * 1000).toLocaleDateString()}
          </Col>
          <Col span={2}>
            {new Date(iv.periodEnd * 1000).toLocaleDateString()}
          </Col>
        </Row>
      ))}
    </div>
  );
};

const AccountMatch = ({ list }: { list: IProfile[] }) => {
  return (
    <div>
      {list.map((acc) => (
        <span>{acc.firstName}</span>
      ))}
    </div>
  );
};

const PrecisionMatch = () => {
  return <div>d</div>;
};
