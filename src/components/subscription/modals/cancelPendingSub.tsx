import { Button, Modal, message } from 'antd'
// import { showAmount } from "../helpers";
import { useState } from 'react'
import { cancelSubReq } from '../../../requests'
import { ISubscriptionType } from '../../../shared.types.d'

interface Props {
  subInfo: ISubscriptionType | null
  closeModal: () => void
  refresh: () => void
}
const Index = ({ subInfo, closeModal, refresh }: Props) => {
  const [loading, setLoading] = useState(false)
  const onConfirm = async () => {
    console.log('cancelling ....', subInfo?.subscriptionId)
    setLoading(true)
    const [_, err] = await cancelSubReq(subInfo?.subscriptionId as string)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Subscription cancelled`)
    closeModal()
    refresh()
  }

  return (
    <Modal
      title={'Cancel Subscription'}
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div style={{ margin: '16px 0' }}>
        {`Are you sure you want to cancel this subscription?`}
      </div>
      {/* <Row>
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
          </Row> */}
      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading}>
          No
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          Yes, Cancel it
        </Button>
      </div>
    </Modal>
  )
}

export default Index
