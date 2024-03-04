import { LoadingOutlined } from '@ant-design/icons'
import { Button, Spin, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUserProfile } from '../../requests'
import { IProfile } from '../../shared.types.d'
import UserAccountTab from '../subscription/userAccountTab'

const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)

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

  useEffect(() => {
    fetchUserProfile()
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
        extraButton={
          <Button onClick={() => navigate(`${APP_PATH}customer/list`)}>
            Go Back
          </Button>
        }
      />
    </div>
  )
}

export default Index
