import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popover, Space, Table, Tag, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { getWebhookListReq } from '../../requests'
import '../../shared.css'
import { IProfile, TWebhook } from '../../shared.types.d'
// import { useAppConfigStore } from '../../stores';
import WebhookDetail from './webhookDetail'
import WebhookLogs from './webhookLogs'

const Index = () => {
  // const navigate = useNavigate();
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0) // pagination props
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1)
  const [webhookList, setWebhookList] = useState<TWebhook[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const toggleDetailModal = () => setDetailModalOpen(!detailModalOpen)
  const toggleLogModal = () => setLogModalOpen(!logModalOpen)
  const [currentWebhookIdx, setCurrentWebhookIdx] = useState(-1)

  const columns: ColumnsType<TWebhook> = [
    {
      title: 'Endpoint Id',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Merchant Id',
      dataIndex: 'merchantId',
      key: 'merchantId'
    },
    {
      title: 'Url',
      dataIndex: 'webhookUrl',
      key: 'webhookUrl'
    },
    {
      title: 'Events',
      dataIndex: 'webhookEvents',
      key: 'webhookEvents',
      render: (evt, webhook) => (
        <Popover
          placement="top"
          // title="Addon breakdown"
          content={
            <Space size={[0, 8]} wrap style={{ width: '380px' }}>
              {evt.map((e: string) => (
                <Tag key={e}>{e}</Tag>
              ))}
            </Space>
          }
        >
          <div
            style={{
              width: '18px',
              height: '24px',
              cursor: 'pointer',
              color: '#1677ff'
            }}
          >
            {evt.length}
          </div>
        </Popover>
      )
    },
    {
      title: 'Modified at',
      dataIndex: 'gmtModify',
      key: 'gmtModify',
      render: (d, plan) => (
        <span>{dayjs(new Date(d * 1000)).format('YYYY-MMM-DD')}</span>
      )
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, plan) => dayjs(new Date(d * 1000)).format('YYYY-MMM-DD')
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a>Edit</a>{' '}
          <span
            className="btn-view-webhook-logs"
            onClick={(evt) => {
              setCurrentWebhookIdx(record.id)
              toggleLogModal()
            }}
          >
            <a className="btn-view-webhook-logs">View logs</a>
          </span>
        </Space>
      )
    }
  ]

  const onNewWebhook = () => {
    setCurrentWebhookIdx(-1)
    toggleDetailModal()
  }

  const fetchData = async () => {
    setLoading(true)
    const [endpointList, err] = await getWebhookListReq(fetchData)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('getting webhooks res: ', endpointList)
    setWebhookList(endpointList)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      {detailModalOpen && (
        <WebhookDetail
          detail={
            currentWebhookIdx == -1 ? null : webhookList[currentWebhookIdx]
          }
          closeModal={toggleDetailModal}
          refresh={fetchData}
        />
      )}
      {logModalOpen && (
        <WebhookLogs
          closeModal={toggleLogModal}
          endpointId={webhookList[currentWebhookIdx].id}
        />
      )}
      <div className="my-4 flex justify-end">
        <Button type="primary" onClick={onNewWebhook} icon={<PlusOutlined />}>
          New
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={webhookList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={(iv, rowIndex) => {
          return {
            onClick: (evt) => {
              setCurrentWebhookIdx(rowIndex as number)
              if (
                evt.target instanceof HTMLElement &&
                evt.target.classList.contains('btn-view-webhook-logs')
              ) {
                return
              }
              toggleDetailModal()
            }
          }
        }}
      />
    </div>
  )
}

export default Index
