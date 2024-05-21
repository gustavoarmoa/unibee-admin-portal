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
  Popover,
  Row,
  Spin,
  Tabs,
  TabsProps,
  message
} from 'antd'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSubByUserReq } from '../../requests'
import { IProfile, ISubscriptionType } from '../../shared.types'
import UserAccountTab from '../subscription/userAccountTab'

const APP_PATH = import.meta.env.BASE_URL
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

const Index = ({ userId }: { userId: number }) => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)
  const [subInfo, setSubInfo] = useState<ISubscriptionType | null>(null) // null: when page is loading, or no active sub.

  const goToSubDetail = (subId: string) => () =>
    navigate(`/subscription/${subId}`)
  const goBack = () => navigate(`${APP_PATH}user/list`)

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

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />

      <UserAccountTab
        user={userProfile}
        setUserProfile={setUserProfile}
        refresh={getUserSub}
        setRefreshSub={() => {}} // this component is also used in SubscriptionTab which need refresh when user got suspended, but here, we don't need this fn.
        extraButton={<Button onClick={goBack}>Go Back</Button>}
      />
    </div>
  )
}

export default Index
