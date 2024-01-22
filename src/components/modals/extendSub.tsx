import { Button, Col, Modal, Row } from "antd";
import { ISubscriptionType } from "../../shared.types";
import { daysBetweenDate, showAmount } from "../../helpers";

interface Props {
  isOpen: boolean;
  loading: boolean;
  subInfo: ISubscriptionType | null;
  dueDate: string;
  onCancel: () => void;
  onConfirm: () => void;
  setDueDate: (d: string) => void;
}

const ExtendSub = ({
  isOpen,
  loading,
  subInfo,
  dueDate,
  onCancel,
  onConfirm,
  setDueDate,
}: Props) => {
  return (
    <Modal title="Extend due date" open={isOpen} width={"640px"} footer={null}>
      <div style={{ margin: "16px 0" }}>
        Are you sure you want to extend the due date?
      </div>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: "bold" }}>First name</span>
        </Col>
        <Col span={6}>{subInfo?.user?.firstName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: "bold" }}> Lastname</span>
        </Col>
        <Col span={6}>{subInfo?.user?.lastName}</Col>
      </Row>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: "bold" }}>Plan</span>
        </Col>
        <Col span={6}>{subInfo?.plan?.planName}</Col>
        <Col span={5}>
          <span style={{ fontWeight: "bold" }}>Amount</span>
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
      </Row>
      <Row>
        <Col span={6}>
          <span style={{ fontWeight: "bold" }}>Current due date</span>
        </Col>
        <Col span={6}>
          {new Date(
            (subInfo?.currentPeriodEnd as number) * 1000
          ).toDateString()}
        </Col>
        <Col span={5}>
          <span style={{ fontWeight: "bold" }}>New due date</span>
        </Col>
        <Col span={7}>
          {dueDate}{" "}
          <span style={{ color: "red" }}>
            {`(+ ${daysBetweenDate(
              dueDate,
              (subInfo?.currentPeriodEnd as number) * 1000
            )} days)`}
          </span>
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
        <Button
          onClick={() => {
            // setDueDateModal(false);
            onCancel();
            setDueDate("");
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default ExtendSub;
