import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Form,
  Input,
  Modal,
  Skeleton,
  Spin,
  Tabs,
  TabsProps,
  message
} from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { emailValidate, passwordSchema } from '../../helpers'
import {
  getMerchantInfoReq,
  logoutReq,
  resetPassReq,
  updateMerchantInfoReq,
  uploadLogoReq
} from '../../requests'
import { IProfile, TMerchantInfo } from '../../shared.types'
import {
  useAppConfigStore,
  useMerchantInfoStore,
  usePermissionStore,
  useProfileStore,
  useSessionStore
} from '../../stores'
import MerchantInfo from './merchantInfo'
import MyProfile from './profile'

const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const merchantInfoStore = useMerchantInfoStore()
  const profileStore = useProfileStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false) // page loading
  const [uploading, setUploading] = useState(false) // logo upload
  const [submitting, setSubmitting] = useState(false)
  const [resetPasswordModal, setResetPasswordModal] = useState(false)
  const togglePasswordModal = () => setResetPasswordModal(!resetPasswordModal)
  const [logoUrl, setLogoUrl] = useState('')
  const [merchantInfo, setMerchantInfo] = useState<TMerchantInfo | null>(null)

  const tabItems: TabsProps['items'] = [
    {
      key: 'merchantInfo',
      label: 'Merchant Info',
      children: <MerchantInfo />
    },
    {
      key: 'myInfo',
      label: 'My Info',
      children: <MyProfile />
    }
  ]

  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? 'merchantInfo'
  )

  const onTabChange = (key: string) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
  }

  return <Tabs activeKey={activeTab} items={tabItems} onChange={onTabChange} />
}

export default Index
