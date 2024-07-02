import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Pagination,
  Row,
  Space,
  Table,
  message
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBSCRIPTION_STATUS } from '../../constants'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { exportDataReq, getSublist } from '../../requests'
import '../../shared.css'
import { ISubscriptionType } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'
import { SubscriptionStatus } from '../ui/statusTag'

const APP_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const SUB_STATUS_FILTER = Object.keys(SUBSCRIPTION_STATUS)
  .map((s) => ({
    text: SUBSCRIPTION_STATUS[Number(s)],
    value: Number(s)
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1))

const columns: ColumnsType<ISubscriptionType> = [
  {
    title: 'Plan Name',
    dataIndex: 'planName',
    key: 'planName',
    render: (_, sub) => <span>{sub.plan?.planName}</span>
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (_, sub) => <span>{sub.plan?.description}</span>
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (_, s) => (
      <span>{` ${showAmount(
        s.plan!.amount +
          (s.addons == null
            ? 0
            : s.addons!.reduce(
                // total subscription amount = plan amount + all addons(an array): amount * quantity
                // this value might not be the value users are gonna pay on next billing cycle
                // because, users might downgrade their plan.
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number } // destructure the quantity and amount from addon obj
                ) => sum + quantity * amount,
                0
              )),
        s.plan!.currency
      )} /${s.plan!.intervalCount == 1 ? '' : s.plan!.intervalCount}${
        s.plan!.intervalUnit
      } `}</span>
    )
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (_, sub) => SubscriptionStatus(sub.status),
    filters: SUB_STATUS_FILTER
    // onFilter: (value, record) => record.status == value,
  },
  {
    title: 'Start',
    dataIndex: 'currentPeriodStart',
    key: 'currentPeriodStart',
    render: (_, sub) =>
      // (sub.currentPeriodStart * 1000).format('YYYY-MMM-DD HH:MM')
      formatDate(sub.currentPeriodStart, true)
  },
  {
    title: 'End',
    dataIndex: 'currentPeriodEnd',
    key: 'currentPeriodEnd',
    render: (_, sub) =>
      // dayjs(sub.currentPeriodEnd * 1000).format('YYYY-MMM-DD HH:MM')
      formatDate(sub.currentPeriodEnd, true)
  },
  {
    title: 'User',
    dataIndex: 'userId',
    key: 'userId',
    render: (_, sub) => (
      <span>{`${sub.user != null ? sub.user.firstName + ' ' + sub.user.lastName : ''}`}</span>
    )
  },
  {
    title: 'Email',
    dataIndex: 'userEmail',
    key: 'userEmail',
    render: (_, sub) =>
      sub.user != null ? (
        <a href={`mailto:${sub.user.email}`}>{sub.user.email}</a>
      ) : null
  }
]

const Index = () => {
  const [form] = Form.useForm()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [subList, setSubList] = useState<ISubscriptionType[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<number[]>([])

  const fetchData = async () => {
    const searchTerm = normalizeSearchTerms()
    setLoading(true)
    const [res, err] = await getSublist(
      {
        page: page as number,
        count: PAGE_SIZE,
        status: statusFilter,
        ...searchTerm
      },
      fetchData
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { subscriptions, total } = res
    if (subscriptions == null) {
      setSubList([])
      setTotal(0)
      return
    }

    const list: ISubscriptionType[] = subscriptions.map((s: any) => {
      return {
        ...s.subscription,
        plan: s.plan,
        addons:
          s.addons == null
            ? []
            : s.addons.map((a: any) => ({
                ...a.addonPlan,
                quantity: a.quantity
              })),
        user: s.user
      }
    })
    setSubList(list)
    setTotal(total)
  }

  const onTableChange: TableProps<ISubscriptionType>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    // console.log('params', pagination, filters, sorter, extra);
    onPageChange(1, PAGE_SIZE)
    if (filters.status == null) {
      setStatusFilter([])
      return
    }
    setStatusFilter(filters.status as number[])
  }

  const normalizeSearchTerms = () => {
    let searchTerm: any = {}
    searchTerm = form.getFieldsValue()
    const start = form.getFieldValue('createTimeStart')
    const end = form.getFieldValue('createTimeEnd')
    if (start != null) {
      searchTerm.createTimeStart = start.hour(0).minute(0).second(0).unix()
    }
    if (end != null) {
      searchTerm.createTimeEnd = end.hour(23).minute(59).second(59).unix()
    }
    searchTerm.status = statusFilter
    console.log('search term:  ', searchTerm)
    return searchTerm
  }

  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, statusFilter])

  return (
    <div>
      <Search
        form={form}
        goSearch={goSearch}
        searching={loading}
        onPageChange={onPageChange}
        normalizeSearchTerms={normalizeSearchTerms}
      />
      <div className=" mb-3"></div>
      <Table
        columns={columns}
        dataSource={subList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        onChange={onTableChange}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              navigate(`${APP_PATH}subscription/${record.subscriptionId}`, {
                state: { subscriptionId: record.subscriptionId }
              })
            }
          }
        }}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
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

const Search = ({
  form,
  searching,
  goSearch,
  onPageChange,
  normalizeSearchTerms
}: {
  form: FormInstance<any>
  searching: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  normalizeSearchTerms: () => any
}) => {
  const appConfig = useAppConfigStore()
  const [exporting, setExporting] = useState(false)
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    goSearch()
  }

  const exportData = async () => {
    const payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }

    console.log('export tx params: ', payload)
    // return
    setExporting(true)
    const [res, err] = await exportDataReq({
      task: 'SubscriptionExport',
      payload
    })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'Subscription list is being exported, please check task list for progress.'
    )
    appConfig.setTaskListOpen(true)
  }

  return (
    <div>
      <Form form={form} onFinish={goSearch} disabled={searching || exporting}>
        <Row className=" mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={4} className=" font-bold text-gray-500">
            Subscription created
          </Col>
          <Col span={4}>
            <Form.Item name="createTimeStart" noStyle={true}>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="From"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="createTimeEnd"
              noStyle={true}
              rules={[
                {
                  required: false,
                  message: 'Must be later than start date.'
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    const start = getFieldValue('createTimeStart')
                    if (null == start || value == null) {
                      return Promise.resolve()
                    }
                    return value.isAfter(start)
                      ? Promise.resolve()
                      : Promise.reject('Must be later than start date')
                  }
                })
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="To"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={12} className="flex justify-end">
            <Space>
              <Button onClick={clear} disabled={searching || exporting}>
                Clear
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                loading={searching}
                disabled={searching || exporting}
              >
                Search
              </Button>
              <Button
                onClick={exportData}
                loading={exporting}
                disabled={searching || exporting}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
