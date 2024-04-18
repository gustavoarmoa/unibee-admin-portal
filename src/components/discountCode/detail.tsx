import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Spin,
  message
} from 'antd'
import { Dayjs } from 'dayjs'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CURRENCY, INVOICE_STATUS } from '../../constants'
import { showAmount } from '../../helpers'
import { createDiscountCodeReq, getInvoiceDetailReq } from '../../requests'
import {
  DiscountCode,
  IProfile,
  TInvoicePerm,
  UserInvoice
} from '../../shared.types.d'
import { useAppConfigStore, useMerchantInfoStore } from '../../stores'

const APP_PATH = import.meta.env.BASE_URL // if not specified in build command, default is /
const API_URL = import.meta.env.VITE_API_URL
const { RangePicker } = DatePicker

/*
id?: number
  merchantId: number
  name: string
  code: string
  status?: number
  billingType: number
  discountType: number
  discountAmount: number
  discountPercentage: number
  currency: string
  cycleLimit: numbe
  startTime: number
  endTime: number
  createTime?: number
  metadata?: {
    [key: string]: string
  }
*/
const NEW_CODE: DiscountCode = {
  merchantId: useMerchantInfoStore.getState().id,
  name: 'code name',
  code: 'code code',
  billingType: 1,
  discountType: 1,
  discountAmount: 0,
  discountPercentage: 0,
  currency: 'EUR',
  cycleLimit: 0,
  startTime: 0,
  endTime: 0,
  validityRange: [null, null]
}

const Index = () => {
  const params = useParams()
  const codeId = params.discountCodeId
  const isNew = codeId == null

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState<DiscountCode | null>(isNew ? NEW_CODE : null)
  const [form] = Form.useForm()
  const [showInvoiceItems, setShowInvoiceItems] = useState(false)
  const toggleInvoiceItems = () => setShowInvoiceItems(!showInvoiceItems)

  const watchDiscountType = Form.useWatch('discountType', form)
  const watchCurrency = Form.useWatch('currency', form)

  const goBack = () => navigate(`${APP_PATH}discount-code/list`)

  const fetchData = async () => {
    /*
    const pathName = window.location.pathname.split('/')
    const ivId = pathName.pop()
    if (ivId == null) {
      message.error('Invalid invoice')
      return
    }
    setLoading(true)
    const [res, err] = await getInvoiceDetailReq(ivId, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { invoice } = res
    normalizeAmt([invoice])
    setInvoiceDetail(invoice)
    */
  }

  const onSave = async () => {
    const body = form.getFieldsValue()
    console.log('form val: ', body)
    const code = JSON.parse(JSON.stringify(body))
    const r = form.getFieldValue('validityRange') as [Dayjs, Dayjs]
    code.startTime = r[0].unix()
    code.endTime = r[1].unix()
    code.cycleLimit = Number(code.cycleLimit)
    code.discountAmount = Number(code.discountAmount)
    code.discountPercentage = Number(code.discountPercentage)
    delete code.validityRange

    if (code.discountType == 1) {
      // percentage
      delete code.currency
      delete code.discountAmount
    } else {
      // fixed amount
      delete code.discountPercentage
    }

    console.log('sumbtting: ', code)
    // return
    setLoading(true)
    const [res, err] = await createDiscountCodeReq(code)
    setLoading(false)
    console.log('create code res: ', res)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Discount code created')
    goBack()
  }

  useEffect(() => {
    fetchData()
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
      {code && (
        <Form
          form={form}
          onFinish={onSave}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          layout="horizontal"
          // disabled={componentDisabled}
          // style={{ maxWidth: 1024 }}
          initialValues={code}
        >
          {!isNew && (
            <Form.Item label="ID" name="id" hidden>
              <Input disabled />
            </Form.Item>
          )}

          <Form.Item label="merchant Id" name="merchantId" hidden>
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Name"
            name="name"
            rules={[
              {
                required: true,
                message: 'Please input your discount code name!'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Code"
            name="code"
            rules={[
              {
                required: true,
                message: 'Please input your discount code!'
              }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Billing Type"
            name="billingType"
            rules={[
              {
                required: true,
                message: 'Please choose your billing type!'
              }
            ]}
          >
            <Select
              style={{ width: 180 }}
              options={[
                { value: 1, label: 'One time use' },
                { value: 2, label: 'Recurring' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Discount Type"
            name="discountType"
            rules={[
              {
                required: true,
                message: 'Please choose your discountType type!'
              }
            ]}
          >
            <Select
              style={{ width: 180 }}
              options={[
                { value: 1, label: 'Percentage' },
                { value: 2, label: 'Fixed amount' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Currency"
            name="currency"
            rules={[
              {
                required: watchDiscountType != 1,
                message: 'Please select your currency!'
              }
            ]}
          >
            <Select
              disabled={watchDiscountType == 1}
              style={{ width: 180 }}
              options={[
                { value: 'EUR', label: 'EUR' },
                { value: 'USD', label: 'USD' },
                { value: 'JPY', label: 'JPY' }
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Discount Amount"
            name="discountAmount"
            rules={[
              {
                required: watchDiscountType != 1, // 1: percentage
                message: 'Please choose your discount amount!'
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (watchDiscountType == 1) {
                    return Promise.resolve()
                  }
                  const num = Number(value)
                  if (isNaN(num) || num <= 0) {
                    return Promise.reject('Please input a valid amount (> 0).')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input
              style={{ width: 180 }}
              prefix={
                watchCurrency == null ? '' : CURRENCY[watchCurrency].symbol
              }
              disabled={watchDiscountType == 1}
            />
          </Form.Item>

          <Form.Item
            label="Discount percentage"
            name="discountPercentage"
            rules={[
              {
                required: watchDiscountType == 1,
                message: 'Please choose your discount percentage!'
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (watchDiscountType == 2) {
                    // 2: fixed amount
                    return Promise.resolve()
                  }
                  const num = Number(value)
                  if (isNaN(num) || num <= 0 || num >= 100) {
                    return Promise.reject(
                      'Please input a valid percentage number between 0 ~ 100.'
                    )
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input
              style={{ width: 180 }}
              disabled={watchDiscountType == 2}
              suffix="%"
            />
          </Form.Item>

          <Form.Item
            label="Cycle Limit"
            name="cycleLimit"
            rules={[
              {
                required: true,
                message: 'Please choose your cycleLimit!'
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  const num = Number(value)
                  if (isNaN(num) || num < 0 || num > 100) {
                    return Promise.reject(
                      'Please input a valid cycle limit number between 0 ~ 100.'
                    )
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input style={{ width: 180 }} />
          </Form.Item>
          <div
            className="relative ml-2 text-xs text-gray-500"
            style={{ top: '-40px', left: '360px' }}
          >
            How many billing cycles this discount code can be applied on a
            recurring subscription (0 means no-limit)
          </div>

          <Form.Item
            label="Validity Date Range"
            name="validityRange"
            rules={[
              {
                required: true,
                message: 'Please choose your validity range!'
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (value[0] == null || value[1] == null) {
                    return Promise.reject('Please select a valid date range.')
                  }
                  const d = new Date()
                  const sec = Math.round(d.getTime() / 1000)
                  if (value[0].unix() < sec) {
                    return Promise.reject(
                      'Start date must be greater than now.'
                    )
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <RangePicker />
          </Form.Item>
        </Form>
      )}
      <div className="flex justify-center gap-4">
        <Button onClick={goBack}>Go back</Button>
        <Button disabled={isNew}>Activate</Button>
        <Button onClick={form.submit} type="primary">
          Save
        </Button>
      </div>
    </div>
  )
}

export default Index
