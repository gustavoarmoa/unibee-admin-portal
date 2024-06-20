import { LoadingOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  message
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRENCY, METRICS_AGGREGATE_TYPE, METRICS_TYPE } from '../../constants'
import { getActivityLogsReq } from '../../requests'
import { TActivityLogs } from '../../shared.types.d'

import { formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import '../../shared.css'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const navigate = useNavigate()
  const [total, setTotal] = useState(0)
  const { page, onPageChange } = usePagination()
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<TActivityLogs[]>([])

  const fetchLogs = async () => {
    const searchTerm = { page, count: PAGE_SIZE }
    setLoading(true)
    const [res, err] = await getActivityLogsReq(searchTerm, fetchLogs)
    setLoading(false)
    if (err != null) {
      message.error((err as Error).message)
      return
    }
    const { merchantOperationLogs, total } = res
    setLogs(merchantOperationLogs ?? [])
    setTotal(total)
  }

  const columns: ColumnsType<TActivityLogs> = [
    {
      title: 'By',
      dataIndex: 'member',
      key: 'member',
      render: (m, _) => m.firstName + ' ' + m.lastName
    },
    {
      title: 'Target',
      dataIndex: 'optTarget',
      key: 'optTarget'
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Content',
      dataIndex: 'optContent',
      key: 'optContent'
    },
    {
      title: 'User Id',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) =>
        userId == 0 ? (
          '―'
        ) : (
          <Button
            type="link"
            onClick={() => navigate(`${APP_PATH}user/${userId}`)}
            className="log-key-info-id"
            style={{ padding: 0 }}
          >
            {userId}
          </Button>
        )
    },
    {
      title: 'Time',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, log) => formatDate(d, true) // dayjs(d * 1000).format('YYYY-MMM-DD, HH:MM:ss')
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (invoiceId) =>
        invoiceId == '' ? (
          '―'
        ) : (
          <Button
            onClick={() => navigate(`${APP_PATH}invoice/${invoiceId}`)}
            type="link"
            className="log-key-info-id"
            style={{ padding: 0 }}
          >
            {invoiceId}
          </Button>
        )
    },
    {
      title: 'Plan Id',
      dataIndex: 'planId',
      key: 'planId',
      render: (planId) =>
        planId == '' ? (
          '―'
        ) : (
          <Button
            onClick={() => navigate(`${APP_PATH}plan/${planId}`)}
            type="link"
            className="log-key-info-id"
            style={{ padding: 0 }}
          >
            {planId}
          </Button>
        )
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subId) =>
        subId == '' ? (
          '―'
        ) : (
          <Button
            onClick={() => navigate(`${APP_PATH}subscription/${subId}`)}
            type="link"
            className="log-key-info-id"
            style={{ padding: 0 }}
          >
            {subId}
          </Button>
        )
    },
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchLogs}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <a>View detail</a>
        </Space>
      )
    }
  ]

  const onTableChange: TableProps<TActivityLogs>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    console.log('params', pagination, filters, sorter, extra)
    if (filters.status == null) {
      return
    }
    // setStatusFilter(filters.status as number[]);
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  return (
    <>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        scroll={{ x: 1680 }}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onChange={onTableChange}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              const tgt = event.target
              // navigate(`${APP_PATH}billable-metric/${record.id}`)
              if (
                tgt instanceof HTMLElement &&
                tgt.classList.contains('log-key-info-id')
              ) {
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
          size="small"
          onChange={onPageChange}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </>
  )
}

export default Index

const DEFAULT_TERM = {
  currency: 'EUR',
  status: [],
  amountStart: '',
  amountEnd: ''
  // refunded: false,
}
const Search = ({
  form,
  searching,
  goSearch,
  onPageChange
}: {
  form: FormInstance<any>
  searching: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
}) => {
  /* const statusOpt = Object.keys(INVOICE_STATUS).map((s) => ({
      value: Number(s),
      label: INVOICE_STATUS[Number(s)]
    })) */
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    goSearch()
  }
  const watchCurrency = Form.useWatch('currency', form)
  useEffect(() => {
    // just to trigger rerender when currency changed
  }, [watchCurrency])

  const currencySymbol =
    CURRENCY[form.getFieldValue('currency') || DEFAULT_TERM.currency].symbol

  return (
    <div>
      <Form form={form} initialValues={DEFAULT_TERM} disabled={searching}>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4}>First/Last name</Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="first name" />
            </Form.Item>
          </Col>
          /
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="last name" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <span></span>
            {/* <Form.Item name="refunded" noStyle={true} valuePropName="checked">
                <Checkbox>Refunded</Checkbox>
    </Form.Item> */}
          </Col>
          <Col span={8} className="flex justify-end">
            <Button onClick={clear} disabled={searching}>
              Clear
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              onClick={goSearch}
              type="primary"
              loading={searching}
              disabled={searching}
            >
              Search
            </Button>
          </Col>
        </Row>

        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4}>
            <div className="flex items-center">
              <span className="mr-2">Amount</span>
              <Form.Item name="currency" noStyle={true}>
                <Select
                  style={{ width: 80 }}
                  options={[
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                    { value: 'JPY', label: 'JPY' }
                  ]}
                />
              </Form.Item>
            </div>
          </Col>
          <Col span={4}>
            <Form.Item name="amountStart" noStyle={true}>
              <Input
                prefix={`from ${currencySymbol}`}
                onPressEnter={goSearch}
              />
            </Form.Item>
          </Col>
          &nbsp;
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input prefix={`to ${currencySymbol}`} onPressEnter={goSearch} />
            </Form.Item>
          </Col>
          <Col span={11}>
            <span className="mr-2">Status</span>
            <Form.Item name="status" noStyle={true}>
              <Select
                mode="multiple"
                options={[]}
                style={{ maxWidth: 420, minWidth: 120, margin: '8px 0' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
