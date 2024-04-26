import { EditFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Input, Modal, Row, Select, message } from 'antd'
import dayjs from 'dayjs'
import update from 'immutability-helper'
import { useState } from 'react'
import { CURRENCY } from '../../constants'
import { daysBetweenDate, ramdonString, showAmount } from '../../helpers'
import {
  createInvoiceReq,
  deleteInvoiceReq,
  publishInvoiceReq,
  refundReq,
  revokeInvoiceReq,
  saveInvoiceReq,
  sendInvoiceInMailReq
} from '../../requests'
import {
  IProfile,
  ISubscriptionType,
  InvoiceItem,
  TInvoicePerm,
  TRefund,
  UserInvoice
} from '../../shared.types'
import { useAppConfigStore } from '../../stores'

interface Props {
  detail: TRefund
  closeModal: () => void
}

const Index = ({ detail, closeModal }: Props) => {
  const appConfigStore = useAppConfigStore()
  console.log('refund detai: ', detail)

  const getUserName = (iv: UserInvoice) => {
    if (iv.userAccount == null) {
      return ''
    }
    return (
      <a
        href={`mailto: ${iv.userAccount.email}`}
      >{`${iv.userAccount.firstName} ${iv.userAccount.lastName}`}</a>
    )
  }

  return (
    <Modal
      title="Refund Detail"
      open={true}
      width={'620px'}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: '12px' }}></div>
      <Row style={{ margin: '8px 0' }}>
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Refund amount
        </Col>
        <Col span={14}>{showAmount(detail.refundAmount, detail.currency)}</Col>
      </Row>
      <Row style={{ margin: '8px 0' }}>
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Refund reason
        </Col>
        <Col span={14}>{detail.refundComment}</Col>
      </Row>

      <Row style={{ margin: '8px 0' }}>
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Payment Id
        </Col>
        <Col span={14}>{detail.paymentId}</Col>
      </Row>

      <Row style={{ margin: '8px 0' }}>
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Payment gateway
        </Col>
        <Col span={14}>
          {
            appConfigStore.gateway.find((g) => g.gatewayId == detail.gatewayId)
              ?.gatewayName
          }
        </Col>
      </Row>
      <Row style={{ margin: '8px 0' }}>
        <Col
          span={10}
          style={{ fontWeight: 'bold' }}
          className=" text-gray-600"
        >
          Created at
        </Col>
        <Col span={14}>
          {dayjs(detail.refundTime * 1000).format('YYYY-MMM-DD')}
        </Col>
      </Row>

      <div className="mt-6 flex items-center justify-end gap-4">
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button onClick={closeModal} type="primary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Index
