import {
  DeleteOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Space, Switch, Tooltip, message } from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import update from 'immutability-helper'
import { useEffect, useState } from 'react'
import { PERMISSION_LIST } from '../../../constants'
import { getRoleListReq, saveRoleReq } from '../../../requests'
import { TRole } from '../../../shared.types'

const Index = () => {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<TRole[]>([])

  const fetchRoles = async () => {
    setLoading(true)
    const [res, err] = await getRoleListReq(fetchRoles)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { merchantRoles, total } = res
    setRoles(merchantRoles)
    console.log('roles res: ', res)
  }

  const onSave = (r: TRole) => async () => {
    const role = JSON.parse(JSON.stringify(r))
    delete role.createTime
    delete role.id
    delete role.merchantId
    console.log('role saving...: ', role)
    setLoading(true)
    const [res, err] = await saveRoleReq(role, r.id == null)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
  }

  const onDelete = async () => {}

  const onRoleNameChange = () => {}

  const onPermChange = (role: string, group: string) => (checked: boolean) => {
    console.log('role/grp: ', role, '//', group, '//', checked)
    const rowIdx = roles.findIndex((r) => r.role == role)
    console.log('rowIdx: ', rowIdx)
    if (rowIdx == -1) {
      return
    }
    const colIdx =
      roles[rowIdx].permissions == null
        ? -1
        : roles[rowIdx].permissions.findIndex((p) => p.group == group)
    console.log('colIdx: ', colIdx)
    let newRoles = roles
    if (colIdx == -1) {
      if (newRoles[rowIdx].permissions == null) {
        newRoles = update(newRoles, { [rowIdx]: { permissions: { $set: [] } } })
      }
      newRoles = update(newRoles, {
        [rowIdx]: {
          permissions: {
            $push: [{ group, permissions: checked ? ['access'] : [] }]
          }
        }
      })
    } else {
      newRoles = update(newRoles, {
        [rowIdx]: {
          permissions: {
            [colIdx]: { permissions: { $set: checked ? ['access'] : [] } }
          }
        }
      })
    }
    console.log('new roles: ', newRoles)
    setRoles(newRoles)
  }

  const columns: ColumnsType<TRole> = [
    { title: 'Role', dataIndex: 'role', key: 'role', fixed: 'left' },
    ...PERMISSION_LIST.map((p) => ({
      title: p.group,
      dataIndex: 'permissions',
      key: p.group,
      render: (perm: any, record: any) => {
        // console.log('perm/record: ', perm, '//', record)
        /* if (perm == null) {
          return <Switch size="small" checked={false} />
        } */
        const g =
          perm == null ? undefined : perm.find((pm: any) => pm.group == p.group)
        return (
          <Switch
            size="small"
            onChange={onPermChange(record.role, p.group)}
            checked={
              g != null && g.permissions != null && g.permissions.length > 0
            }
          />
        )
      }
    })),
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="New role">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={() => {
                /// setInvoiceIdx(-1)
                // toggleNewInvoiceModal()
              }}
              icon={<PlusOutlined />}
              // disabled={user == null}
            />
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchRoles}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      width: 150,
      fixed: 'right',
      key: 'actions',
      render: (_, role) => (
        <Space
          size="small"
          className="invoice-action-btn-wrapper"
          // style={{ width: '170px' }}
        >
          <Tooltip title="Save">
            <Button
              onClick={onSave(role)}
              icon={<SaveOutlined />}
              style={{ border: 'unset' }}
              // disabled={!getInvoicePermission(invoice).editable}
            />
          </Tooltip>
          <Tooltip title="Remove">
            <Button
              // onClick={refund}
              icon={<MinusOutlined />}
              style={{ border: 'unset' }}
              // disabled={!getInvoicePermission(invoice).refundable}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  useEffect(() => {
    fetchRoles()
  }, [])
  return (
    <>
      <Table
        columns={columns}
        dataSource={roles}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        scroll={{ x: 1600, y: 800 }}
        // onChange={onTableChange}
        /* onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('.plan-action-btn-wrapper') != null
              ) {
                return
              }
              navigate(`${APP_PATH}plan/${record.id}`)
            }
          }
        }} */
      />
      {/* <div className="my-2 flex justify-end gap-4">
        <Button>Apply Change</Button>
        <Button onClick={onAddNewRole}>Add New Role</Button>
      </div> */}
    </>
  )
}

export default Index
