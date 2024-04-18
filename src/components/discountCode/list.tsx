import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  Col,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Select,
  Table,
  message
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRENCY, INVOICE_STATUS, SUBSCRIPTION_STATUS } from '../../constants'
import { showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getDiscountCodeListReq, getInvoiceListReq } from '../../requests'
import '../../shared.css'
import { DiscountCode, UserInvoice } from '../../shared.types.d'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const { page, onPageChange } = usePagination()
  const navigate = useNavigate()
  // const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [codeList, setCodeList] = useState<DiscountCode[]>([])

  const columns: ColumnsType<DiscountCode> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code'
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status'
    },
    {
      title: 'Billing Type',
      dataIndex: 'billingType',
      key: 'billingType'
    },
    {
      title: 'Discount Type',
      dataIndex: 'discountType',
      key: 'discountType'
    },
    {
      title: 'Amount',
      dataIndex: 'discountAmount',
      key: 'discountAmount'
    },
    {
      title: 'Percentage',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage'
    },
    {
      title: 'Cycle Limit',
      dataIndex: 'cycleLimit',
      key: 'cycleLimit'
    },
    {
      title: 'Validity range',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (start, code) =>
        dayjs(start * 1000).format('YYYY-MMM-DD') +
        ' ~ ' +
        dayjs(code.endTime * 1000).format('YYYY-MMM-DD')
    }
  ]

  const onNewCode = () => {
    onPageChange(1, 100)
    navigate(`${APP_PATH}discount-code/new`)
  }
  const fetchData = async () => {
    setLoading(true)
    const [list, err] = await getDiscountCodeListReq(fetchData)
    console.log('code list: ', list)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setCodeList(list || [])
  }

  useEffect(() => {
    fetchData()
  }, [])
  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      {/* <Search form={form} goSearch={fetchData} searching={loading} /> */}
      <div className="my-4 flex justify-end">
        <Button type="primary" onClick={onNewCode}>
          New Discount-Code
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={codeList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={(code, rowIndex) => {
          return {
            onClick: (evt) => {
              navigate(`${APP_PATH}discount-code/${code.id}`)
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
