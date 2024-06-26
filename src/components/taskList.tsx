import {
  InfoCircleOutlined,
  LoadingOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { Col, Divider, Input, Popover, Row, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { CSSProperties, ChangeEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism'
import { useOnClickOutside } from 'usehooks-ts'
import { INVOICE_STATUS, SUBSCRIPTION_STATUS } from '../constants'
import { formatDate, showAmount } from '../helpers'
import { usePagination } from '../hooks'
import { appSearchReq, getDownloadListReq } from '../requests'
import { IProfile, TExportDataType, UserInvoice } from '../shared.types'
import { useAppConfigStore } from '../stores'
import './appSearch.css'
import { TaskStatus } from './ui/statusTag'

SyntaxHighlighter.registerLanguage('json', json)

const { Search } = Input
const APP_PATH = import.meta.env.BASE_URL

interface IAccountInfo extends IProfile {
  subscriptionId: string
  subscriptionStatus: number
}

const Index = () => {
  const navigate = useNavigate()
  const { page, onPageChangeNoParams } = usePagination()
  const [taskList, setTaskList] = useState<TTaskItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const getList = async () => {
    setLoading(true)
    const [res, err] = await getDownloadListReq(getList)
    console.log('down list: ', res)
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
    <div>
      {taskList.map((t) => (
        <TaskItem key={t.id} t={t} />
      ))}
    </div>
  )
}

export default Index

const renderJson = (label: string, text: string) => {
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
        <div
          style={{
            width: '360px',
            maxHeight: '380px',
            minHeight: '80px',
            overflow: 'auto'
          }}
        >
          <SyntaxHighlighter language="json" style={prism}>
            {parsedJson}
          </SyntaxHighlighter>
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
        <span>{label}</span> &nbsp;
        <InfoCircleOutlined />
      </div>
    </Popover>
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
  status: number
  startTime: number
  finishTime: number
  failReason: string
}
const TaskItem = ({ t }: { t: TTaskItem }) => (
  <div style={{ height: '56px', marginBottom: '18px' }}>
    <Row style={rowStyle}>
      <Col span={3} className=" font-bold text-gray-500">
        Task
      </Col>
      <Col span={9}>
        <div className=" flex">{t.taskName}</div>
      </Col>
      <Col span={10}>{TaskStatus(t.status)}</Col>
    </Row>

    <Row style={rowStyle}>
      <Col span={3} className=" font-bold text-gray-500">
        Start
      </Col>
      <Col span={9}>{formatDate(t.startTime, true)}</Col>
      <Col span={3} className=" font-bold text-gray-500">
        End
      </Col>
      <Col>{t.finishTime == 0 ? '―' : formatDate(t.finishTime, true)}</Col>
      {/* <Col>download btn</Col> */}
    </Row>
  </div>
)

/*
      <Col span={4}>Export params</Col>
      <Col span={4}>{renderJson(t.payload)}</Col>
*/
