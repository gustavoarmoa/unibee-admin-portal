import {
  DownloadOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Drawer,
  Pagination,
  Popover,
  Row,
  Spin,
  Tooltip,
  message
} from 'antd'
import axios from 'axios'
import { CSSProperties, useEffect, useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism'
import { formatDate } from '../helpers'
import { usePagination } from '../hooks'
import { getDownloadListReq } from '../requests'
import { TExportDataType } from '../shared.types'
import './appSearch.css'
import { TaskStatus } from './ui/statusTag'

SyntaxHighlighter.registerLanguage('json', json)

const APP_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10

const Index = ({ onClose }: { onClose: () => void }) => {
  const { page, onPageChangeNoParams } = usePagination()
  const [taskList, setTaskList] = useState<TTaskItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const getList = async () => {
    setLoading(true)
    const [res, err] = await getDownloadListReq(page, PAGE_SIZE, getList)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { downloads, total } = res
    setTaskList(downloads ?? [])
    setTotal(total)
  }

  useEffect(() => {
    getList()
  }, [])

  return (
    <Drawer
      title="Task list"
      placement="right"
      width={500}
      onClose={onClose}
      open={true}
      extra={
        <Tooltip title="Refresh">
          <span
            className={` ${loading ? ' cursor-not-allowed' : ' cursor-pointer'}`}
            onClick={getList}
          >
            <SyncOutlined />
          </span>
        </Tooltip>
      }
    >
      <div>
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 24 }} />}
          spinning={loading}
        >
          <div
            style={{
              overflowY: 'auto',
              height: '100%',
              maxHeight: 'calc(100vh - 120px)'
            }}
          >
            {taskList.map((t) => (
              <TaskItem key={t.id} t={t} />
            ))}
          </div>
        </Spin>

        <div className="mx-0 my-4 flex items-center justify-end">
          <Pagination
            current={page + 1} // back-end starts with 0, front-end starts with 1
            pageSize={PAGE_SIZE}
            total={total}
            size="small"
            onChange={onPageChangeNoParams}
            disabled={loading}
            showSizeChanger={false}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>
      </div>
    </Drawer>
  )
}

export default Index

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
    <div>
      <Popover
        placement="right"
        content={
          <div>
            <SyntaxHighlighter language="json" style={prism}>
              {parsedJson}
            </SyntaxHighlighter>
          </div>
        }
      >
        <div className=" cursor-pointer">
          <InfoCircleOutlined />
        </div>
      </Popover>
    </div>
  )
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '24px',
  color: '#757575'
}

type TTaskItem = {
  id: number
  merchantId: number
  memberId: number
  taskName: TExportDataType
  payload: string
  downloadUrl: string
  uploadFileUrl: string
  status: number
  startTime: number
  finishTime: number
  failReason: string
}
const TaskItem = ({ t }: { t: TTaskItem }) => {
  const onDownload = (url: string) => () => {
    axios({
      url,
      method: 'GET',
      responseType: 'blob'
    }).then((response) => {
      const href = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = href
      link.setAttribute('download', 'exportedData.xlsx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
    })
  }
  return (
    <div style={{ height: '56px', marginBottom: '18px' }}>
      <Row style={rowStyle}>
        <Col span={3} className=" font-bold text-gray-500">
          Task
        </Col>
        <Col span={9}>
          <div className=" flex">
            {t.taskName}&nbsp;{t.payload != 'null' && renderJson(t.payload)}
          </div>
        </Col>
        <Col span={8}>{TaskStatus(t.status)}</Col>
        <Col span={4}>
          {t.status == 2 && (
            <Button
              onClick={onDownload(t.uploadFileUrl)}
              size="small"
              icon={<DownloadOutlined />}
            />
          )}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={3} className=" font-bold text-gray-500">
          Start
        </Col>
        <Col span={9}>{formatDate(t.startTime, true)}</Col>
        <Col span={2} className=" font-bold text-gray-500">
          End
        </Col>
        <Col>{t.finishTime == 0 ? '―' : formatDate(t.finishTime, true)}</Col>
      </Row>
    </div>
  )
}
