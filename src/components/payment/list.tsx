import { LoadingOutlined } from '@ant-design/icons'
import { Button, Form, Pagination, Table, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PAYMENT_STATUS, PAYMENT_TYPE } from '../../constants'
import { showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getPaymentTimelineReq } from '../../requests'
import '../../shared.css'
import { PaymentItem } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'
import RefundModal from './refundModal'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const { page, onPageChange } = usePagination()
  const appConfigStore = useAppConfigStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [paymentList, setPaymentList] = useState<PaymentItem[]>([])
  const [paymentIdx, setPaymentIdx] = useState(-1)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)

  const columns: ColumnsType<PaymentItem> = [
    {
      title: 'Transaction Id',
      dataIndex: 'transactionId',
      key: 'transactionId'
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, pay) => (
        <div>
          <span>{showAmount(amt, pay.currency)}</span>
        </div>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <span>{PAYMENT_STATUS[s as keyof typeof PAYMENT_STATUS]}</span>
      )
    },
    {
      title: 'Type',
      dataIndex: 'timelineType',
      key: 'timelineType',
      render: (s) => {
        const title = PAYMENT_TYPE[s as keyof typeof PAYMENT_TYPE]
        if (s == 1) {
          // refund
          return (
            <Button
              type="link"
              style={{ padding: 0 }}
              className="btn-refunded-payment"
            >
              {title}
            </Button>
          )
        } else if (s == 0) {
          // regular payment
          return title
        }
      }
    },
    {
      title: 'Sub Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId'
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (iv) =>
        iv == '' || iv == null ? (
          ''
        ) : (
          <Button
            type="link"
            style={{ padding: 0 }}
            className="btn-invoice-id"
            onClick={() => navigate(`${APP_PATH}invoice/${iv}`)}
          >
            {iv}
          </Button>
        )
    },
    {
      title: 'User Id',
      dataIndex: 'userId',
      key: 'userId'
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
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => dayjs(d * 1000).format('YYYY-MMM-DD')
    }
  ]

  const fetchData = async () => {
    setLoading(true)
    const [paymentList, err] = await getPaymentTimelineReq(
      {
        page,
        count: PAGE_SIZE
        // ...searchTerm,
      },
      fetchData
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setPaymentList(paymentList || [])
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
      {/* <Search form={form} goSearch={fetchData} searching={loading} /> */}
      {refundModalOpen && (
        <RefundModal
          closeModal={toggleRefundModal}
          detail={paymentList[paymentIdx].refund!}
        />
      )}
      <Table
        columns={columns}
        dataSource={paymentList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('.btn-refunded-payment') != null
              ) {
                setPaymentIdx(rowIndex as number)
                toggleRefundModal()
                return
              }
            }
          }
        }}
      />
      <div className="mx-0 my-4 flex items-center justify-end">
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
