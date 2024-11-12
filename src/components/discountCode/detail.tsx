import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Spin,
  message
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CURRENCY } from '../../constants'
import {
  currencyDecimalValidate,
  showAmount,
  toFixedNumber
} from '../../helpers'
import {
  createDiscountCodeReq,
  deleteDiscountCodeReq,
  getDiscountCodeDetailWithMore,
  getPlanList,
  toggleDiscountCodeActivateReq,
  updateDiscountCodeReq
} from '../../requests'
import { DiscountCode, IPlan } from '../../shared.types'
import { useMerchantInfoStore } from '../../stores'
import { isEmpty } from '../../utils'
import { getDiscountCodeStatusTagById } from '../ui/statusTag'
import { formatQuantity } from './helpers'
import { UpdateDiscountCodeQuantityModal } from './updateDiscountCodeQuantityModal'

const { RangePicker } = DatePicker

enum DiscountCodeStatus {
  EDITING = 1,
  ACTIVE,
  DEACTIVATE,
  EXPIRED
}

const DEFAULT_CODE: DiscountCode = {
  merchantId: useMerchantInfoStore.getState().id,
  name: '',
  code: '',
  billingType: 1,
  discountType: 1,
  discountAmount: 0,
  discountPercentage: 0,
  currency: 'EUR',
  cycleLimit: 1,
  startTime: 0,
  endTime: 0,
  validityRange: [null, null],
  planIds: [],
  quantity: 0
}

const CAN_EDIT_ITEM_STATUSES = [
  DiscountCodeStatus.EDITING,
  DiscountCodeStatus.ACTIVE,
  DiscountCodeStatus.DEACTIVATE
]

const canActiveItemEdit = (status?: DiscountCodeStatus) =>
  status ? CAN_EDIT_ITEM_STATUSES.includes(status) : true

const Index = () => {
  const params = useParams()
  const codeId = params.discountCodeId
  const isNew = isEmpty(codeId)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState<DiscountCode | null>(
    isNew ? DEFAULT_CODE : null
  )
  const [planList, setPlanList] = useState<IPlan[]>([])
  const planListRef = useRef<IPlan[]>([])
  const [
    isOpenUpdateDiscountCodeQuantityModal,
    setIsOpenUpdateDiscountCodeQuantityModal
  ] = useState(false)
  const [form] = Form.useForm()

  const watchDiscountType = Form.useWatch('discountType', form)
  const watchBillingType = Form.useWatch('billingType', form)
  const watchCurrency = Form.useWatch('currency', form)
  const watchPlanIds = Form.useWatch('planIds', form)

  const RENDERED_QUANTITY_ITEMS_MAP: Record<number, ReactNode> = useMemo(
    () => ({
      [DiscountCodeStatus.ACTIVE]: (
        <div>
          <span className="mr-2">{formatQuantity(code?.quantity ?? 0)}</span>
          <Button
            disabled={!code?.id}
            onClick={() => setIsOpenUpdateDiscountCodeQuantityModal(true)}
          >
            Update
          </Button>
        </div>
      ),
      [DiscountCodeStatus.EXPIRED]: (
        <InputNumber
          style={{ width: 180 }}
          defaultValue={code?.quantity}
          disabled
        />
      )
    }),
    [code?.quantity, code?.id]
  )

  const renderedQuantityItems = useMemo(
    () =>
      RENDERED_QUANTITY_ITEMS_MAP[code?.status ?? -1] ?? (
        <InputNumber
          min="0"
          style={{ width: 180 }}
          defaultValue={code?.quantity.toString()}
        />
      ),
    [code?.status, code?.quantity]
  )

  const goBack = () => navigate(`/discount-code/list`)
  const goToUsageDetail = () =>
    navigate(`/discount-code/${codeId}/usage-detail`)

  // for editing code, need to fetch code detail and planList
  const fetchData = async () => {
    const pathName = window.location.pathname.split('/')
    const codeId = pathName.pop()
    const codeNum = Number(codeId)
    if (codeId == null || isNaN(codeNum)) {
      message.error('Invalid discount code')
      return
    }
    setLoading(true)
    const [res, err] = await getDiscountCodeDetailWithMore(codeNum, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { discount, planList } = res

    // if discount.currency is EUR, and discountType == 2(fixed amt), then filter the planList to contain only euro plans
    let plans =
      planList.plans == null ? [] : planList.plans.map((p: IPlan) => p.plan)
    if (discount.discountType == 2) {
      // fixed amt
      plans = plans.filter((p: IPlan) => p.currency == discount.currency)
    }
    setPlanList(plans)
    planListRef.current =
      planList.plans == null ? [] : planList.plans.map((p: IPlan) => p.plan)

    discount.validityRange = [
      dayjs(discount.startTime * 1000),
      dayjs(discount.endTime * 1000)
    ]
    if (discount.discountType == 2) {
      // fixed amount
      discount.discountAmount /= CURRENCY[discount.currency].stripe_factor
    } else if (discount.discountType == 1) {
      // percentage
      discount.discountPercentage /= 100
    }
    setCode(discount)
  }

  // for creating new code, there is no codeDetail to fetch.
  const fetchPlans = async () => {
    setLoading(true)
    const [res, err] = await getPlanList(
      {
        type: [1], // main plan
        status: [2], // active
        page: 0,
        count: 200
      },
      fetchPlans
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { plans } = res
    // if NEW_CODE.currency is EUR, and discountType == 2(fixed amt), then filter the planList to contain only euro plans
    let planList = plans == null ? [] : plans.map((p: IPlan) => p.plan)
    if (DEFAULT_CODE.discountType == 2) {
      // fixed amt
      planList = planList.filter(
        (p: IPlan) => p.currency == DEFAULT_CODE.currency
      )
    }
    setPlanList(planList)
    planListRef.current = plans == null ? [] : plans.map((p: IPlan) => p.plan)
  }

  const onSave = async () => {
    const body = form.getFieldsValue()
    const code = JSON.parse(JSON.stringify(body))
    const r = form.getFieldValue('validityRange') as [Dayjs, Dayjs]
    code.startTime = r[0].unix()
    code.endTime = r[1].unix()
    code.cycleLimit = Number(code.cycleLimit)
    code.discountAmount = Number(code.discountAmount)
    code.discountPercentage = Number(code.discountPercentage) * 100
    delete code.validityRange

    if (code.discountType == 1) {
      // percentage
      delete code.currency
      delete code.discountAmount
    } else {
      // fixed amount
      delete code.discountPercentage
      code.discountAmount *= CURRENCY[code.currency].stripe_factor
      code.discountAmount = toFixedNumber(code.discountAmount, 2)
    }

    const method = isNew ? createDiscountCodeReq : updateDiscountCodeReq

    setLoading(true)

    const [data, err] = await method(code)

    setLoading(false)

    if (err) {
      message.error(err.message)
      return
    }

    message.success(`Discount code ${isNew ? 'created' : 'updated'}`)

    if (isNew) {
      navigate(`/discount-code/${data.discount.id}`)
      return
    }

    goBack()
  }

  const onDelete = async () => {
    if (code == null || code.id == null) {
      return
    }
    setLoading(true)
    const [_, err] = await deleteDiscountCodeReq(code.id)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Discount code (${code.code}) deleted`)
    goBack()
  }

  const toggleActivate = async () => {
    if (code == null || code.id == null) {
      return
    }

    const action =
      code.status == DiscountCodeStatus.EDITING ||
      code.status == DiscountCodeStatus.DEACTIVATE
        ? 'activate'
        : code.status == DiscountCodeStatus.ACTIVE
          ? 'deactivate'
          : ''

    if (action == '') {
      return
    }
    setLoading(true)
    const [_, err] = await toggleDiscountCodeActivateReq(code.id, action)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Discount code (${code.code}) ${action}d`)
    goBack()
  }

  const formEditable = useMemo(
    () => isNew || code?.status === DiscountCodeStatus.EDITING,
    [code?.status]
  )

  const isAllFormItemsDisabled = code?.status === DiscountCodeStatus.EXPIRED

  const getPlanLabel = (planId: number) => {
    const p = planListRef.current.find((p) => p.id == planId)
    if (null == p) {
      return ''
    }
    return `${p.planName} (${showAmount(p.amount, p.currency)}/${p.intervalCount == 1 ? '' : p.intervalCount}${p.intervalUnit})`
  }

  useEffect(() => {
    if (isNew) {
      fetchPlans()
    } else {
      fetchData()
    }
  }, [isNew])

  useEffect(() => {
    if (watchBillingType == 1) {
      //  one-time use: you can only use this code once, aka: cycleLimit is always 1
      form.setFieldValue('cycleLimit', 1)
    }
  }, [watchBillingType])

  useEffect(() => {
    if (watchDiscountType == 2) {
      // fixed amt
      setPlanList(
        planListRef.current.filter((p) => p.currency == watchCurrency)
      )
    }
  }, [watchDiscountType, watchCurrency])

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      {code?.id && (
        <UpdateDiscountCodeQuantityModal
          discountId={code?.id}
          close={() => setIsOpenUpdateDiscountCodeQuantityModal(false)}
          onSuccess={(delta) => (code.quantity += delta)}
          open={isOpenUpdateDiscountCodeQuantityModal}
        />
      )}
      {code && (
        <Form
          form={form}
          onFinish={onSave}
          labelCol={{ flex: '180px' }}
          wrapperCol={{ flex: 1 }}
          colon={false}
          initialValues={code}
          disabled={!formEditable}
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
            <Input disabled={!isNew} />
          </Form.Item>
          {!isNew && (
            <Form.Item label="Status">
              {getDiscountCodeStatusTagById(code.status as number)}
            </Form.Item>
          )}
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
            label="Quantity"
            name="quantity"
            rules={[
              {
                required: true,
                message: 'Please input valid quantity'
              }
            ]}
            extra={'If quantity is 0, it means the quantity is unlimited.'}
          >
            {renderedQuantityItems}
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
              disabled={watchDiscountType == 1 || !formEditable}
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
            dependencies={['currency']}
            rules={[
              {
                required: watchDiscountType != 1, // 1: percentage, 2: fixed-amt
                message: 'Please choose your discount amount!'
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (watchDiscountType == 1) {
                    return Promise.resolve()
                  }
                  const num = Number(value)
                  if (isNaN(num) || num <= 0) {
                    return Promise.reject('Please input a valid amount (> 0).')
                  }
                  if (
                    !currencyDecimalValidate(num, getFieldValue('currency'))
                  ) {
                    return Promise.reject('Please input a valid amount')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input
              style={{ width: 180 }}
              prefix={
                watchCurrency == null || watchCurrency == ''
                  ? ''
                  : CURRENCY[watchCurrency].symbol
              }
              disabled={watchDiscountType == 1 || !formEditable}
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
              () => ({
                validator(_, value) {
                  if (watchDiscountType == 2) {
                    // 2: fixed amount
                    return Promise.resolve()
                  }
                  const num = Number(value)
                  if (isNaN(num) || num <= 0 || num > 100) {
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
              disabled={watchDiscountType == 2 || !formEditable}
              suffix="%"
            />
          </Form.Item>

          <Form.Item
            label="Cycle Limit"
            extra="How many billing cycles this discount code can be applied on a
              recurring subscription (0 means no-limit)."
          >
            <Form.Item
              noStyle
              name="cycleLimit"
              rules={[
                {
                  required: watchBillingType != 1,
                  message: 'Please input your cycleLimit!'
                },
                () => ({
                  validator(_, value) {
                    const num = Number(value)
                    if (!Number.isInteger(num)) {
                      return Promise.reject(
                        'Please input a valid cycle limit number between 0 ~ 1000.'
                      )
                    }
                    if (isNaN(num) || num < 0 || num > 999) {
                      return Promise.reject(
                        'Please input a valid cycle limit number between 0 ~ 1000.'
                      )
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <Input
                style={{ width: 180 }}
                disabled={watchBillingType == 1 || !formEditable}
              />
              {/* 1: one-time use */}
            </Form.Item>
          </Form.Item>

          <Form.Item
            label="Code Apply Date Range"
            name="validityRange"
            rules={[
              {
                required: true,
                message: 'Please choose your validity range!'
              },
              () => ({
                validator(_, value) {
                  if (value[0] == null || value[1] == null) {
                    return Promise.reject('Please select a valid date range.')
                  }
                  const d = new Date()
                  const sec = Math.round(d.getTime() / 1000)
                  if (value[1].unix() < sec) {
                    return Promise.reject('End date must be greater than now.')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <RangePicker showTime disabled={!canActiveItemEdit(code?.status)} />
          </Form.Item>

          <Form.Item
            label="Apply to which plans"
            name="planIds"
            rules={[
              {
                required: watchPlanIds != null && watchPlanIds.length > 0
              },
              () => ({
                validator(_, plans) {
                  if (plans == null || plans.length == 0) {
                    return Promise.resolve()
                  }
                  for (let i = 0; i < plans.length; i++) {
                    if (planList.findIndex((p) => p.id == plans[i]) == -1) {
                      return Promise.reject(
                        `${getPlanLabel(plans[i])} doesn't exist in plan list, please remove it.`
                      )
                    }
                  }
                  return Promise.resolve()
                }
              })
            ]}
            extra="If no plan is selected, the discount code will be applied to all plans."
          >
            <Select
              mode="multiple"
              disabled={!canActiveItemEdit(code?.status)}
              allowClear
              style={{ width: '100%' }}
              options={planList.map((p) => ({
                label: getPlanLabel(p.id),
                value: p.id
              }))}
            />
          </Form.Item>
        </Form>
      )}
      <div className="flex justify-between">
        <Popconfirm
          title="Deletion Confirm"
          description="Are you sure to delete this discount code?"
          onConfirm={onDelete}
          showCancel={false}
          okText="Yes"
        >
          <Button
            danger
            disabled={isNew || (code != null && code.status != 1)} // 1: editing
          >
            Delete
          </Button>
        </Popconfirm>

        <div className="flex justify-center gap-4">
          <Button onClick={goBack}>Go back</Button>
          {!isNew && (
            <Button onClick={goToUsageDetail} disabled={code?.status == 1}>
              View usage detail
            </Button>
          )}
          {code != null &&
            (code.status == 1 || code.status == 2 || code.status == 3) && (
              <Button onClick={toggleActivate}>
                {code.status == 1
                  ? 'Activate'
                  : code.status == 2
                    ? 'Deactivate'
                    : 'Activate'}
              </Button>
            )}

          {!isAllFormItemsDisabled && (
            <Button onClick={form.submit} type="primary">
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Index
