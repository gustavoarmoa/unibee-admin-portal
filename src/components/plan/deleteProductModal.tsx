import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Switch
} from 'antd'
import TextArea from 'antd/es/input/TextArea'
import update from 'immutability-helper'
import React, { useEffect, useState } from 'react'
import HiddenIcon from '../../assets/hidden.svg?react'
import {
  createSubscriptionReq,
  getPlanList,
  TPlanListBody
} from '../../requests'
import { IPlan, IProduct, IProfile } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'
import Plan from '../subscription/plan'
import PaymentMethodSelector from '../ui/paymentSelector'

interface Props {
  refresh: (p: IProduct) => void
  closeModal: () => void
  isNew: boolean
  detail: IProduct | undefined // if not passed, we are creating new product. if passed, we are editing this product
}

const Index = ({ closeModal, isNew, refresh, detail }: Props) => {
  const [form] = Form.useForm()
  const appConfig = useAppConfigStore()
  const [loading, setLoading] = useState(false)

  const fetchProduct = async () => {}

  return (
    <Modal
      title="Product detail"
      open={true}
      width={'720px'}
      footer={null}
      closeIcon={null}
    >
      <div></div>
    </Modal>
  )
}

export default Index
