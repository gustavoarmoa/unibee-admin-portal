import { Button, Pagination, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { ReactElement, useEffect, useState } from 'react'
// import { ISubscriptionType } from "../../shared.types";
import { LoadingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { CURRENCY, INVOICE_STATUS, PAYMENT_TYPE } from '../../constants'
import { showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
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

const Index = ({
  user,
  extraButton
}: {
  user: IProfile | null
  extraButton?: ReactElement
}) => {
  const navigate = useNavigate()
  const { page, onPageChangeNoParams } = usePagination()
  const appConfigStore = useAppConfigStore()
  const [paymentList, setPaymentList] = useState<TPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const columns: ColumnsType<TPayment> = [
    {
      title: 'Transaction Id',
      dataIndex: 'transactionId',
      key: 'transactionId'
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, pay) => showAmount(amt, pay.currency)
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
    },
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
            style={{ padding: 0 }}
          >
            {ivId}
          </Button>
        </span>
      )
    },
    {
      title: 'Gateway',
      dataIndex: 'gatewayId',
      key: 'gatewayId',
      render: (gateway) =>
        appConfigStore.gateway.find((g) => g.gatewayId == gateway)?.gatewayName
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

  const fetchData = async () => {
    if (null == user) {
      return
    }
    setLoading(true)
    const [res, err] = await getPaymentTimelineReq(
      { userId: user!.id as number, page, count: PAGE_SIZE },
      fetchData
    )
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
      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          size="small"
          onChange={onPageChangeNoParams}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
      <div className="flex items-center justify-center">{extraButton}</div>
    </div>
  )
}

export default Index
