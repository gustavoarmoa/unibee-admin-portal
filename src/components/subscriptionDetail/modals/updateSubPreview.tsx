import { Button, Col, Divider, Modal, Row, Spin } from "antd";
import { showAmount } from "../../../helpers";
import { IPreview } from "../../../shared.types";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
  isOpen: boolean;
  loading: boolean;
  previewInfo: IPreview | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const updateSubPreview = ({
  isOpen,
  loading,
  previewInfo,
  onCancel,
  onConfirm,
}: Props) => {
  return (
    <Modal
      title="Subscription Update Preview"
      open={isOpen}
      // onOk={onConfirm}
      // onCancel={togglePreviewModal}
      width={"640px"}
      footer={null}
    >
      {previewInfo == null ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin
            spinning={true}
            indicator={<LoadingOutlined style={{ fontSize: "32px" }} spin />}
          />
        </div>
      ) : (
        <>
          <Divider plain style={{ margin: "16px 0" }}>
            Next billing period invoices
          </Divider>
          {previewInfo.nextPeriodInvoice.lines.map((i, idx) => (
            <Row key={idx} gutter={[16, 16]}>
              <Col span={6}>{`${showAmount(
                i.amount as number,
                i.currency
              )}`}</Col>
              <Col span={18}>{i.description}</Col>
            </Row>
          ))}
          <Divider plain style={{ margin: "16px 0" }}>
            Current billing period invoices
          </Divider>
          {previewInfo.invoice.lines.map((i, idx) => (
            <Row key={idx} gutter={[16, 16]}>
              <Col span={6}>{`${showAmount(
                i.amount as number,
                i.currency
              )}`}</Col>
              <Col span={18}>{i.description}</Col>
            </Row>
          ))}

          {/* <Row gutter={[16, 16]}>
            <Col span={6}>
              <span style={{ fontSize: "18px" }}>Total</span>
            </Col>
            <Col span={18}>
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                {`${showAmount(previewInfo.totalAmount, previewInfo.currency)}`}
              </span>
            </Col>
          </Row> */}
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "16px",
              margin: "16px 0",
            }}
          >
            <Button disabled={loading} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
            >
              Confirm
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default updateSubPreview;
