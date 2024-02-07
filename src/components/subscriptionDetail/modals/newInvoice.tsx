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
  sendInvoiceInMailReq,
} from "../../../requests";
import { CURRENCY } from "../../../constants";
import update from "immutability-helper";
import { useNavigate } from "react-router-dom";
import { InvoiceItem, UserInvoice } from "../../../shared.types";

const APP_PATH = import.meta.env.BASE_URL;

const newPlaceholderItem = (): InvoiceItem => ({
  id: ramdonString(8),
  description: "",
  amount: 0,
  unitAmountExcludingTax: "", // item price with single unit
  amountExcludingTax: 0, // item price with quantity multiplied
  quantity: "1",
  currency: "USD",
  tax: 0,
  taxScale: 0,
});

interface Props {
  user: IProfile | null;
  isOpen: boolean;
  detail: UserInvoice | null; // null means new user, no data available
  permission: TInvoicePerm;
  refundMode: boolean;
  // items: InvoiceItem[] | null;
  closeModal: () => void;
  refresh: () => void;
}

const Index = ({
  user,
  isOpen,
  detail,
  permission,
  refundMode,
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
  const [invoiceName, setInvoiceName] = useState(
    detail == null ? "" : detail.invoiceName
  );
  const [refundAmt, setRefundAmt] = useState("");
  const [refundReason, setRefundReason] = useState("");
  // console.log("invoice detail/perm: ", detail, "//", permission);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const onCurrencyChange = (v: string) => setCurrency(v);
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
  const onInvoiceNameChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setInvoiceName(evt.target.value);

  const onRefundAmtChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setRefundAmt(evt.target.value);

  const onRefundReasonChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setRefundReason(evt.target.value);

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

  const onSave = (isFinished: boolean) => async () => {
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
          name: invoiceName,
          invoiceItems,
          finish: isFinished,
        });
      } else {
        // saving an invoice
        saveInvoiceRes = await saveInvoice({
          invoiceId: detail.invoiceId,
          taxScale: Number(taxScale) / 100,
          currency: detail.currency,
          name: invoiceName,
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

  // ----------------
  // what if user made some changes, then click 'create' to publish, backend still uses the old data before the local change.
  const onPublish = async () => {
    if (detail == null) {
      console.log("publis new invoice, detail is null? ", detail);
      onSave(true)();
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

  // revoke: just the opposite of publish (back to unpublish state)
  // delete. They have the same structure, and I'm too lazy to duplicate it.
  const onDeleteOrRevoke = async (action: "delete" | "revoke") => {
    if (detail == null) {
      return;
    }
    console.log("delete: ", action);

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
  const onRevoke = () => onDeleteOrRevoke("revoke");

  const onRefund = async () => {
    if (detail == null) {
      return;
    }
    if (refundReason == "") {
      message.error("Please input refund reason with less than 64 characters");
      return;
    }

    const amt = Number(refundAmt);
    const total = getTotal(invoiceList, true);
    if (isNaN(amt) || amt > (total as number)) {
      message.error(
        "Refund amount must be less than or equal to invoice amount"
      );
      return;
    }

    console.log("refuding...");
    /**
     * 
     * setLoading(true);
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
     */
    //
    try {
      setLoading(true);
      const res = await refund(
        {
          invoiceId: detail?.invoiceId,
          refundAmount: Number(refundAmt),
          reason: refundReason,
        },
        currency
      );
      setLoading(false);
      console.log("refund res: ", res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      message.success("Refunded."); // does user get refund immeidately? or there is a pending process
      closeModal();
      refresh();
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

  const onSendInvoice = async () => {
    if (detail == null || detail.invoiceId == "" || detail.invoiceId == null) {
      return;
    }
    setLoading(true);
    try {
      const res = await sendInvoiceInMailReq(detail.invoiceId);
      console.log("send invoice in mail res: ", res);
      setLoading(false);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      message.success("Invoice sent.");
      closeModal();
      // refresh(); // no need to refresh parent.
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log(`err sending invoice: `, err.message);
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
      console.log("after field change, new invoiceList: ", newList);
    };

  // to get a numerical value with 2 decimal points, but still not right
  // https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  // TODO:
  // line1: 33.93 * 35
  // line2: 77.95 * 3
  // we get: 1421.3999999999
  const getTotal = (
    invoices: InvoiceItem[],
    asNumber?: boolean
  ): string | number => {
    // if (asNumber == null) {
    // asNumber = false;
    // }
    let total = invoices.reduce(
      (accu, curr) =>
        accu +
        Math.round(
          (Number(curr.unitAmountExcludingTax) +
            Number(curr.tax) +
            Number.EPSILON) *
            100
        ) /
          100,
      0
    );
    if (isNaN(total)) {
      if (asNumber) {
        return 0;
      } else return "";
      // return "";
    }

    total = Math.round((total + Number.EPSILON) * 100) / 100;
    // 3rd argument is 'whether ignoreFactor',
    // readonly: false, is used when admin need to create a new invoice, $100 need to be shown as $100, no factor considered
    return asNumber ? total : showAmount(total, currency, true);
  };

  return (
    <Modal
      title="Invoice Detail"
      open={isOpen}
      width={"820px"}
      footer={null}
      closeIcon={null}
    >
      <Row style={{ marginTop: "16px" }}>
        <Col span={4} style={{ fontWeight: "bold" }}>
          Currency
        </Col>
        <Col span={4} style={{ fontWeight: "bold" }}>
          Tax Rate
        </Col>
        <Col span={6} style={{ fontWeight: "bold" }}>
          Invoice title
        </Col>
      </Row>
      <Row
        style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
      >
        <Col span={4}>
          {!permission.editable ? (
            <span>{currency}</span>
          ) : (
            <Select
              style={{ width: 100, margin: "8px 0" }}
              value={currency}
              onChange={onCurrencyChange}
              options={[
                { value: "EUR", label: "EUR" },
                { value: "USD", label: "USD" },
                { value: "JPY", label: "JPY" },
              ]}
            />
          )}
        </Col>
        <Col span={4}>
          {!permission.editable ? (
            <span>{taxScale} %</span>
          ) : (
            <Input
              value={taxScale}
              suffix="%"
              onChange={onTaxScaleChange}
              type="number"
              style={{ width: "110px" }}
            />
          )}
        </Col>
        <Col span={6}>
          {!permission.editable ? (
            <span>{detail?.invoiceName}</span>
          ) : (
            <Input value={invoiceName} onChange={onInvoiceNameChange} />
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
        {permission.editable && (
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
            {!permission.editable ? (
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
            {!permission.editable ? (
              <span>
                {showAmount(
                  v.unitAmountExcludingTax as number,
                  v.currency,
                  true
                )}
              </span>
            ) : (
              <>
                {/* CURRENCY[currency].symbol */}
                <Input
                  type="number"
                  prefix={CURRENCY[currency].symbol}
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
            {!permission.editable ? (
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
          {permission.editable && (
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

      <Row style={{ display: "flex", alignItems: "center" }}>
        <Col span={20}>
          {refundMode && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginRight: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ marginRight: "6px" }}>Refund Reason:</div>
                <Input
                  style={{ width: "256px" }}
                  maxLength={64}
                  placeholder="Max characters: 64"
                  value={refundReason}
                  onChange={onRefundReasonChange}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ marginRight: "6px" }}>Refund Amt:</div>
                <Input
                  style={{ width: "100px" }}
                  prefix={CURRENCY[currency].symbol}
                  placeholder={`≤ ${getTotal(invoiceList)}`}
                  value={refundAmt}
                  onChange={onRefundAmtChange}
                />
              </div>
            </div>
          )}
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>{getTotal(invoiceList)}</span>
          {detail != null && detail.link != "" && detail.link != null && (
            <a
              href={detail.link}
              target="_blank"
              style={{ fontSize: "11px", marginLeft: "4px", color: "#757575" }}
            >
              Payment Link
            </a>
          )}
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
        {permission.deletable ? (
          <Button
            type="primary"
            danger
            onClick={onDelete}
            loading={loading}
            disabled={!permission.deletable || loading}
          >
            Delete
          </Button>
        ) : (
          <span>&nbsp;</span>
        )}

        {permission.revokable ? (
          <Button
            type="primary"
            danger
            onClick={onRevoke}
            loading={loading}
            disabled={!permission.revokable || loading}
          >
            Cancel
          </Button>
        ) : (
          <span>&nbsp;</span>
        )}

        <div style={{ display: "flex", gap: "16px" }}>
          <Button onClick={closeModal} disabled={loading}>
            {`${!permission.editable ? "Close" : "Close"}`}
          </Button>
          {permission.sendable &&
            !refundMode && ( // when in refundMode, I don't want this "send invoice" button to appear even it's sendable == true
              <Button
                type="primary"
                onClick={onSendInvoice}
                loading={loading}
                disabled={loading}
              >
                Send Invoice
              </Button>
            )}
          {(permission.savable || permission.creatable) && (
            <Button
              type="primary"
              onClick={onSave(false)}
              loading={loading}
              disabled={loading || invoiceList.length == 0}
            >
              Save
            </Button>
          )}
          {permission.publishable && (
            <Button onClick={onPublish} loading={loading} disabled={loading}>
              Create
            </Button>
          )}
          {refundMode && (
            <Button
              type="primary"
              onClick={onRefund}
              loading={loading}
              disabled={loading}
            >
              Refund
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Index;
