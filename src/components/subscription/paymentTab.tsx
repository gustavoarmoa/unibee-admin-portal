import {
  Button,
  Checkbox,
  Col,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
// import { ISubscriptionType } from "../../shared.types";
import {
  CloseOutlined,
  DownloadOutlined,
  EditOutlined,
  LoadingOutlined,
  MailOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { CURRENCY, INVOICE_STATUS, PAYMENT_TYPE } from '../../constants'
import { showAmount } from '../../helpers'
import { downloadInvoice, getPaymentTimelineReq } from '../../requests'
import '../../shared.css'
import { IProfile, UserInvoice } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'

const PAGE_SIZE = 10
// export const INVOICE_STATUS: { [key: number]: string } = {
const APP_PATH = import.meta.env.BASE_URL

const PAYMENT_STATUS: { [key: number]: string } = {
  0: 'Pending',
  1: 'Succeeded',
  2: 'Failed'
}

type TPayment = {
  id: number
  merchantId: number
  userId: number
  subscriptionId: string
  invoiceId: string
  currency: string
  totalAmount: number
  gatewayId: number
  paymentId: string
  status: number
  timelineType: number
  createTime: number
}

const Index = ({ user }: { user: IProfile | null }) => {
  const navigate = useNavigate()
  const appConfigStore = useAppConfigStore()
  const [paymentList, setPaymentList] = useState<TPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0) // pagination props
  // const [newInvoiceModal, setNewInvoiceModal] = useState(false)

  const columns: ColumnsType<TPayment> = [
    {
      title: 'Transaction Id',
      dataIndex: 'transactionId',
      key: 'transactionId'
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, pay) => showAmount(amt, pay.currency)
      // render: (title, invoice) => <a>{title}</a>
      // render: (_, sub) => <a>{sub.plan?.planName}</a>,
    },
    {
      title: 'Type',
      dataIndex: 'timelineType',
      key: 'timelineType',
      render: (s) => <span>{PAYMENT_TYPE[s as keyof typeof PAYMENT_TYPE]}</span>
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId'
      // render: (amt, invoice) => showAmount(amt, invoice.currency, true)
      /* render: (subId) => (
        <span className="btn-subid-in-payment">
          <Button
            className="btn-subid-in-payment"
            onClick={() => navigate(`${APP_PATH}subscription/${subId}`)}
            type="link"
          >
            {subId}
          </Button>
        </span>
      ) */
    },
    // btn-view-webhook-logs
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) => (
        <span className="btn-invoiceid-in-payment">
          <Button
            className="btn-invoiceid-in-payment"
            onClick={() => navigate(`${APP_PATH}invoice/${ivId}`)}
            type="link"
          >
            {ivId}
          </Button>
        </span>
      )
      // render: (s) => INVOICE_STATUS[s as keyof typeof INVOICE_STATUS]
    },
    {
      title: 'Payment gateway',
      dataIndex: 'gatewayId',
      key: 'gatewayId',
      render: (gateway) =>
        appConfigStore.gateway.find((g) => g.gatewayId == gateway)?.gatewayName
      // subscriptionId == '' ? 'Admin' : 'System'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => PAYMENT_STATUS[status]
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, invoice) => dayjs(d * 1000).format('YYYY-MMM-DD')
    }
  ]

  const onPageChange = (page: number, pageSize: number) => {
    setPage(page - 1)
  }

  const fetchData = async () => {
    if (null == user) {
      return
    }
    setLoading(true)
    const [invoices, err] = await getPaymentTimelineReq(
      { userId: user!.id as number, page, count: PAGE_SIZE },
      fetchData
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setPaymentList(invoices)
  }

  /*
  useEffect(() => {
    fetchData()
  }, [])
  */

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* <Searchbar refresh={fetchData} /> */}
        <Table
          columns={columns}
          dataSource={paymentList}
          rowKey={'id'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          scroll={{ x: 1400, y: 640 }}
          onRow={(record, rowIndex) => {
            return {
              onClick: (evt) => {
                if (
                  evt.target instanceof HTMLElement &&
                  (evt.target.classList.contains('btn-subid-in-payment') ||
                    evt.target.classList.contains('btn-invoiceid-in-payment'))
                ) {
                  console.log('twsdd')
                  return
                }
              }
            }
          }}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
        />
        <span
          style={{ cursor: 'pointer', marginLeft: '8px' }}
          onClick={fetchData}
        ></span>
      </div>
      <div className="my-4 flex items-center justify-between">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={500}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </div>
  )
}

export default Index
