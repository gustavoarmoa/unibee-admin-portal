import { Button, Col, Input, Modal, Row, message, Select, Divider } from "antd";
import { IProfile, ISubscriptionType } from "../../../shared.types";
import { daysBetweenDate, showAmount, ramdonString } from "../../../helpers";
import { useEffect, useState } from "react";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { createInvoice } from "../../../requests";
import { CURRENCY } from "../../../constants";
import update from "immutability-helper";
import { useNavigate } from "react-router-dom";
import { InvoiceItem, UserInvoice } from "../../../shared.types";

const APP_PATH = import.meta.env.BASE_URL;

interface Props {
  user: IProfile | null;
  isOpen: boolean;
  items: InvoiceItem[] | null;
  toggleModal: () => void;
  refresh: () => void;
}

/*
type InvoiceItem = {
  id?: string; // for invoice creation, I need a unique id, for editing existing one, no id.
  description: string;
  unitAmountExcludingTax: string | number;
  quantity: string | number;
  total?: number; // ditto
}; // total 只是用来本地计算, 但后端不需要, 故: edit时, 需要手动计算total.
// id, total are optional, but for editing, I need to fill these 2 fields with actual value.
*/

const newPlaceholderItem = (): InvoiceItem => ({
  id: ramdonString(8),
  description: "",
  unitAmountExcludingTax: "",
  quantity: "1",
  amount: 0,
  currency: "",
  amountExcludingTax: 0,
  tax: 0,
  taxScale: 0,
});

const Index = ({ user, isOpen, items, toggleModal, refresh }: Props) => {
  const [loading, setLoading] = useState(false);

  if (items != null) {
    items.forEach((item) => {
      item.id = ramdonString(8);
      item.amount = Number(item.quantity) * Number(item.unitAmountExcludingTax);
    });
  }

  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>(
    items == null ? [newPlaceholderItem()] : items
  );
  const navigate = useNavigate();
  const [currency, setCurrency] = useState("USD");
  const [taxScale, setTaxScale] = useState<string>("");

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  console.log("invoice item: ", items);

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

  const onConfirm = async () => {
    if (!validateFields()) {
      return;
    }
    setLoading(true);
    const invoiceItems = invoiceList.map((v) => ({
      description: v.description,
      unitAmountExcludingTax:
        Number(v.unitAmountExcludingTax) * CURRENCY[currency].stripe_factor,
      quantity: Number(v.quantity),
    }));
    try {
      const createInvoiceRes = await createInvoice({
        userId: user!.id,
        taxScale: Number(taxScale) * 100,
        currency,
        invoiceItems,
      });
      console.log("create invoice res: ", createInvoiceRes);
      const code = createInvoiceRes.data.code;
      code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
      if (code != 0) {
        // TODO: save all the code as ENUM in constant,
        throw new Error(createInvoiceRes.data.message);
      }
      // setInvoiceList([newPlaceholderItem()]); // reset to default state, otherwise, nexttime when Modal is open, current data is still there
      toggleModal();
      message.success("Invoice created.");
      refresh();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err getting sub list: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onCancel = () => {
    toggleModal();
    // setInvoiceList([newPlaceholderItem()]); // reset to default state
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
        },
      });
      setInvoiceList(newList);
    };

  const onSelectChange = (v: string) => setCurrency(v);
  const onTaxScaleChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setTaxScale(evt.target.value);

  // to get a numerical value with 2 decimal points, but still not right
  // https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  // TODO:
  // line1: 33.93 * 35
  // line2: 77.95 * 3
  // we get: 1421.3999999999
  const getTotal = (invoices: InvoiceItem[]): number => {
    const total = invoices.reduce(
      (accu, curr) =>
        accu +
        Math.round(((curr.amount as number) + Number.EPSILON) * 100) / 100,
      0
    );
    return total;
  };

  useEffect(() => {}, []);

  return (
    <Modal title="New invoice" open={isOpen} width={"820px"} footer={null}>
      <Row style={{ marginTop: "16px" }}>
        <Col span={4}>Currency</Col>
        <Col span={4}>Tax Rate %</Col>
      </Row>
      <Row style={{ display: "flex", alignItems: "center" }}>
        <Col span={4}>
          <Select
            style={{ width: 100, margin: "8px 0" }}
            value={currency}
            onChange={onSelectChange}
            options={[
              { value: "USD", label: "USD" },
              { value: "JPY", label: "JPY" },
            ]}
          />
        </Col>
        <Col span={4}>
          <Input value={taxScale} onChange={onTaxScaleChange} type="number" />
        </Col>
      </Row>

      <Row style={{ display: "flex", alignItems: "center" }}>
        <Col span={11}>
          <span style={{ fontWeight: "bold" }}>Description</span>
        </Col>
        <Col span={4}>
          <div style={{ fontWeight: "bold" }}>Amount</div>
          <div style={{ fontWeight: "bold" }}>(exclude Tax)</div>
        </Col>
        <Col span={1}></Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Quantity</span>
        </Col>
        <Col span={3}>
          <span style={{ fontWeight: "bold" }}>Total</span>
        </Col>
        <Col span={1}>
          <div
            onClick={addInvoiceItem}
            style={{ fontWeight: "bold", width: "64px", cursor: "pointer" }}
          >
            <PlusOutlined />
          </div>
        </Col>
      </Row>
      {invoiceList.map((v, i) => (
        <Row
          key={v.id}
          style={{ margin: "8px 0", display: "flex", alignItems: "center" }}
        >
          <Col span={11}>
            <Input
              value={v.description}
              onChange={onFieldChange(v.id!, "description")}
              style={{ width: "95%" }}
            />
          </Col>
          <Col span={4}>
            <Input
              type="number"
              value={v.unitAmountExcludingTax}
              onChange={onFieldChange(v.id!, "unitAmountExcludingTax")}
              style={{ width: "80%" }}
            />
          </Col>
          <Col span={1} style={{ fontSize: "18px" }}>
            ×
          </Col>
          <Col span={4}>
            <Input
              type="number"
              value={v.quantity}
              onChange={onFieldChange(v.id!, "quantity")}
              style={{ width: "60%" }}
            />
          </Col>
          <Col span={3}>
            {isNaN(v.amount as number)
              ? ""
              : `${CURRENCY[currency].symbol} ${getTotal([invoiceList[i]])}`}
          </Col>
          <Col span={1}>
            <div
              onClick={removeInvoiceItem(v.id!)}
              style={{ fontWeight: "bold", width: "64px", cursor: "pointer" }}
            >
              <MinusOutlined />
            </div>
          </Col>
        </Row>
      ))}
      <Divider />

      <Row>
        <Col span={19}></Col>
        <Col span={5} style={{ fontWeight: "bold" }}>
          {isNaN(getTotal(invoiceList)) ? (
            <span>&nbsp;</span>
          ) : (
            `${CURRENCY[currency].symbol} ${getTotal(invoiceList)}`
          )}
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "end",
          alignItems: "center",
          gap: "18px",
          marginTop: "24px",
        }}
      >
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading || invoiceList.length == 0}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default Index;
