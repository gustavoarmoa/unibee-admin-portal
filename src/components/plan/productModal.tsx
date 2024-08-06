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
  saveProductReq,
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

  console.log('product modal isnew: ', isNew)

  const onSave = async () => {
    const body = form.getFieldsValue()
    console.log('form body: ', body)
    body.productId = body.id
    // return
    setLoading(true)
    const [res, err] = await saveProductReq(body)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    console.log('saving product res: ', res.product)
    refresh(res.product)
    message.success('Product saved')
    closeModal()
  }

  return (
    <Modal
      title="Product detail"
      open={true}
      width={'720px'}
      footer={null}
      closeIcon={null}
    >
      <div>
        <Form
          form={form}
          onFinish={onSave}
          labelCol={{ flex: '186px' }}
          wrapperCol={{ flex: 1 }}
          colon={false}
          // disabled={formDisabled}
          initialValues={isNew ? {} : detail}
        >
          {!isNew && (
            <Form.Item label="ID" name="id">
              <Input disabled />
            </Form.Item>
          )}

          <Form.Item
            label="Name"
            name="productName"
            rules={[
              {
                required: true,
                message: 'Please input your product name!'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              {
                required: true,
                message: 'Please input your product description!'
              }
            ]}
          >
            <TextArea />
          </Form.Item>
        </Form>
        <div
          className="flex items-center justify-end gap-4"
          style={{
            marginTop: '24px'
          }}
        >
          <Button onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={form.submit}
            loading={loading}
            disabled={loading}
          >
            OK
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Index
