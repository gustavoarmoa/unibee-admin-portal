import { Button, Divider, Empty, Spin, Tabs, TabsProps, message } from 'antd'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getUserProfile } from '../../requests'
import { IProfile } from '../../shared.types'
import UserInfo from '../shared/userInfo'
import InvoiceTab from '../subscription/invoicesTab'
import TransactionTab from '../subscription/paymentTab'
import AccountInfoTab from './accountTab'
import SubscriptionTab from './subscriptionTab'

const APP_PATH = import.meta.env.BASE_URL

const GoBackBtn = () => {
  const navigate = useNavigate()
  const goBack = () => navigate(`${APP_PATH}user/list`)
  return <Button onClick={goBack}>Go back</Button>
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? 'account'
  )
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
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)

  const tabItems: TabsProps['items'] = [
    {
      key: 'account',
      label: 'Account Info',
      children: <AccountInfoTab userId={userId} extraButton={<GoBackBtn />} />
    },
    {
      key: 'subscription',
      label: 'Subscription',
      children: <SubscriptionTab userId={userId} extraButton={<GoBackBtn />} />
    },
    {
      key: 'invoice',
      label: 'Invoice',
      children: <InvoiceTab user={userProfile} extraButton={<GoBackBtn />} /> // <InvoiceTab user={userProfile} />
    },
    {
      key: 'transaction',
      label: 'Transaction',
      children: (
        <TransactionTab user={userProfile} extraButton={<GoBackBtn />} />
      )
    }
  ]
  const onTabChange = (key: string) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
  }

  const fetchUserProfile = async () => {
    const [user, err] = await getUserProfile(userId as number, fetchUserProfile)
    if (err != null) {
      message.error(err.message)
      return
    }
    setUserProfile(user)
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  return (
    <div>
      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Brief Info
      </Divider>
      <UserInfo user={userProfile} />
      <Tabs activeKey={activeTab} items={tabItems} onChange={onTabChange} />
    </div>
  )
}

export default Index
