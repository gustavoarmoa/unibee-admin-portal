import {
  CheckOutlined,
  ExclamationOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Col, Popover, Row, Space, Table, Tag, message } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { getPaymentGatewayListReq } from '../../requests'
import { IProfile, TGateway } from '../../shared.types.d'
// import { useAppConfigStore } from '../../stores';
import GatewayModal from './paymentGatewayModal'

const SetTag = () => (
  <Tag icon={<CheckOutlined />} color="#87d068">
    Ready
  </Tag>
)
const NotSetTag = () => (
  <Tag icon={<ExclamationOutlined />} color="#f50">
    Not Set
  </Tag>
)
const LoadingTag = () => (
  <Tag icon={<SyncOutlined spin />} color="#2db7f5"></Tag>
)

const Index = () => {
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false)
  const [gatewayList, setGatewayList] = useState<TGateway[]>([])
  const [gatewayEdit, setGatewayEdit] = useState<TGateway | undefined>(
    undefined
  )
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false)
  const toggleModal = () => setGatewayModalOpen(!gatewayModalOpen)

  const fetchData = async () => {
    setLoading(true)
    const [gatewayList, err] = await getPaymentGatewayListReq(fetchData)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    setGatewayList(gatewayList ?? [])
  }

  const gatewayDetail = (name: string) =>
    gatewayList.find((g) => g.gatewayName.toLowerCase() == name.toLowerCase())

  const onGatewayClick = (gatewayName: string) => () => {
    let g: TGateway | undefined = gatewayList.find(
      (g) => g.gatewayName.toLowerCase() == gatewayName.toLowerCase()
    )
    if (g == undefined) {
      g = { gatewayName }
    }
    setGatewayEdit(g)
    toggleModal()
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      {gatewayModalOpen && (
        <GatewayModal closeModal={toggleModal} gatewayDetail={gatewayEdit} />
      )}
      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={3}>Stripe</Col>
        <Col span={2}>
          {loading ? (
            <LoadingTag />
          ) : gatewayDetail('stripe') != null ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className=" text-gray-500">
            Use public and private keys to secure the bank card payment.
          </div>
        </Col>
        <Col span={2}>
          <Button
            onClick={onGatewayClick('stripe')}
            disabled={loading}
            loading={loading}
          >
            {gatewayDetail('stripe') == null ? 'Setup' : 'Edit'}
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={3}>Changelly</Col>
        <Col span={2}>
          {loading ? (
            <LoadingTag />
          ) : gatewayDetail('changelly') != null ? (
            <SetTag />
          ) : (
            <NotSetTag />
          )}
        </Col>
        <Col span={10}>
          <div className=" text-gray-500">
            Use public and private keys to secure the crypto payment.
          </div>
        </Col>
        <Col span={2}>
          <Button
            onClick={onGatewayClick('changelly')}
            disabled={loading}
            loading={loading}
          >
            {gatewayDetail('changelly') == null ? 'Setup' : 'Edit'}
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default Index
