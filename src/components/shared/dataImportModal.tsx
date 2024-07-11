import {
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  LoadingOutlined,
  MoreOutlined,
  SearchOutlined,
  SyncOutlined,
  UploadOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Dropdown,
  Form,
  FormInstance,
  Input,
  MenuProps,
  Modal,
  Pagination,
  Row,
  Space,
  Spin,
  Steps,
  Table,
  Tooltip,
  message
} from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBSCRIPTION_STATUS, USER_STATUS } from '../../constants'
import { downloadStaticFile, formatBytes, formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import {
  exportDataReq,
  getPlanList,
  getUserListReq,
  importDataReq
} from '../../requests'
import '../../shared.css'
import { IProfile } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import { SubscriptionStatus, UserStatus } from '../ui/statusTag'
import './list.css'

const Index = ({
  closeModal,
  downloadTemplate,
  title
}: {
  closeModal: () => void
  downloadTemplate: () => void
  title?: string
}) => {
  const appConfig = useAppConfigStore()
  const [importing, setImporting] = useState(false)
  const [fileStat, setFileStat] = useState({ name: '', size: 0 })

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    evt
  ) => {
    console.log('file change: ', evt)
    if (evt.target.files == null) {
      return
    }
    const f = evt.target.files[0]
    if (f.size > 1024 * 1024 * 20) {
      message.error('Max file size is 20M')
      return
    }
    setFileStat({ name: f.name, size: f.size })
    // evt.preventDefault()
    setImporting(true)
    const [res, err] = await importDataReq(f, 'UserImport')
    setImporting(false)
    evt.target.value = ''
    if (null != err) {
      message.error(`File upload failed: ${err.message}`)
      return
    }
    message.success(
      'User data is being imported, please check task list for progress'
    )
    closeModal()
    appConfig.setTaskListOpen(true)
  }

  return (
    <Modal
      title={title ?? 'Data import'}
      width={'620px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div className=" my-6">
        <Steps
          direction="vertical"
          size="small"
          // progressDot={true}
          current={1}
          items={[
            {
              title: (
                <Button
                  onClick={downloadTemplate}
                  size="small"
                  icon={<DownloadOutlined />}
                >
                  Download template file
                </Button>
              ),
              description: (
                <span className=" text-xs text-gray-500">
                  To-be-imported user data must comply to the structure in this
                  template file.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className=" text-lg text-gray-900">
                  Populate template file with your user data
                </span>
              ),
              description: (
                <span className=" text-xs text-gray-500">
                  You cannot remove/modify column name in this file.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <div className="items-c flex">
                  <label htmlFor="input-user-data-file">
                    <div
                      className={`user-data-file-upload flex items-center ${importing ? 'disabled' : ''}`}
                    >
                      {importing ? <LoadingOutlined /> : <UploadOutlined />}{' '}
                      <span className=" ml-2">Upload and import user data</span>
                    </div>
                  </label>
                  <div className="ml-2 flex items-center text-sm text-gray-500">
                    {`${fileStat.name} ${fileStat.size == 0 ? '' : '(' + formatBytes(fileStat.size) + ')'}`}
                  </div>
                  <input
                    type="file"
                    hidden
                    disabled={importing}
                    onChange={onFileChange}
                    // onClick={onFileClick}
                    style={{ display: 'none' }}
                    id="input-user-data-file"
                    name="input-user-data-file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  />
                </div>
              ),
              description: (
                <span className="text-xs text-gray-500">
                  Max file size: <span className=" text-red-500">20M</span>
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className=" text-gray-900">
                  Open task list to check importing progress
                </span>
              ),
              description: (
                <span className=" text-xs text-gray-500">
                  In case of importing error, you can download the user data
                  file you just uploaded, each error will be explained in
                  detail.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className=" text-gray-900">
                  Go to User List page to further ensure data are imported
                </span>
              ),
              status: 'process'
            }
          ]}
        />
        <div className=" flex items-center justify-end gap-4">
          <Button onClick={closeModal} disabled={importing}>
            Close
          </Button>
          {/* <Button
              type="primary"
              // onClick={form.submit}
              // loading={loading}
              // disabled={loading}
            >
              Import
            </Button> */}
        </div>
      </div>
    </Modal>
  )
}

export default Index
