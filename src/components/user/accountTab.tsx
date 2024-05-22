import {
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Col, Divider, Empty, Popover, Row, Spin, message } from 'antd'
import React, { CSSProperties, ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSubByUserReq, getUserProfile } from '../../requests'
import { IProfile, ISubscriptionType } from '../../shared.types'
import UserAccountTab from '../subscription/userAccountTab'

const APP_PATH = import.meta.env.BASE_URL

const Index = ({
  userId,
  extraButton
}: {
  userId: number
  extraButton?: ReactElement
}) => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)

  const getUserDetail = async () => {
    setLoading(true)
    const [user, err] = await getUserProfile(userId, getUserDetail)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('get user detail res: ', user)
    setUserProfile(user)
  }

  useEffect(() => {
    getUserDetail()
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
        refresh={getUserDetail}
        setRefreshSub={() => {}} // this component is also used in SubscriptionTab which need refresh when user got suspended, but here, we don't need this fn.
        extraButton={extraButton}
      />
    </div>
  )
}

export default Index
