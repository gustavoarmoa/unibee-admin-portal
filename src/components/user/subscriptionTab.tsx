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
  message
} from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { CSSProperties, ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getSubByUserReq, getSubscriptionHistoryReq } from '../../requests'
import {
  IProfile,
  ISubHistoryItem,
  ISubscriptionType
} from '../../shared.types.d'
import { SubscriptionStatus } from '../ui/statusTag'
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

const Index = ({
  userId,
  extraButton
}: {
  userId: number
  extraButton?: ReactElement
}) => {
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
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
        record.plan == null ? 'N/A' : record.plan.planName
    },
    {
      title: 'Start',
      dataIndex: 'periodStart',
      key: 'periodStart',
      render: (d) =>
        d == 0 || d == null ? 'N/A' : dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: 'End',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d) =>
        d == 0 || d == null ? 'N/A' : dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status'
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
      render: (d, _) =>
        d === 0 ? 'N/A' : dayjs(d * 1000).format('YYYY-MMM-DD')
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
              <span
                style={{ cursor: 'pointer', marginLeft: '8px' }}
                onClick={getUserSub}
              >
                <SyncOutlined />
              </span>
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
                      {subInfo?.addons.map((a) => (
                        <Row key={a.id}>
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
        rowKey={'id'}
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
      <div className="mt-6 flex items-center justify-center">{extraButton}</div>
    </div>
  )
}

export default Index
