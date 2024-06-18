import {
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Input, Space, Switch, Tooltip, message } from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import update from 'immutability-helper'
import { ChangeEventHandler, useEffect, useState } from 'react'
import { PERMISSION_LIST } from '../../../constants'
import { ramdonString } from '../../../helpers'
import { getRoleListReq, saveRoleReq } from '../../../requests'
import { TRole } from '../../../shared.types'

const Index = () => {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<TRole[]>([])
  const [errLocalId, setErrLocalId] = useState('')

  const fetchRoles = async () => {
    setLoading(true)
    const [res, err] = await getRoleListReq(fetchRoles)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { merchantRoles, total } = res
    merchantRoles.forEach((r: TRole) => (r.localId = r.id + ''))
    setRoles(merchantRoles)
    console.log('roles res: ', res)
  }

  const onSave = (r: TRole) => async () => {
    console.log('saving....: ', r)
    if (r.role == null || r.role.trim() == '') {
      message.error('Role name must not be empty')
      setErrLocalId(r.localId)
      return
    }
    if (roles.filter((role) => role.role.trim() == r.role.trim()).length > 1) {
      message.error(`Role name "${r.role}" already exist`)
      setErrLocalId(r.localId)
      return
    }
    if (
      r.permissions == null ||
      r.permissions.length == 0 ||
      r.permissions.every((p) => p.permissions.length == 0)
    ) {
      message.error('Each role must have at least one permission')
      setErrLocalId(r.localId)
      return
    }
    // return
    setErrLocalId('')
    const role = JSON.parse(JSON.stringify(r))
    delete role.createTime
    delete role.localId
    delete role.merchantId
    setLoading(true)
    const [res, err] = await saveRoleReq(role, r.id == null)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Role saved')
  }

  const onNewRole = () => {
    const newRole: TRole = {
      localId: ramdonString(8),
      role: '',
      permissions: []
    }
    setRoles(update(roles, { $push: [newRole] }))
  }

  const onDelete = async () => {}

  const onRoleNameChange =
    (localId: string): ChangeEventHandler<HTMLInputElement> =>
    (evt) => {
      const idx = roles.findIndex((r) => r.localId == localId)
      if (idx == -1) {
        return
      }
      setRoles(update(roles, { [idx]: { role: { $set: evt.target.value } } }))
    }

  const onPermChange =
    (localId: string, group: string) => (checked: boolean) => {
      console.log('localId/grp: ', localId, '//', group, '//', checked)
      const rowIdx = roles.findIndex((r) => r.localId == localId)
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
          newRoles = update(newRoles, {
            [rowIdx]: { permissions: { $set: [] } }
          })
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
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      fixed: 'left',
      width: 150,
      render: (_, record) => (
        <Input
          width={120}
          disabled={loading}
          value={record.role}
          onChange={onRoleNameChange(record.localId)}
          status={record.localId == errLocalId ? 'error' : ''}
        />
      )
    },
    ...PERMISSION_LIST.map((p) => ({
      title: p.label,
      dataIndex: 'permissions',
      key: p.group,
      render: (perm: any, record: TRole) => {
        const g =
          perm == null ? undefined : perm.find((pm: any) => pm.group == p.group)
        return (
          <Switch
            // size="small"
            disabled={loading}
            onChange={onPermChange(record.localId, p.group)}
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
              onClick={onNewRole}
              icon={<PlusOutlined />}
              disabled={loading}
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
              disabled={loading}
            />
          </Tooltip>
          <Tooltip title="Remove">
            <Button
              // onClick={refund}
              icon={<MinusOutlined />}
              style={{ border: 'unset' }}
              disabled={loading}
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
        rowKey={'localId'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        scroll={{ x: 1680 }}
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
