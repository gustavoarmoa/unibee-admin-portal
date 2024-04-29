import {
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Col, Divider, Popover, Row, Spin, message } from 'antd'
import dayjs from 'dayjs'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SUBSCRIPTION_STATUS } from '../../constants'
import { showAmount } from '../../helpers'
import { getSubByUserReq, getUserProfile } from '../../requests'
import { IProfile, ISubscriptionType } from '../../shared.types.d'
import UserAccountTab from '../subscription/userAccountTab'

const APP_PATH = import.meta.env.BASE_URL
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

const Index = () => {
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)
  const [subInfo, setSubInfo] = useState<ISubscriptionType | null>(null) // null: when page is loading, or no active sub.

  const fetchData = async () => {}

  // getSubByUserReq will also return user profile info, so use that req to get both userInfo and subInfo
  const fetchUserProfile = async () => {
    const userId = Number(params.userId)
    if (isNaN(userId) || userId < 0) {
      message.error('User not found')
      return
    }
    setLoading(true)
    const [user, err] = await getUserProfile(userId, fetchUserProfile)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    setUserProfile(user)
  }

  const getUserSub = async () => {
    const userId = Number(params.userId)
    if (isNaN(userId) || userId < 0) {
      message.error('User not found')
      return
    }
    const [res, err] = await getSubByUserReq(userId)
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
    setSubInfo(subscription)
  }

  useEffect(() => {
    fetchUserProfile()
    getUserSub()
  }, [])

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Subscription
      </Divider>

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
          {subInfo && SUBSCRIPTION_STATUS[subInfo.status]}{' '}
          <span
            style={{ cursor: 'pointer', marginLeft: '8px' }}
            onClick={fetchData}
          >
            <SyncOutlined />
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>{subInfo?.subscriptionId}</Col>
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

          {subInfo && subInfo.addons && subInfo.addons.length > 0 && (
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
          {subInfo && subInfo.taxPercentage && subInfo.taxPercentage != 0 ? (
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
          {subInfo && subInfo.firstPaidTime && (
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

      <UserAccountTab
        user={userProfile}
        setUserProfile={setUserProfile}
        extraButton={
          <Button onClick={() => navigate(`${APP_PATH}user/list`)}>
            Go Back
          </Button>
        }
      />
    </div>
  )
}

export default Index
