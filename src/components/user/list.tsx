import {
  EditOutlined,
  LoadingOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Space,
  Table,
  Tooltip,
  message
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import { exportDataReq, getUserListReq } from '../../requests'
import '../../shared.css'
import { IProfile } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import { SubscriptionStatus, UserStatus } from '../ui/statusTag'
import CreateUserModal from './createUserModal'

const APP_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10

const Index = () => {
  const navigate = useNavigate()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [newUserModalOpen, setNewUserModalOpen] = useState(false)
  const toggleNewUserModal = () => setNewUserModalOpen(!newUserModalOpen)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<IProfile[]>([])
  const [form] = Form.useForm()

  const normalizeSearchTerms = () => {
    const start = form.getFieldValue('createTimeStart')
    const end = form.getFieldValue('createTimeEnd')
    const searchTerms = JSON.parse(JSON.stringify(form.getFieldsValue()))
    Object.keys(searchTerms).forEach(
      (k) =>
        (searchTerms[k] == undefined ||
          (typeof searchTerms[k] == 'string' && searchTerms[k].trim() == '')) &&
        delete searchTerms[k]
    )
    if (start != null) {
      searchTerms.createTimeStart = start.hour(0).minute(0).second(0).unix()
    }
    if (end != null) {
      searchTerms.createTimeEnd = end.hour(23).minute(59).second(59).unix()
    }
    console.log('search term: ', searchTerms)
    return searchTerms
  }

  const fetchData = async () => {
    // return
    setLoading(true)
    const [res, err] = await getUserListReq(
      {
        page,
        count: PAGE_SIZE,
        ...normalizeSearchTerms()
      },
      fetchData
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { userAccounts, total } = res
    setUsers(userAccounts ?? [])
    setTotal(total)
  }

  const columns: ColumnsType<IProfile> = [
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'userName',
      render: (firstName, user) => `${user.firstName} ${user.lastName}`
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Subscription',
      dataIndex: 'subscriptionName',
      key: 'subscriptionName'
    },
    {
      title: 'Sub Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subId, _) => (
        <div
          className="btn-user-with-subid  w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          onClick={(evt) => {
            navigate(`${APP_PATH}subscription/${subId}`)
          }}
        >
          {subId}
        </div>
      )
    },
    {
      title: 'Sub Status',
      dataIndex: 'subscriptionStatus',
      key: 'subscriptionStatus',
      render: (subStatus, _) => SubscriptionStatus(subStatus) // (status, plan) => SUBSCRIPTION_STATUS[status]
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, plan) => (d === 0 ? '―' : formatDate(d)) // dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, _) => UserStatus(status)
    },
    {
      title: (
        <>
          <span></span>
          <Tooltip title="New user">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={toggleNewUserModal}
              icon={<UserAddOutlined />}
            />
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            />
          </Tooltip>
        </>
      ),
      width: 100,
      key: 'action',
      render: (_, record) => (
        <Space size="middle" className="user-action-btn-wrapper">
          <Tooltip title="Edit">
            <Button
              // disabled={copyingPlan}
              style={{ border: 'unset' }}
              // onClick={() => goToDetail(record.id)}
              icon={<EditOutlined />}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // search should always start with page 0(it shows ?page=1 on URL)
  // search result might have fewer records than PAGE_SIZE(only visible on page=1), it will be empty from page=2
  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      {newUserModalOpen && (
        <CreateUserModal closeModal={toggleNewUserModal} refresh={fetchData} />
      )}
      <Row>
        <Col span={24}>
          <Search
            form={form}
            goSearch={goSearch}
            onPageChange={onPageChange}
            searching={loading}
            normalizeSearchTerms={normalizeSearchTerms}
          />
        </Col>
      </Row>
      <div className=" h-3"></div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={(user, rowIndex) => {
          return {
            onClick: (evt) => {
              if (
                evt.target instanceof HTMLElement &&
                evt.target.classList.contains('btn-user-with-subid')
              ) {
                return
              }
              navigate(`${APP_PATH}user/${user.id}`)
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
const DEFAULT_SEARCH_TERM = {
  firstName: '',
  lastName: '',
  email: ''
}
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
    console.log('export user params: ', payload)
    // return
    setExporting(true)
    const [res, err] = await exportDataReq({ task: 'UserExport', payload })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'User list is being exported, please check task list for progress.'
    )
    appConfig.setTaskListOpen(true)
  }

  return (
    <div>
      <Form
        form={form}
        onFinish={goSearch}
        // initialValues={DEFAULT_SEARCH_TERM}
      >
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={3} className=" font-bold text-gray-500">
            Account name
          </Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="first name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="last name" />
            </Form.Item>
          </Col>

          <Col span={2} className="text-right font-bold text-gray-500">
            Email
          </Col>
          <Col span={5}>
            <Form.Item name="email" noStyle={true}>
              <Input onPressEnter={goSearch} />
            </Form.Item>
          </Col>
        </Row>

        <Row className="my-3 flex items-center" gutter={[8, 8]}>
          <Col span={3} className=" font-bold text-gray-500">
            Account created
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
          <Col span={13} className="flex justify-end">
            <Space>
              <Button onClick={clear} disabled={searching || exporting}>
                Clear
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                icon={<SearchOutlined />}
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
