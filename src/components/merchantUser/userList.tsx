import { LoadingOutlined, SyncOutlined } from '@ant-design/icons'
import {
  Button,
  Form,
  Input,
  Modal,
  Pagination,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { emailValidate, formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import {
  getMerchantUserListReq,
  getRoleListReq,
  inviteMemberReq,
  updateMemberRolesReq
} from '../../requests'
import '../../shared.css'
import { IMerchantUserProfile, IProfile, TRole } from '../../shared.types'
import { useProfileStore } from '../../stores'

const APP_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10

const Index = () => {
  // const navigate = useNavigate()
  const profileStore = useProfileStore()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<IMerchantUserProfile[]>([])
  const [activeUser, setActiveUser] = useState<
    IMerchantUserProfile | undefined
  >(undefined) // user to be edited in Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const toggleInviteModal = () => {
    if (inviteModalOpen) {
      // before closing the modal, set user = null, otherwise, clicking 'invite' button will the previous active user data
      setActiveUser(undefined)
    }
    setInviteModalOpen(!inviteModalOpen)
  }

  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getMerchantUserListReq(fetchData)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { merchantMembers, total } = res
    setUsers(merchantMembers ?? [])
    setTotal(total)
  }

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
      title: 'Roles',
      dataIndex: 'MemberRoles',
      key: 'MemberRoles',
      render: (roles, user) => (
        <Popover
          placement="top"
          content={
            <Space size={[0, 8]} wrap>
              {roles.map((role: TRole) => (
                <Tag key={role.id as number}>{role.role}</Tag>
              ))}
            </Space>
          }
        >
          <div
            className="btn-merchant-user-roles"
            style={{
              width: '18px',
              height: '24px',
              cursor: 'pointer',
              color: '#1677ff'
            }}
          >
            {roles.length}
          </div>
        </Popover>
      )
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
      render: (d, plan) => (d === 0 ? '―' : formatDate(d)) // dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: (
        <>
          {/* <span>Actions</span> */}
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      width: 40,
      key: 'action'
    }
  ]

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      {inviteModalOpen && (
        <InviteModal
          closeModal={toggleInviteModal}
          refresh={fetchData}
          userData={activeUser}
        />
      )}
      {/* <Search form={form} goSearch={fetchData} searching={loading} /> */}
      {profileStore.isOwner && (
        <div className="my-2 flex justify-end">
          <Button type="primary" onClick={toggleInviteModal}>
            Invite
          </Button>
        </div>
      )}
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
                evt.target.classList.contains('btn-merchant-user-roles')
              ) {
                setActiveUser(user)
                toggleInviteModal()
                return
              }
              // navigate(`${APP_PATH}admin/${user.id}`)
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
    </div>
  )
}

export default Index

// this Modal is used to invite new users and edit existing user's roles
const InviteModal = ({
  closeModal,
  refresh,
  userData
}: {
  closeModal: () => void
  refresh: () => void
  userData: IMerchantUserProfile | undefined
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<TRole[]>([])
  const isNew = userData == undefined

  const onConfirm = async () => {
    const body: any = form.getFieldsValue()
    setLoading(true)
    if (isNew) {
      const [res, err] = await inviteMemberReq(body)
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
    } else {
      const [res, err] = await updateMemberRolesReq({
        memberId: body.id,
        roleIds: body.roleIds
      })
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
    }

    message.success(
      isNew
        ? `An invitation email has been sent to ${form.getFieldValue('email')}`
        : 'New roles saved'
    )
    closeModal()
    refresh()
  }

  const getRoleList = async () => {
    setLoading(true)
    const [res, err] = await getRoleListReq(getRoleList)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { merchantRoles, total } = res
    setRoles(merchantRoles ?? [])
  }

  useEffect(() => {
    getRoleList()
  }, [])

  return (
    <Modal
      title={`${isNew ? 'Invite team member' : 'Edit team member roles'}`}
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        form={form}
        style={{ margin: '24px 0' }}
        onFinish={onConfirm}
        initialValues={
          !isNew
            ? {
                ...userData,
                roleIds: userData.MemberRoles.map((r: TRole) => r.id as number)
              }
            : {
                firstName: '',
                lastName: '',
                email: '',
                role: []
              }
        }
      >
        {!isNew && (
          <Form.Item name="id" label="User Id" hidden>
            <Input />
          </Form.Item>
        )}

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
          <Input disabled={!isNew || loading} />
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
          <Input disabled={!isNew || loading} />
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
          <Input disabled={!isNew || loading} />
        </Form.Item>
        <Form.Item
          label="Roles"
          name="roleIds"
          rules={[
            {
              required: true,
              message: 'Please select at least one role!'
            }
          ]}
        >
          <Select
            mode="multiple"
            disabled={loading}
            style={{ width: '100%' }}
            options={roles.map((r) => ({
              label: r.role,
              value: r.id as number
            }))}
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
          {`${isNew ? 'Invite' : 'OK'}`}
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
