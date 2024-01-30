import { Button, Col, Input, Modal, Row, message, Select, Divider } from "antd";
import {
  IProfile,
  ISubscriptionType,
  TInvoicePerm,
} from "../../../shared.types";
import { daysBetweenDate, showAmount, ramdonString } from "../../../helpers";
import { useEffect, useRef, useState } from "react";
import { EditFilled, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import {
  createInvoice,
  saveInvoice,
  publishInvoice,
  revokeInvoice,
  deleteInvoice,
  refund,
} from "../../../requests";
import { CURRENCY } from "../../../constants";
import update from "immutability-helper";
import { useNavigate } from "react-router-dom";
import { InvoiceItem, UserInvoice } from "../../../shared.types";

const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  user: IProfile | null;
  isOpen: boolean;
  readonly: boolean;
  detail: UserInvoice | null; // null means new user, no data available
  permission: TInvoicePerm;
  // items: InvoiceItem[] | null;
  closeModal: () => void;
  refresh: () => void;
}

const newPlaceholderItem = (): InvoiceItem => ({
  id: ramdonString(8),
  description: "",
  amount: 0,
  unitAmountExcludingTax: "",
  amountExcludingTax: 0,
  quantity: "1",
  currency: "",
  tax: 0,
  taxScale: 0,
});

const Index = ({
  user,
  isOpen,
  readonly,
  // items,
  detail,
  permission,
  closeModal,
  refresh,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  if (detail != null) {
    detail.lines.forEach((item) => {
      item.id = ramdonString(8);
    });
  }

  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>(
    detail == null ? [newPlaceholderItem()] : detail.lines
  );
  const defaultCurrency =
    detail == null || detail.lines.length == 0
      ? "USD"
      : detail.lines[0].currency; // assume all invoice items have the same currencies.
  const [currency, setCurrency] = useState(defaultCurrency);
  const taxScaleTmp = detail == null ? "" : detail.taxScale / 100;
  const [taxScale, setTaxScale] = useState<string>(taxScaleTmp + "");
  console.log("invoice detail/perm: ", detail, "//", permission);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const addInvoiceItem = () => {
    setInvoiceList(
      update(invoiceList, {
        $push: [newPlaceholderItem()],
      })
    );
  };

  const removeInvoiceItem = (invoiceId: string) => () => {
    const idx = invoiceList.findIndex((v) => v.id == invoiceId);
    if (idx != -1) {
      setInvoiceList(update(invoiceList, { $splice: [[idx, 1]] }));
    }
  };

  const validateFields = () => {
    if (
      taxScale.trim() == "" ||
      isNaN(Number(taxScale)) ||
      Number(taxScale) < 0
    ) {
      message.error("Please input valid tax rate(in percentage)");
      return false;
    }
    for (let i = 0; i < invoiceList.length; i++) {
      if (invoiceList[i].description == "") {
        message.error("Description is required");
        return false;
      }
      let q = Number(invoiceList[i].quantity);
      if (!Number.isInteger(q) || q <= 0) {
        message.error("Please input valid quantity");
        return false;
      }
      q = Number(invoiceList[i].unitAmountExcludingTax); // TODO: JPY has no decimal point, take that into account.
      if (isNaN(q) || q <= 0) {
        message.error("Please input valid amount");
        return false;
      }
    }
    return true;
  };

  const onSave = async () => {
    if (!validateFields()) {
      return;
    }
    const invoiceItems = invoiceList.map((v) => ({
      description: v.description,
      unitAmountExcludingTax:
        Number(v.unitAmountExcludingTax) * CURRENCY[currency].stripe_factor,
      quantity: Number(v.quantity),
    }));
    try {
      setLoading(true);
      let saveInvoiceRes;
      if (detail == null) {
        // creating a new invoice
        saveInvoiceRes = await createInvoice({
          userId: user!.id,
          taxScale: Number(taxScale) * 100,
          currency,
          invoiceItems,
          name: "a new invoice at " + new Date().toLocaleDateString(),
        });
      } else {
        // saving an invoice
        saveInvoiceRes = await saveInvoice({
          invoiceId: detail.invoiceId,
          taxScale: Number(taxScale) / 100,
          currency: detail.currency,
          name: "a invoice",
          invoiceItems,
        });
      }

      console.log("save invoice res: ", saveInvoiceRes);
      const code = saveInvoiceRes.data.code;
      code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
      if (code != 0) {
        throw new Error(saveInvoiceRes.data.message);
      }
      closeModal();
      message.success("Invoice saved.");
      refresh();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err saving invoice: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onPublish = async () => {
    if (detail == null) {
      return;
    }
    // Do validation check first.
    try {
      setLoading(true);
      const res = await publishInvoice({
        invoiceId: detail.invoiceId,
        payMethod: 1,
        daysUtilDue: 1,
      });
      setLoading(false);
      console.log("publishing invoice res: ", res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      closeModal();
      message.success("Invoice generated and sent.");
      refresh();
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err saving invoice: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  // revoke: just the opposite of publish
  // delete. They have the same structure, so I'm being lazy to duplicate.
  const onDeleteOrRevoke = async (action: "delete" | "revoke") => {
    if (detail == null) {
      return;
    }
    const callMethod = action == "delete" ? deleteInvoice : revokeInvoice;
    try {
      setLoading(true);
      const res = await callMethod(detail.invoiceId);
      setLoading(false);
      console.log(`${action} invoice res: `, res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      closeModal();
      message.success(`Invoice ${action}d.`);
      refresh();
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log(`err ${action}ing invoice: `, err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onDelete = () => onDeleteOrRevoke("delete");

  const onRefund = async () => {
    if (detail == null) {
      return;
    }
    try {
      const res = await refund({
        invoiceId: detail?.invoiceId,
        refundAmount: 100,
        reason: "no reason",
      });
      console.log("refund res: ", res);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log(`err refunding: `, err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onFieldChange =
    (invoiceId: string, fieldName: string) =>
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const idx = invoiceList.findIndex((v) => v.id == invoiceId);
      if (idx == -1) {
        return;
      }
      let newList = update(invoiceList, {
        [idx]: { [fieldName]: { $set: evt.target.value } },
      });
      newList = update(newList, {
        [idx]: {
          amount: {
            $set:
              Number(newList[idx].quantity) *
              Number(newList[idx].unitAmountExcludingTax),
          },
          tax: {
            $set:
              Math.round(
                Number(newList[idx].quantity) *
                  Number(newList[idx].unitAmountExcludingTax) *
                  (Number(taxScale) / 100) *
                  100
              ) / 100,
          },
        },
      });
      setInvoiceList(newList);
      console.log("after filed change, new invoiceList: ", newList);
    };

  const onSelectChange = (v: string) => setCurrency(v);
  const onTaxScaleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const t = evt.target.value;
    setTaxScale(t);
    const newList = invoiceList.map((iv) => ({
      ...iv,
      tax:
        (Number(iv.quantity) * Number(iv.unitAmountExcludingTax) * Number(t)) /
        100,
    }));
    setInvoiceList(newList);
  };

  // to get a numerical value with 2 decimal points, but still not right
  // https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  // TODO:
  // line1: 33.93 * 35
  // line2: 77.95 * 3
  // we get: 1421.3999999999
  const getTotal = (invoices: InvoiceItem[]): string => {
    const total = invoices.reduce(
      (accu, curr) =>
        accu +
        Math.round(
          (Number(curr.amount) + Number(curr.tax) + Number.EPSILON) * 100
        ) /
          100,
      0
    );
    if (isNaN(total)) {
      return "";
    }
    // 3rd argument is 'whether ignoreFactor',
    // readonly is used for reading invoices(no edit/create allowed), the amounts need to take factor into account, 10000 need to show $100
    // readonly: false, is used when admin need to create a new invoice, $100 need to be shown as $100, no factor considered
    return showAmount(total, currency, true);
  };

  useEffect(() => {}, []);

  return (
    <Modal title="Invoice detail" open={isOpen} width={"820px"} footer={null}>
      <Row style={{ marginTop: "16px" }}>
        <Col span={4}>Currency</Col>
        <Col span={4}>Tax Rate %</Col>
        <Col span={6}>Invoice title</Col>
      </Row>
      <Row style={{ display: "flex", alignItems: "center" }}>
        <Col span={4}>
          {readonly ? (
            <span>{currency}</span>
          ) : (
            <Select
              style={{ width: 100, margin: "8px 0" }}
              value={currency}
              onChange={onSelectChange}
              options={[
                { value: "USD", label: "USD" },
                { value: "JPY", label: "JPY" },
              ]}
            />
          )}
        </Col>
        <Col span={4}>
          {readonly ? (
            <span>{taxScale} </span>
          ) : (
            <Input
              value={taxScale}
              onChange={onTaxScaleChange}
              type="number"
              style={{ width: "80px" }}
            />
          )}
        </Col>
        <Col span={6}>
          {readonly ? (
            <span>{detail?.invoiceName}</span>
          ) : (
            <Input value={detail?.invoiceName} />
          )}
        </Col>
      </Row>

      <Row style={{ display: "flex", alignItems: "center" }}>
        <Col span={10}>
          <span style={{ fontWeight: "bold" }}>Item description</span>
        </Col>
        <Col span={4}>
          <div style={{ fontWeight: "bold" }}>Amount</div>
          <div style={{ fontWeight: "bold" }}>(exclude Tax)</div>
        </Col>
        <Col span={1}></Col>
        <Col span={3}>
          <span style={{ fontWeight: "bold" }}>Quantity</span>
        </Col>
        <Col span={2}>
          <span style={{ fontWeight: "bold" }}>Tax</span>
        </Col>
        <Col span={3}>
          <span style={{ fontWeight: "bold" }}>Total</span>
        </Col>
        {!readonly && (
          <Col span={1}>
            <div
              onClick={addInvoiceItem}
              style={{ fontWeight: "bold", width: "64px", cursor: "pointer" }}
            >
              <PlusOutlined />
            </div>
          </Col>
        )}
      </Row>
      {invoiceList.map((v, i) => (
        <Row
          key={v.id}
          style={{ margin: "8px 0", display: "flex", alignItems: "center" }}
        >
          <Col span={10}>
            {readonly ? (
              <span>{v.description}</span>
            ) : (
              <Input
                value={v.description}
                onChange={onFieldChange(v.id!, "description")}
                style={{ width: "95%" }}
              />
            )}
          </Col>
          <Col span={4}>
            {readonly ? (
              <span>
                {showAmount(
                  v.unitAmountExcludingTax as number,
                  v.currency,
                  true
                )}
              </span>
            ) : (
              <>
                {CURRENCY[currency].symbol}&nbsp;&nbsp;
                <Input
                  type="number"
                  value={v.unitAmountExcludingTax}
                  onChange={onFieldChange(v.id!, "unitAmountExcludingTax")}
                  style={{ width: "80%" }}
                />
              </>
            )}
          </Col>
          <Col span={1} style={{ fontSize: "18px" }}>
            ×
          </Col>
          <Col span={3}>
            {readonly ? (
              <span>{v.quantity}</span>
            ) : (
              <Input
                type="number"
                value={v.quantity}
                onChange={onFieldChange(v.id!, "quantity")}
                style={{ width: "60%" }}
              />
            )}
          </Col>
          <Col span={2}>{`${CURRENCY[currency].symbol} ${v.tax}`}</Col>
          <Col span={3}>{getTotal([invoiceList[i]])}</Col>
          {!readonly && (
            <Col span={1}>
              <div
                onClick={removeInvoiceItem(v.id!)}
                style={{ fontWeight: "bold", width: "64px", cursor: "pointer" }}
              >
                <MinusOutlined />
              </div>
            </Col>
          )}
        </Row>
      ))}
      <Divider />

      <Row>
        <Col span={20}></Col>
        <Col span={3} style={{ fontWeight: "bold" }}>
          {getTotal(invoiceList)}
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "18px",
          marginTop: "24px",
        }}
      >
        <Button
          type="primary"
          danger
          onClick={onDelete}
          loading={loading}
          disabled={!permission.deletable || loading}
        >
          Delete
        </Button>

        <div style={{ display: "flex", gap: "16px" }}>
          <Button onClick={closeModal} disabled={loading}>
            {`${readonly ? "Close" : "Cancel"}`}
          </Button>
          {permission.savable && (
            <Button
              type="primary"
              onClick={onSave}
              loading={loading}
              disabled={loading || invoiceList.length == 0}
            >
              Save
            </Button>
          )}
          {permission.creatable && (
            <Button onClick={onPublish} loading={loading} disabled={loading}>
              Create
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Index;
