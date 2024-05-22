import { LoadingOutlined } from '@ant-design/icons'
import { Button, Pagination, Table, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DISCOUNT_CODE_BILLING_TYPE, DISCOUNT_CODE_TYPE } from '../../constants'
import { showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getDiscountCodeListReq } from '../../requests'
import '../../shared.css'
import { DiscountCode } from '../../shared.types.d'
import { DiscountCodeStatus } from '../ui/statusTag'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
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
      key: 'status',
      render: (s) => DiscountCodeStatus(s) // STATUS[s]
    },
    {
      title: 'Billing Type',
      dataIndex: 'billingType',
      key: 'billingType',
      render: (s) => DISCOUNT_CODE_BILLING_TYPE[s]
    },
    {
      title: 'Discount Type',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (s) => DISCOUNT_CODE_TYPE[s]
    },
    {
      title: 'Amount',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (amt, code) =>
        code.discountType == 1 ? '' : showAmount(amt, code.currency)
    },
    {
      title: 'Percentage',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      render: (percent, code) =>
        code.discountType == 1 ? `${percent / 100} %` : ''
    },
    {
      title: 'Cycle Limit',
      dataIndex: 'cycleLimit',
      key: 'cycleLimit',
      render: (lim, code) => {
        if (code.billingType == 1) {
          // one-time use
          return '1'
        } else if (code.billingType == 2) {
          // recurring
          return lim === 0 ? 'Unlimited' : lim
        } else {
          return lim
        }
      }
    },
    {
      title: 'Validity Range',
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
    const [res, err] = await getDiscountCodeListReq(
      { page, count: PAGE_SIZE },
      fetchData
    )
    console.log('code list: ', res)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { discounts, total } = res
    setCodeList(discounts ?? [])
    setTotal(total)
  }

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      {/* <Search form={form} goSearch={fetchData} searching={loading} /> */}
      <div className="my-4 flex justify-end">
        <Button type="primary" onClick={onNewCode}>
          New Discount Code
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
              navigate(`${APP_PATH}discount-code/${code.id}`, {
                state: codeList[rowIndex as number]
              })
            }
          }
        }}
      />
      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
        />
      </div>
    </div>
  )
}

export default Index
