import { Button, Col, Input, Modal, Row, message, Select, Divider } from "antd";
import { ISubscriptionType } from "../../../shared.types";
import { daysBetweenDate, showAmount, ramdonString } from "../../../helpers";
import { useEffect, useState } from "react";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { createInvoice } from "../../../requests";
import { CURRENCY } from "../../../constants";
import update from "immutability-helper";

interface Props {
  isOpen: boolean;
  toggleModal: () => void;
  loading: boolean;
  /*
  subInfo: ISubscriptionType | null;
  newDueDate: string;
  */
  // onCancel: () => void;
  // onConfirm: () => void;
}

type InvoiceItem = {
  id: string;
  description: string;
  unitAmountExcludingTax: string;
  quantity: string;
  total: number;
};

const newPlaceholderItem = (): InvoiceItem => ({
  id: ramdonString(8),
  description: "",
  unitAmountExcludingTax: "",
  quantity: "1",
  total: 0,
});

const Index = ({ isOpen, loading, toggleModal }: Props) => {
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>([
    newPlaceholderItem(),
  ]);
  const [currency, setCurrency] = useState("USD");

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
      q = Number(invoiceList[i].unitAmountExcludingTax); // JPY has no decimal point, take that into account.
      if (isNaN(q) || q <= 0) {
        message.error("Please input valid amount");
        return false;
      }
    }
    return true;
  };

  const onConfirm = () => {
    if (!validateFields()) {
      return;
    }

    console.log("submitting...", invoiceList);
    // toggleModal();
  };

  const onFieldChange =
    (invoiceId: string, fieldName: string) =>
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      let newList = invoiceList;
      const idx = invoiceList.findIndex((v) => v.id == invoiceId);
      if (idx != -1) {
        newList = update(invoiceList, {
          [idx]: { [fieldName]: { $set: evt.target.value } },
        });
        newList = update(newList, {
          [idx]: {
            total: {
              $set:
                Number(newList[idx].quantity) *
                Number(newList[idx].unitAmountExcludingTax),
            },
          },
        });
      }
      setInvoiceList(newList);
    };

  const onSelectChange = (v: string) => setCurrency(v);

  const getTotal = (invoices: InvoiceItem[]) => {
    let total = 0;
    for (let i = 0; i < invoices.length; i++) {
      if (isNaN(invoices[i].total)) {
        return NaN;
      }
      total += Math.round((invoices[i].total + Number.EPSILON) * 100) / 100;
    }
    return total;
  };

  return (
    <Modal title="New invoice" open={isOpen} width={"820px"} footer={null}>
      <span style={{ marginRight: "12px" }}>Currency:</span>
      <Select
        style={{ width: 100, margin: "8px 0" }}
        value={currency}
        onChange={onSelectChange}
        options={[
          { value: "USD", label: "USD" },
          { value: "JPY", label: "JPY" },
        ]}
      />
      <Row style={{ display: "flex", alignItems: "center" }}>
        <Col span={12}>
          <span style={{ fontWeight: "bold" }}>Description</span>
        </Col>
        <Col span={3}>
          <div style={{ fontWeight: "bold" }}>Amount</div>
          <div style={{ fontWeight: "bold" }}>(exclude Tax)</div>
        </Col>
        <Col span={1}></Col>
        <Col span={3}>
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
          <Col span={12}>
            <Input
              value={v.description}
              onChange={onFieldChange(v.id, "description")}
              style={{ width: "90%" }}
            />
          </Col>
          <Col span={3}>
            <Input
              value={v.unitAmountExcludingTax}
              onChange={onFieldChange(v.id, "unitAmountExcludingTax")}
              style={{ width: "80%" }}
            />
          </Col>
          <Col span={1} style={{ fontSize: "18px" }}>
            ×
          </Col>
          <Col span={3}>
            <Input
              value={v.quantity}
              onChange={onFieldChange(v.id, "quantity")}
              style={{ width: "60%" }}
            />
          </Col>
          <Col span={3}>
            {isNaN(v.total)
              ? ""
              : `${CURRENCY[currency].symbol} ${getTotal([invoiceList[i]])}`}
          </Col>
          <Col span={1}>
            <div
              onClick={removeInvoiceItem(v.id)}
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
        <Button onClick={toggleModal} disabled={loading}>
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
