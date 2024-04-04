import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Table,
  message
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBSCRIPTION_STATUS } from '../../constants'
import { emailValidate } from '../../helpers'
import { usePagination } from '../../hooks'
import {
  getMerchantUserListReq,
  getUserListReq,
  inviteMemberReq
} from '../../requests'
import '../../shared.css'
import { IMerchantUserProfile, IProfile } from '../../shared.types'
import { useAppConfigStore } from '../../stores'

const APP_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10

const Index = () => {
  const navigate = useNavigate()
  const { page, onPageChange } = usePagination()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<IMerchantUserProfile[]>([])
  // const [page, setPage] = useState(0) // pagination props
  // const onPageChange = (page: number, pageSize: number) => setPage(page - 1)
  const [form] = Form.useForm()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const toggleInviteModal = () => setInviteModalOpen(!inviteModalOpen)

  const columns: ColumnsType<IMerchantUserProfile> = [
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName'
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, plan) => dayjs(d).format('YYYY-MMM-DD')
    }
  ]

  const fetchData = async () => {
    setLoading(true)
    const [users, err] = await getMerchantUserListReq(fetchData)
    setLoading(false)
    console.log('userLIst: ', users)
    if (err != null) {
      message.error(err.message)
      return
    }
    setUsers(users)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      {inviteModalOpen && (
        <InviteModal closeModal={toggleInviteModal} refresh={fetchData} />
      )}
      {/* <Search form={form} goSearch={fetchData} searching={loading} /> */}
      <div className="my-2 flex justify-end">
        <Button type="primary" onClick={toggleInviteModal}>
          Invite
        </Button>
      </div>
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
              navigate(`${APP_PATH}customer/${user.id}`)
            }
          }
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
    </div>
  )
}

export default Index

const InviteModal = ({
  closeModal,
  refresh
}: {
  closeModal: () => void
  refresh: () => void
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const onConfirm = async () => {
    console.log('fields val: ', form.getFieldsValue())
    setLoading(true)
    const [res, err] = await inviteMemberReq(form.getFieldsValue())
    setLoading(false)
    console.log('invite res: ', res)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(
      `An invitation email has been sent to ${form.getFieldValue('email')}`
    )
    closeModal()
    refresh()
  }

  return (
    <Modal
      title={'Invite team member'}
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        form={form}
        onFinish={onConfirm}
        initialValues={{
          firstName: '',
          lastName: '',
          email: '',
          role: 'Customer Support'
        }}
      >
        <Form.Item
          label="First name"
          name="firstName"
          rules={[
            {
              required: true,
              message: "Please input invitee's first name!"
            }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Last name"
          name="lastName"
          rules={[
            {
              required: true,
              message: "Please input invitee's last name!"
            }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your Email!'
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (value != null && value != '' && emailValidate(value)) {
                  return Promise.resolve()
                }
                return Promise.reject('Please input valid email address.')
              }
            })
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Role"
          name="role"
          rules={[
            {
              required: true,
              message: "Please input invitee's role!"
            }
          ]}
        >
          <Select
            style={{ width: 180 }}
            options={[
              { value: 'Owner', label: 'Owner' },
              { value: 'Admin', label: 'Admin' },
              { value: 'Power User', label: 'Power User' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Customer Support', label: 'Customer Support' }
            ]}
          />
        </Form.Item>
      </Form>

      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

/*
const DEFAULT_SEARCH_TERM = {
  firstName: '',
  lastName: '',
  email: ''
}
const Search = ({
  form,
  searching,
  goSearch
}: {
  form: FormInstance<any>
  searching: boolean
  goSearch: () => void
}) => {
  const clear = () => form.resetFields()

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
*/
