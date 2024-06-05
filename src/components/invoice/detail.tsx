import {
  CheckCircleOutlined,
  DollarOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { Button, Col, Row, Spin, Tooltip, message } from 'antd'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { INVOICE_STATUS } from '../../constants'
import { showAmount } from '../../helpers'
import { getInvoiceDetailReq } from '../../requests'
import { IProfile, TInvoicePerm, UserInvoice } from '../../shared.types.d'
import { normalizeAmt } from '../helpers'
import RefundModal from '../payment/refundModal'
import InvoiceDetailModal from '../subscription/modals/invoiceDetail'
import { InvoiceStatus } from '../ui/statusTag'
import MarkAsPaidModal from './markAsPaidModal'
import MarkAsRefundedModal from './markAsRefundedModal'
// import InvoiceItemsModal from '../subscription/modals/newInvoice' // obsolete

const APP_PATH = import.meta.env.BASE_URL // if not specified in build command, default is /
const API_URL = import.meta.env.VITE_API_URL
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

const Index = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [invoiceDetail, setInvoiceDetail] = useState<UserInvoice | null>(null)
  //   const [userProfile, setUserProfile] = useState<IProfile | null>(null)
  const [showInvoiceItems, setShowInvoiceItems] = useState(false)
  const toggleInvoiceItems = () => setShowInvoiceItems(!showInvoiceItems)
  const [refundModalOpen, setRefundModalOpen] = useState(false) // show refund detail
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false)
  const toggleMarkPaidModal = () => setMarkPaidModalOpen(!markPaidModalOpen)
  const [markRefundedModalOpen, setMarkRefundedModalOpen] = useState(false)
  const toggleMarkRefundedModal = () =>
    setMarkRefundedModalOpen(!markRefundedModalOpen)

  const goBack = () => navigate(`${APP_PATH}invoice/list`)
  const goToUser = (userId: number) => () =>
    navigate(`${APP_PATH}user/${userId}`)
  const goToSub = (subId: string) => () =>
    navigate(`${APP_PATH}subscription/${subId}`)

  const fetchData = async () => {
    const pathName = window.location.pathname.split('/')
    const ivId = pathName.pop()
    if (ivId == null) {
      message.error('Invalid invoice')
      return
    }
    setLoading(true)
    const [res, err] = await getInvoiceDetailReq(ivId, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { invoice } = res
    normalizeAmt([invoice])
    setInvoiceDetail(invoice)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const isWireTransfer = invoiceDetail?.gateway.gatewayName == 'wire_transfer'
  const isCrypto = invoiceDetail?.gateway.gatewayName == 'changelly'
  const isRefund = invoiceDetail?.refund != null

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      {invoiceDetail && showInvoiceItems && (
        <InvoiceDetailModal
          user={invoiceDetail.userAccount}
          closeModal={toggleInvoiceItems}
          detail={invoiceDetail}
        />
      )}
      {invoiceDetail && refundModalOpen && (
        <RefundModal
          detail={invoiceDetail.refund!}
          closeModal={toggleRefundModal}
          ignoreAmtFactor={true}
        />
      )}
      {invoiceDetail && markPaidModalOpen && (
        <MarkAsPaidModal
          closeModal={toggleMarkPaidModal}
          refresh={fetchData}
          invoiceId={invoiceDetail.invoiceId}
        />
      )}

      {invoiceDetail && markRefundedModalOpen && (
        <MarkAsRefundedModal
          closeModal={toggleMarkRefundedModal}
          refresh={fetchData}
          invoiceId={invoiceDetail.invoiceId}
        />
      )}

      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Id
        </Col>
        <Col span={6}>{invoiceDetail?.invoiceId}</Col>
        <Col span={4} style={colStyle}>
          Invoice Name
        </Col>
        <Col span={6}>{invoiceDetail?.invoiceName}</Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Amount
        </Col>
        <Col span={6}>
          {invoiceDetail == null
            ? ''
            : showAmount(
                invoiceDetail?.totalAmount,
                invoiceDetail?.currency,
                true
              )}
          <span className="text-xs text-gray-500">
            {invoiceDetail == null
              ? ''
              : ` (${invoiceDetail.taxPercentage / 100}% tax incl)`}
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {invoiceDetail != null && InvoiceStatus(invoiceDetail.status)}
          {/* 
            status == 2 (processing) is used mainly for wire-transfer payment/refund, crypto refund,
            in which cases, payment/refund status updates are not provided by 3rd party API,
            admin have to check them offline, then update their status manully.
          */}
          {invoiceDetail != null &&
            invoiceDetail.status == 2 &&
            (isWireTransfer || isCrypto) && (
              <Button
                onClick={
                  isRefund ? toggleMarkRefundedModal : toggleMarkPaidModal
                }
                type="link"
                style={{ padding: 0 }}
              >
                {isRefund ? 'Mark as Refunded' : 'Mark as Paid'}
              </Button>
            )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Items
        </Col>
        <Col span={6}>
          <Button onClick={toggleInvoiceItems}>Show Detail</Button>
        </Col>
        <Col span={4} style={colStyle}>
          Refund
        </Col>
        <Col span={6}>
          {invoiceDetail?.refund == null ? (
            'No'
          ) : (
            <>
              <span>
                {showAmount(
                  invoiceDetail.refund.refundAmount,
                  invoiceDetail.refund.currency,
                  true
                )}
              </span>
              &nbsp;&nbsp;
              <Button onClick={toggleRefundModal}>Show Detail</Button>
            </>
          )}
        </Col>
      </Row>

      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Payment type
        </Col>
        <Col span={6}>
          {invoiceDetail?.subscription != null ? 'Recurring' : 'One-time'}
        </Col>
        <Col span={4} style={colStyle}></Col>
        <Col span={6}></Col>
      </Row>

      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Discount Amount
        </Col>
        <Col span={6}>
          {invoiceDetail?.discountAmount != null
            ? showAmount(
                invoiceDetail?.discountAmount,
                invoiceDetail.currency,
                true
              )
            : 'N/A'}
        </Col>
        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>
          {' '}
          {invoiceDetail == null ||
          invoiceDetail.subscriptionId == null ||
          invoiceDetail.subscriptionId == '' ? null : (
            <span
              className="cursor-pointer text-blue-600"
              onClick={goToSub(invoiceDetail.subscriptionId)}
            >
              {' '}
              {invoiceDetail?.subscriptionId}
            </span>
          )}
        </Col>
      </Row>

      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Payment Gateway
        </Col>
        <Col span={6}>{invoiceDetail?.gateway.gatewayName}</Col>
        <Col span={4} style={colStyle}>
          User Name
        </Col>
        <Col span={6}>
          <span
            className="cursor-pointer text-blue-600"
            onClick={goToUser(invoiceDetail?.userId as number)}
          >
            {invoiceDetail &&
              `${invoiceDetail?.userAccount.firstName} ${invoiceDetail.userAccount.lastName}`}
          </span>
        </Col>
      </Row>

      {/* <UserInfo user={userProfile} /> */}
      {/* <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} /> */}

      {invoiceDetail == null ||
      invoiceDetail.sendPdf == null ||
      invoiceDetail.sendPdf == '' ? null : (
        <object
          data={invoiceDetail.sendPdf}
          type="application/pdf"
          style={{
            height: 'calc(100vh - 460px)',
            width: '100%',
            marginTop: '24px'
          }}
        >
          <p>
            <a href={invoiceDetail.sendPdf}>Download invoice</a>
          </p>
        </object>
      )}
      <div className="m-8 flex justify-center">
        <Button onClick={goBack}>Go Back</Button>
      </div>
    </div>
  )
}

export default Index
