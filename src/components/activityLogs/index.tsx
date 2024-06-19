import { LoadingOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Pagination, Space, Table, Tooltip, message } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { METRICS_AGGREGATE_TYPE, METRICS_TYPE } from '../../constants'
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
    setLoading(true)
    const [res, err] = await getActivityLogsReq(fetchLogs)
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
      key: 'userId'
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, log) => formatDate(d, true) // dayjs(d * 1000).format('YYYY-MMM-DD, HH:MM:ss')
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
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onChange={onTableChange}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log('row click: ', record, '///', rowIndex)
              navigate(`${APP_PATH}billable-metric/${record.id}`)
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
