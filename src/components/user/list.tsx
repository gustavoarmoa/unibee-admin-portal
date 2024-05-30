import {
  LoadingOutlined,
  SearchOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Table,
  message
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePagination } from '../../hooks'
import { getUserListReq } from '../../requests'
import '../../shared.css'
import { IProfile } from '../../shared.types'
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

  const columns: ColumnsType<IProfile> = [
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'userName',
      render: (firstName, user) => `${user.firstName} ${user.lastName}`
    },
    /* {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName'
    }, */
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
      render: (d, plan) =>
        d === 0 ? 'N/A' : dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, _) => UserStatus(status)
    }
  ]

  const fetchData = async () => {
    const searchTerm = form.getFieldsValue()
    setLoading(true)
    const [res, err] = await getUserListReq(
      {
        page,
        count: PAGE_SIZE,
        ...searchTerm
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
        <Col span={22}>
          <Search
            form={form}
            goSearch={goSearch}
            onPageChange={onPageChange}
            searching={loading}
          />{' '}
        </Col>
        <Col span={2}>
          <Button
            type="primary"
            onClick={toggleNewUserModal}
            icon={<UserAddOutlined />}
          >
            Add New
          </Button>
        </Col>
      </Row>

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
  onPageChange
}: {
  form: FormInstance<any>
  searching: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
}) => {
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    goSearch()
  }

  return (
    <div>
      <Form form={form} initialValues={DEFAULT_SEARCH_TERM}>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={3}>First/Last name</Col>
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

          <Col span={6} className="flex justify-end">
            <Button onClick={clear} disabled={searching}>
              Clear
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              onClick={goSearch}
              type="primary"
              icon={<SearchOutlined />}
              loading={searching}
              disabled={searching}
            >
              Search
            </Button>
          </Col>
        </Row>
        <Row className="my-3 flex items-center" gutter={[8, 8]}>
          <Col span={3}>Email</Col>
          <Col span={4}>
            <Form.Item name="email" noStyle={true}>
              <Input onPressEnter={goSearch} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
