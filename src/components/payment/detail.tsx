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
import { getInvoiceDetailReq, getPaymentDetailReq } from '../../requests'
import { IProfile, TInvoicePerm, UserInvoice } from '../../shared.types.d'
import { normalizeAmt } from '../helpers'
import RefundModal from '../payment/refundModal'
import InvoiceDetailModal from '../subscription/modals/invoiceDetail'
import { InvoiceStatus } from '../ui/statusTag'
// import MarkAsPaidModal from './markAsPaidModal'
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
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false)
  const toggleMarkPaidModal = () => setMarkPaidModalOpen(!markPaidModalOpen)

  const goBack = () => navigate(`${APP_PATH}transaction/list`)
  const goToUser = (userId: number) => () =>
    navigate(`${APP_PATH}user/${userId}`)
  const goToSub = (subId: string) => () =>
    navigate(`${APP_PATH}subscription/${subId}`)

  const fetchData = async () => {
    const pathName = window.location.pathname.split('/')
    const paymentId = pathName.pop()
    if (paymentId == null) {
      message.error('Invalid payment')
      return
    }
    setLoading(true)
    const [paymentDetail, err] = await getPaymentDetailReq(paymentId, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    console.log('payment detail res: ', paymentDetail)
    const { gateway, invoice, payment, user } = paymentDetail
    /*
    const { invoice } = res
    normalizeAmt([invoice])
    setInvoiceDetail(invoice)
    */
    /*
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
    */
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      dd
      <div className="m-8 flex justify-center">
        <Button onClick={goBack}>Go Back</Button>
      </div>
    </div>
  )
}

export default Index
