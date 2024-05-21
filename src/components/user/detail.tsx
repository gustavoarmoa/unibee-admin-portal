import { Empty, Spin, Tabs, TabsProps, message } from 'antd'
import dayjs from 'dayjs'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSubByUserReq } from '../../requests'
import { IProfile, ISubscriptionType } from '../../shared.types'
import AccountInfoTab from './accountTab'
import SubscriptionTab from './subscriptionTab'

const APP_PATH = import.meta.env.BASE_URL
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

const Index = () => {
  const params = useParams()
  const userId = Number(params.userId)
  if (isNaN(userId)) {
    return (
      <Empty
        description="User not found"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)
  const [subInfo, setSubInfo] = useState<ISubscriptionType | null>(null) // null: when page is loading, or no active sub.
  const [assignSubModalOpen, setAssignSubModalOpen] = useState(false)
  const toggleAssignSub = () => setAssignSubModalOpen(!assignSubModalOpen)

  const tabItems: TabsProps['items'] = [
    {
      key: 'AccountInfo',
      label: 'Account Info',
      children: <AccountInfoTab userId={userId} />
    },
    {
      key: 'Subscription',
      label: 'Subsription',
      children: <SubscriptionTab userId={userId} />
    },
    {
      key: 'Invoices',
      label: 'Invoices',
      children: <div>invoice</div> // <InvoiceTab user={userProfile} />
    },
    {
      key: 'Transactions',
      label: 'Transactions',
      children: <div>transactions</div> // <PaymentTab user={userProfile} />
    }
  ]
  const onTabChange = (key: string) => {}

  const goToSubDetail = (subId: string) => () =>
    navigate(`/subscription/${subId}`)
  const goBack = () => navigate(`${APP_PATH}user/list`)

  const getUserSub = async () => {
    const userId = Number(params.userId)
    if (isNaN(userId) || userId < 0) {
      message.error('User not found')
      return
    }
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

  // useEffect(() => {}, [])

  return (
    <div>
      {/* <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      /> */}
      <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} />
    </div>
  )
}

export default Index
