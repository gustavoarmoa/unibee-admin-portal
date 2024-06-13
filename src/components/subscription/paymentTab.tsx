import { Button, Pagination, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { ReactElement, useEffect, useState } from 'react'
// import { ISubscriptionType } from "../../shared.types";
import { LoadingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { CURRENCY, INVOICE_STATUS, PAYMENT_TYPE } from '../../constants'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { downloadInvoice, getPaymentTimelineReq } from '../../requests'
import '../../shared.css'
import { IProfile, PaymentItem, UserInvoice } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'
import RefundInfoModal from '../payment/refundModal'
import { PaymentStatus } from '../ui/statusTag'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = ({
  user,
  extraButton,
  embeddingMode
}: {
  user?: IProfile | undefined
  extraButton?: ReactElement
  embeddingMode: boolean
}) => {
  const navigate = useNavigate()
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const pageChange = embeddingMode ? onPageChangeNoParams : onPageChange
  const appConfigStore = useAppConfigStore()
  const [paymentList, setPaymentList] = useState<PaymentItem[]>([])
  const [paymentIdx, setPaymentIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const toggleRefundModal = () => setRefundModalOpen(!refundModalOpen)

  const columns: ColumnsType<PaymentItem> = [
    {
      title: 'Transaction Id',
      dataIndex: 'transactionId',
      key: 'transactionId'
    },
    {
      title: 'External Id',
      dataIndex: 'externalTransactionId',
      key: 'externalTransactionId'
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, pay) => showAmount(amt, pay.currency)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => PaymentStatus(status) // PAYMENT_STATUS[status]
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
      title: 'Gateway',
      dataIndex: 'gatewayId',
      key: 'gatewayId',
      render: (gateway) =>
        appConfigStore.gateway.find((g) => g.gatewayId == gateway)?.displayName
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subId) =>
        subId == '' || subId == null ? (
          ''
        ) : (
          <div
            onClick={(e) => navigate(`${APP_PATH}subscription/${subId}`)}
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {subId}
          </div>
        )
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) =>
        ivId == '' || ivId == null ? (
          ''
        ) : (
          <Button
            onClick={() => navigate(`${APP_PATH}invoice/${ivId}`)}
            type="link"
            style={{ padding: 0 }}
          >
            {ivId}
          </Button>
        )
    },
    {
      title: 'User Id',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) =>
        userId == '' || userId == null ? (
          ''
        ) : (
          <div
            onClick={(e) => navigate(`${APP_PATH}user/${userId}`)}
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {userId}
          </div>
        )
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, invoice) => formatDate(d, true)
    }
  ]

  const fetchData = async () => {
    const body: any = { page, count: PAGE_SIZE }
    if (user != null) {
      body.userId = user!.id as number
    }
    setLoading(true)
    const [res, err] = await getPaymentTimelineReq(body, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { paymentTimeLines, total } = res
    setPaymentList(paymentTimeLines ?? [])
    setTotal(total)
  }

  useEffect(() => {
    fetchData()
  }, [page, user])

  return (
    <div>
      {refundModalOpen && (
        <RefundInfoModal
          closeModal={toggleRefundModal}
          detail={paymentList[paymentIdx].refund!}
          ignoreAmtFactor={false}
        />
      )}

      <Table
        columns={
          embeddingMode ? columns.filter((c) => c.key != 'userId') : columns
        }
        dataSource={paymentList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        scroll={{ x: 1400, y: 640 }}
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
          total={total}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          size="small"
          onChange={pageChange}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
      <div className="flex items-center justify-center">{extraButton}</div>
    </div>
  )
}

export default Index
