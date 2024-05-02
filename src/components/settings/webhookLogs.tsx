import { CopyOutlined, LoadingOutlined } from '@ant-design/icons'
import { Button, Modal, Pagination, Popover, Table, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism'
import { useCopyContent } from '../../hooks'
import { getWebhookLogs } from '../../requests'
import { TWebhookLogs } from '../../shared.types.d'
SyntaxHighlighter.registerLanguage('json', json)

const PAGE_SIZE = 10

const Index = ({
  closeModal,
  endpointId
}: {
  closeModal: () => void
  endpointId: number
}) => {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<TWebhookLogs[]>([])
  const [page, setPage] = useState(0)
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1)
  const copyContent = (text: string) => async () => {
    const err = await useCopyContent(text)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Copied')
  }

  const renderJson = (text: string) => {
    if (null == text || '' == text) {
      return ''
    }
    let parsedJson = ''
    try {
      parsedJson = JSON.stringify(JSON.parse(text), null, 2)
    } catch (err) {
      parsedJson = text
    }

    return (
      <Popover
        placement="right"
        content={
          <div style={{ width: '360px', height: '380px', overflow: 'auto' }}>
            <SyntaxHighlighter language="json" style={prism}>
              {parsedJson}
            </SyntaxHighlighter>

            <Button
              type="link"
              size="small"
              onClick={copyContent(parsedJson)}
              icon={<CopyOutlined />}
              style={{
                position: 'absolute',
                right: '22px',
                bottom: '12px',
                opacity: 0.7
              }}
            >
              Copy
            </Button>
          </div>
        }
      >
        <div
          style={{
            width: '80px',
            height: '60px',
            overflow: 'hidden'
          }}
        >
          {text}
        </div>
      </Popover>
    )
  }

  const columns: ColumnsType<TWebhookLogs> = [
    {
      title: 'Url',
      dataIndex: 'webhookUrl',
      key: 'webhookUrl',
      width: 80,
      render: (text) => (
        <div
          style={{
            width: '80px',
            height: '60px',
            overflow: 'hidden'
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      )
    },
    {
      title: 'Event',
      dataIndex: 'webhookEvent',
      key: 'webhookEvent',
      width: 80,
      render: (text) => (
        <div
          style={{
            width: '80px',
            height: '60px',
            overflow: 'hidden'
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      )
    },
    {
      title: 'Request Id',
      dataIndex: 'requestId',
      key: 'requestId',
      width: 80,
      render: (text) => (
        <div
          style={{
            width: '80px',
            height: '60px',
            overflow: 'hidden'
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      )
    },
    {
      title: 'Request Body',
      dataIndex: 'body',
      key: 'body',
      width: 80,
      render: (text) => renderJson(text)
    },
    {
      title: 'Response',
      dataIndex: 'response',
      key: 'response',
      width: 80,
      render: (text) => renderJson(text)
    },
    {
      title: 'mamo',
      dataIndex: 'mamo',
      key: 'mamo',
      width: 80,
      render: (text) => renderJson(text)
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 80,
      render: (d, plan) =>
        dayjs(new Date(d * 1000)).format('YYYY-MMM-DD HH:MM:ss')
    }
  ]

  const fetchData = async () => {
    setLoading(true)
    const [endpointLogList, err] = await getWebhookLogs(
      { endpointId, page, count: PAGE_SIZE },
      fetchData
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    setLogs(endpointLogList)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <Modal
      open={true}
      footer={null}
      title="Webhook Logs"
      closeIcon={null}
      width={1024}
    >
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
      <div className="my-6 flex items-center justify-end">
        <div>
          <Button onClick={closeModal} type="primary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Index
