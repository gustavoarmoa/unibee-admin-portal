import {
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Divider,
  Empty,
  Pagination,
  Popover,
  Row,
  Spin,
  Tooltip,
  message
} from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { CSSProperties, ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import {
  getOneTimePaymentHistoryReq,
  getSubByUserReq,
  getSubscriptionHistoryReq
} from '../../requests'
import {
  IOneTimeHistoryItem,
  IProfile,
  ISubHistoryItem,
  ISubscriptionType
} from '../../shared.types.d'
import { PaymentStatus, SubscriptionStatus } from '../ui/statusTag'
import ModalAssignSub from './assignSubModal'

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }
//   extraButton?: ReactElement
const PAGE_SIZE = 10

const APP_PATH = import.meta.env.BASE_URL

const OneTimeHistory = ({ userId }: { userId: number }) => {
  const [loading, setLoading] = useState(false)
  const { page, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)
  const [onetimeHistory, setOneTimeHistory] = useState<IOneTimeHistoryItem[]>(
    []
  )
  const navigate = useNavigate()

  const getOneTimeHistory = async () => {
    setLoading(true)
    const [res, err] = await getOneTimePaymentHistoryReq({
      page,
      count: PAGE_SIZE,
      userId
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('onetime his res: ', res)
    const { paymentItems, total } = res
    setOneTimeHistory(paymentItems ?? [])
    setTotal(total)
  }

  const columns: ColumnsType<IOneTimeHistoryItem> = [
    {
      title: 'Item name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: 'created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => (d == 0 || d == null ? '―' : formatDate(d))
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => PaymentStatus(status)
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) =>
        ivId == '' || ivId == null ? (
          ''
        ) : (
          <div
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}invoice/${ivId}`)}
          >
            {ivId}
          </div>
        )
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 140,
      render: (subId) =>
        subId == '' || subId == null ? (
          ''
        ) : (
          <div
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}subscription/${subId}`)}
          >
            {subId}
          </div>
        )
    },
    {
      title: 'Payment Id',
      dataIndex: 'paymentId',
      key: 'paymentId'
    }
  ]

  useEffect(() => {
    getOneTimeHistory()
  }, [page])

  return (
    <>
      <Divider orientation="left" style={{ margin: '16px 0' }}>
        One-time Purchase History
      </Divider>
      <Table
        columns={columns}
        dataSource={onetimeHistory}
        rowKey={'uniqueId'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        // scroll={{ x: true, y: 640 }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {}
          }
        }}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
      />
      <div className="mt-6 flex justify-end">
        <Pagination
          style={{ marginTop: '16px' }}
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          size="small"
          onChange={onPageChangeNoParams}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </>
  )
}

const Index = ({
  userId,
  extraButton
}: {
  userId: number
  extraButton?: ReactElement
}) => {
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const { page, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)
  const [subInfo, setSubInfo] = useState<ISubscriptionType | null>(null) // null: when page is loading, or no active sub.
  const [subHistory, setSubHistory] = useState<ISubHistoryItem[]>([])

  const [assignSubModalOpen, setAssignSubModalOpen] = useState(false)
  const toggleAssignSub = () => setAssignSubModalOpen(!assignSubModalOpen)

  const columns: ColumnsType<ISubHistoryItem> = [
    {
      title: 'Item name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (plan, record) =>
        record.plan == null ? (
          '―'
        ) : (
          <div
            className=" w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}plan/${record.plan.id}`)}
          >
            {record.plan.planName}
          </div>
        )
    },
    {
      title: 'Start',
      dataIndex: 'periodStart',
      key: 'periodStart',
      render: (d) => (d == 0 || d == null ? '―' : formatDate(d))
    },
    {
      title: 'End',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d) => (d == 0 || d == null ? '―' : formatDate(d))
    },
    {
      title: 'Addons',
      dataIndex: 'addons',
      key: 'addons',
      render: (addons) =>
        addons == null ? (
          '―'
        ) : (
          <Popover
            placement="top"
            title="Addon breakdown"
            content={
              <div style={{ width: '280px' }}>
                {addons.map((a: any) => (
                  <Row key={a.id}>
                    <Col span={10} className=" font-bold text-gray-500">
                      {a.addonPlan.planName}
                    </Col>
                    <Col span={14}>
                      {showAmount(a.addonPlan.amount, a.addonPlan.currency)} ×{' '}
                      {a.quantity} ={' '}
                      {showAmount(
                        a.addonPlan.amount * a.quantity,
                        a.addonPlan.currency
                      )}
                    </Col>
                  </Row>
                ))}
              </div>
            }
          >
            <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
              {addons.length}
            </span>
          </Popover>
        )
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 140,
      render: (subId) =>
        subId == '' || subId == null ? (
          ''
        ) : (
          <div
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}subscription/${subId}`)}
          >
            {subId}
          </div>
        )
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, _) => (d === 0 ? 'N/A' : formatDate(d))
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 140,
      render: (invoiceId) =>
        invoiceId == '' || invoiceId == null ? (
          ''
        ) : (
          <div
            className=" w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
            onClick={() => navigate(`${APP_PATH}invoice/${invoiceId}`)}
          >
            {invoiceId}
          </div>
        )
      // render: (status, _) => UserStatus(status)
    }
  ]

  const getSubHistory = async () => {
    setHistoryLoading(true)
    const [res, err] = await getSubscriptionHistoryReq({
      page,
      count: PAGE_SIZE,
      userId
    })
    setHistoryLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('sub his res: ', res)
    const { subscriptionTimeLines, total } = res
    setSubHistory(subscriptionTimeLines ?? [])
    setTotal(total)
  }

  const goToSubDetail = (subId: string) => () =>
    navigate(`/subscription/${subId}`)

  const getUserSub = async () => {
    setLoading(true)
    const [res, err] = await getSubByUserReq(userId, getUserSub)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const {
      user,
      subscription,
      plan,
      gateway,
      addons,
      unfinishedSubscriptionPendingUpdate
    } = res
    console.log('sub info res: ', res)
    if (subscription != null) {
      subscription.plan = plan
    }
    setSubInfo(subscription)
    setUserProfile(user)
  }

  useEffect(() => {
    getUserSub()
  }, [])

  useEffect(() => {
    getSubHistory()
  }, [page])

  return (
    <div>
      {assignSubModalOpen && userProfile != null && (
        <ModalAssignSub
          user={userProfile}
          closeModal={toggleAssignSub}
          refresh={getUserSub}
        />
      )}
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />

      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Current Subscription
      </Divider>
      {loading ? null : subInfo == null ? (
        <Empty
          description="No Subscription"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <Row style={rowStyle}>
            <Col span={4} style={colStyle}>
              Plan
            </Col>
            <Col span={6}>{subInfo?.plan?.planName}</Col>
            <Col span={4} style={colStyle}>
              Plan Description
            </Col>
            <Col span={6}>{subInfo?.plan?.description}</Col>
          </Row>
          <Row style={rowStyle}>
            <Col span={4} style={colStyle}>
              Status
            </Col>
            <Col span={6}>
              {SubscriptionStatus(subInfo.status)}
              <Tooltip title="Refresh">
                <span
                  style={{ cursor: 'pointer', marginLeft: '8px' }}
                  onClick={getUserSub}
                >
                  <SyncOutlined />
                </span>
              </Tooltip>
            </Col>
            <Col span={4} style={colStyle}>
              Subscription Id
            </Col>
            <Col span={6}>
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={goToSubDetail(subInfo?.subscriptionId)}
              >
                {subInfo?.subscriptionId}
              </Button>
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col span={4} style={colStyle}>
              Plan Price
            </Col>
            <Col span={6}>
              {subInfo?.plan?.amount &&
                showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
            </Col>
            <Col span={4} style={colStyle}>
              Addons Price
            </Col>
            <Col span={6}>
              {subInfo &&
                subInfo.addons &&
                showAmount(
                  subInfo!.addons!.reduce(
                    (
                      sum,
                      { quantity, amount }: { quantity: number; amount: number }
                    ) => sum + quantity * amount,
                    0
                  ),
                  subInfo!.currency
                )}

              {subInfo.addons && subInfo.addons.length > 0 && (
                <Popover
                  placement="top"
                  title="Addon breakdown"
                  content={
                    <div style={{ width: '280px' }}>
                      {subInfo?.addons.map((a, idx) => (
                        <Row key={idx}>
                          <Col span={10}>{a.planName}</Col>
                          <Col span={14}>
                            {showAmount(a.amount, a.currency)} × {a.quantity} ={' '}
                            {showAmount(a.amount * a.quantity, a.currency)}
                          </Col>
                        </Row>
                      ))}
                    </div>
                  }
                >
                  <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                    <InfoCircleOutlined />
                  </span>
                </Popover>
              )}
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col span={4} style={colStyle}>
              Total Amount
            </Col>
            <Col span={6}>
              {subInfo?.amount && showAmount(subInfo.amount, subInfo.currency)}
              {subInfo &&
              subInfo.taxPercentage &&
              subInfo.taxPercentage != 0 ? (
                <span className="text-xs text-gray-500">
                  {` (${subInfo.taxPercentage / 100}% tax incl)`}
                </span>
              ) : null}
            </Col>

            <Col span={4} style={colStyle}>
              Bill Period
            </Col>
            <Col span={6}>
              {subInfo != null && subInfo.plan != null
                ? `${subInfo.plan.intervalCount} ${subInfo.plan.intervalUnit}`
                : ''}
            </Col>
          </Row>
          <Row style={rowStyle}>
            <Col span={4} style={colStyle}>
              First pay
            </Col>
            <Col span={6}>
              {subInfo && (
                <span>
                  {subInfo.firstPaidTime == 0 || subInfo.firstPaidTime == null
                    ? 'N/A'
                    : dayjs(new Date(subInfo.firstPaidTime * 1000)).format(
                        'YYYY-MMM-DD'
                      )}
                </span>
              )}
            </Col>
            <Col span={4} style={colStyle}>
              Next due date
            </Col>
            <Col span={10}></Col>
          </Row>
        </>
      )}

      <Button
        onClick={toggleAssignSub}
        disabled={
          subInfo != null || userProfile == null || userProfile?.status == 2
        } // user has active sub || user not exist || user is suspended
        className=" my-4"
      >
        Assign Subscription
      </Button>

      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Subscription and Add-on History
      </Divider>
      <Table
        columns={columns}
        dataSource={subHistory}
        rowKey={'uniqueId'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        // scroll={{ x: true, y: 640 }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {}
          }
        }}
        loading={{
          spinning: historyLoading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
      />
      <div className="mt-6 flex justify-end">
        <Pagination
          style={{ marginTop: '16px' }}
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
          size="small"
          onChange={onPageChangeNoParams}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>

      <OneTimeHistory userId={userId} />
      <div className="mt-6 flex items-center justify-center">{extraButton}</div>
    </div>
  )
}

export default Index
