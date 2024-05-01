import {
  CheckCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Spin,
  Switch,
  Tag,
  message
} from 'antd'
import update from 'immutability-helper'
import React, { ReactElement, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CURRENCY, PLAN_STATUS } from '../../constants'
import {
  currencyDecimalValidate,
  ramdonString,
  toFixedNumber
} from '../../helpers'
import {
  activatePlan,
  getPlanDetailWithMore,
  savePlan,
  togglePublishReq
} from '../../requests'
import { IBillableMetrics, IPlan } from '../../shared.types.d'

const APP_PATH = import.meta.env.BASE_URL
const getAmount = (amt: number, currency: string) =>
  amt / CURRENCY[currency].stripe_factor

type TMetaValueType = 'string' | 'boolean' | 'number'
type TMetricsItem = {
  localId: string
  metricId?: number
  metricLimit?: number | string
}
type TNewPlan = {
  // why can't I use IPlan??????????
  currency: string
  intervalUnit: string
  intervalCount: number
  status: number
  publishStatus: number
  type: number // 1: main, 2: add-on
  imageUrl: string
  homeUrl: string
  addonIds: number[]
  onetimeAddonIds?: number[]
  metricLimits: TMetricsItem[]
  metadata?: {
    property: string
    value: string
    valueType: TMetaValueType
  }[]
  enableTrial?: boolean
  trialAmount?: number
  trialDurationTime?: number
  trialDemand?: 'paymentMethod' | '' | boolean // backend requires this field to be a fixed string of 'paymentMethod' or '', but to ease the UI, front-end use <Switch />
  cancelAtTrialEnd?: 0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UI, front-end use <Switch />
}
const NEW_PLAN: TNewPlan = {
  currency: 'EUR',
  intervalUnit: 'month',
  intervalCount: 1,
  status: 1, // 1: editing，2: active, 3: inactive，4: expired
  publishStatus: 1, //  // 1: unpublished(not visible to users), 2: published(users could see and choose this plan)
  type: 1, // 1: main, 2: add-on, 3: one-time pyment addon
  imageUrl: 'http://www.google.com',
  homeUrl: 'http://www.google.com',
  addonIds: [],
  metricLimits: [],
  metadata: [
    /*
    { property: 'trafficUnit', value: 'Byte', valueType: 'string' },
    { property: 'trafficAmount', value: '1024', valueType: 'number' },
    { property: 'suspended', value: 'true', valueType: 'boolean' }
    */
  ],
  enableTrial: false,
  trialAmount: 0,
  trialDurationTime: 0,
  trialDemand: true, // backend requires this field to be a fixed string of 'paymentMethod' or '', but to ease the UI, front-end use <Switch />
  cancelAtTrialEnd: true
}

const array2obj = (
  arr: {
    property: string
    value: string
    valueType: TMetaValueType
  }[]
) => {
  if (null == arr) {
    return {}
  }
  const obj: { [key: string]: string | number | boolean } = {}
  arr.forEach((a) => {
    switch (a.valueType) {
      case 'number':
        obj[a.property] = Number(a.value)
        break
      case 'boolean':
        obj[a.property] =
          a.value == '1' || a.value.toLowerCase() == 'true' ? true : false
        break
      case 'string':
        obj[a.property] = a.value
        break
    }
  })
  return obj
}

const obj2array = (obj: { [key: string]: string | number | boolean }) => {
  if (null == obj) {
    return []
  }
  const arr: { property: string; value: string; valueType: string }[] = []
  for (const prop in obj) {
    arr.push({
      property: prop,
      value: obj[prop] + '',
      valueType: typeof obj[prop]
    })
  }
  return arr
}

const TIME_UNITS = [
  // in seconds
  { label: 'hours', value: 60 * 60 },
  { label: 'days', value: 60 * 60 * 24 },
  { label: 'weeks', value: 60 * 60 * 24 * 7 },
  { label: 'months(30days)', value: 60 * 60 * 24 * 30 }
]
const secondsToUnit = (sec: number) => {
  const units = [...TIME_UNITS].sort((a, b) => b.value - a.value)
  for (let i = 0; i < units.length; i++) {
    if (sec % units[i].value === 0) {
      return [sec / units[i].value, units[i].value] // if sec is 60 * 60 * 24 * 30 * 3, then return [3, 60 * 60 * 24 * 30 * 3]
    }
  }
  throw Error('Invalid time unit')
}

const unitToSeconds = (value: number, unit: number) => {
  return value * unit
}

const STATUS: { [key: number]: ReactElement } = {
  1: <Tag color="blue">{PLAN_STATUS[1]}</Tag>,
  2: <Tag color="#87d068">{PLAN_STATUS[2]}</Tag>,
  3: <Tag color="purple">{PLAN_STATUS[3]}</Tag>,
  4: <Tag color="red">{PLAN_STATUS[4]}</Tag>
}

const { Option } = Select

// this component has the similar structure with newPlan.tsx, try to refactor them into one.
const Index = () => {
  const params = useParams()
  const planId = params.planId
  const isNew = planId == null

  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [publishing, setPublishing] = useState(false) // when toggling publish/unpublish
  const [plan, setPlan] = useState<IPlan | TNewPlan | null>(
    isNew ? NEW_PLAN : null
  ) // plan obj is used for Form's initialValue, any changes is handled by Form itself, not updated here.
  const [addons, setAddons] = useState<IPlan[]>([]) // all the active addons we have (addon has the same structure as Plan).
  const [selectAddons, setSelectAddons] = useState<IPlan[]>([]) // addon list in <Select /> for the current main plan, this list will change based on different plan props(interval count/unit/currency)
  const [selectOnetime, setSelectOnetime] = useState<IPlan[]>([]) // one-time payment addon list in <Select /> for the current main plan, this list will change based on different plan props(interval count/unit/currency)
  // one plan can have many regular addons, but only ONE one-time payment addon, but backend support multiple.
  const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([]) // all the billable metrics, not used for edit, but used in <Select /> for user to choose.
  const [selectedMetrics, setSelectedMetrics] = useState<TMetricsItem[]>([
    { localId: ramdonString(8) }
  ])
  const [trialLengthUnit, setTrialLengthUnit] = useState(
    TIME_UNITS.find((u) => u.label == 'days')?.value
  ) // default unit is days
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const itvCountValue = Form.useWatch('intervalCount', form)
  const itvCountUnit = Form.useWatch('intervalUnit', form)
  const addonCurrency = Form.useWatch('currency', form)
  const planTypeWatch = Form.useWatch('type', form)
  const enableTrialWatch = Form.useWatch('enableTrial', form)

  const onTrialLengthUnitChange = (val: number) => setTrialLengthUnit(val)

  const selectAfter = (
    <Select
      value={trialLengthUnit}
      style={{ width: 150 }}
      onChange={onTrialLengthUnitChange}
      disabled={!enableTrialWatch}
    >
      {TIME_UNITS.map((u) => (
        <Option key={u.label} value={u.value}>
          {u.label}
        </Option>
      ))}
    </Select>
  )

  let addMetadata: (
    defaultValue?: any,
    insertIndex?: number | undefined
  ) => void

  useEffect(() => {
    if (!isNew && plan?.status != 1) {
      // 1: editing, 2: active
      return
    }
    if (!isNew && plan?.type == 2) {
      // 1: main plan, 2: addon, 3: one-time payment
      return
    }
    // main plan's currency/intervalUnit-Count must match its addons currency/*** */
    const newAddons = addons.filter(
      (a) =>
        a.intervalCount == itvCountValue &&
        a.intervalUnit == itvCountUnit &&
        a.currency == addonCurrency
    )
    setSelectAddons(newAddons)
    // when editing addon, don't do anything in this effect.
    // once changed, I'm gonna clear the selected addons,
  }, [itvCountUnit, itvCountValue, addonCurrency])

  const onSave = async (values: any) => {
    const f = JSON.parse(JSON.stringify(values))
    f.amount = Number(f.amount)
    f.amount *= CURRENCY[f.currency].stripe_factor
    f.amount = toFixedNumber(f.amount, 2)
    f.intervalCount = Number(f.intervalCount)

    /*
      enableTrial?: boolean
  trialAmount?: number
  trialDurationTime?: number
  trialDemand?: 'paymentMethod' | '' | boolean // backend requires this field to be a fixed string of 'paymentMethod' or '', but to ease the UX, front-end use <Switch />
  cancelAtTrialEnd?: 0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UX, front-end use <Switch />

    */
    if (!f.enableTrial) {
      delete f.trialAmount
      delete f.trialDurationTime
      delete f.trialDemand
      delete f.cancelAtTrialEnd
      delete f.enableTrial
    } else {
      f.trialAmount = Number(f.trialAmount)
      f.trialAmount *= CURRENCY[f.currency].stripe_factor
      f.trialAmount = toFixedNumber(f.trialAmount, 2)
      f.trialDurationTime = Number(f.trialDurationTime)
      f.trialDurationTime = unitToSeconds(
        f.trialDurationTime,
        trialLengthUnit as number
      )
      f.trialDemand = f.trialDemand ? 'paymentMethod' : ''
      f.cancelAtTrialEnd = f.cancelAtTrialEnd ? 1 : 0
    }
    delete f.enableTrial

    console.log('is new: ', isNew)
    if (!isNew) {
      f.planId = f.id
      delete f.id
      delete f.status
      delete f.publishStatus
      delete f.type // once plan created, you cannot change its type(main plan, addon)
    }
    if (planTypeWatch == 3) {
      // one-time payment plans don't have these props
      delete f.intervalCount
      delete f.intervalUnit
      delete f.metricLimits
      delete f.onetimeAddonIds
    }

    let m = JSON.parse(JSON.stringify(selectedMetrics)) // selectedMetrics.map(metric => ({metricLimit: Number(metric.metricLimit)}))
    m = m.map((metrics: any) => ({
      metricId: metrics.metricId,
      metricLimit: Number(metrics.metricLimit)
    }))
    m = m.filter((metric: any) => !isNaN(metric.metricLimit))
    f.metricLimits = m

    f.metadata = array2obj(f.metadata)
    console.log('saving...: ', f)

    // return

    setLoading(true)
    const [_, err] = await savePlan(f, isNew)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Plan ${isNew ? 'created' : 'saved'}`)
    setTimeout(() => {
      navigate(`${APP_PATH}plan/list`)
    }, 1500)
  }

  const onActivate = async () => {
    const planId = Number(params.planId)
    if (isNaN(planId)) {
      message.error('Invalid planId')
      return
    }
    setActivating(true)
    const [_, err] = await activatePlan(planId)
    setActivating(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Plan activated')
    setTimeout(() => {
      navigate(`${APP_PATH}plan/list`)
    }, 2000)
  }

  const fetchData = async () => {
    const planId = Number(params.planId)
    setLoading(true)
    const [detailRes, err] = await getPlanDetailWithMore(
      isNew ? null : planId,
      fetchData
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    const { planDetail, addonList, metricsList } = detailRes
    console.log('res: ', planDetail, '//', addonList, '//', metricsList)

    const addons = addonList == null ? [] : addonList.map((p: any) => p.plan)
    const regularAddons = addons.filter((p: any) => p.type == 2)
    const onetimeAddons = addons.filter((p: any) => p.type == 3)
    setAddons(regularAddons)
    setSelectOnetime(onetimeAddons)
    setMetricsList(metricsList == null ? [] : metricsList)
    if (isNew) {
      return
    }
    // for editing existing plan, we continue with planDetailRes

    // plan obj and addon obj are at the same level in planDetailRes.data.data obj
    // but I want to put addonIds obj as a props of the local plan obj.
    planDetail.plan.amount = getAmount(
      planDetail.plan.amount,
      planDetail.plan.currency
    ) // /= 100; // TODO: addon also need to do the same, use a fn to do this

    planDetail.plan.addonIds =
      planDetail.addonIds == null ? [] : planDetail.addonIds
    planDetail.plan.onetimeAddonIds =
      planDetail.onetimeAddonIds == null ? [] : planDetail.onetimeAddonIds

    planDetail.plan.metadata = obj2array(planDetail.plan.metadata)

    const trialAmount = Number(planDetail.plan.trialAmount)
    if (!isNaN(trialAmount)) {
      planDetail.plan.enableTrial = true
      planDetail.plan.trialAmount = getAmount(
        trialAmount,
        planDetail.plan.currency
      )
      const [val, unit] = secondsToUnit(planDetail.plan.trialDurationTime)
      planDetail.plan.trialDurationTime = val
      setTrialLengthUnit(unit)
      //  trialDemand?: 'paymentMethod' | '' | boolean // backe
      planDetail.plan.trialDemand == 'paymentMethod' ? true : false
      //   cancelAtTrialEnd?: 0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UX, front-end use <Switch />
      planDetail.plan.cancelAtTrialEnd == 1 ? true : false
    }

    setPlan(planDetail.plan)
    form.setFieldsValue(planDetail.plan)

    // if empty, insert an placeholder item.
    const metrics =
      null == planDetail.metricPlanLimits ||
      planDetail.metricPlanLimits.length == 0
        ? [{ localId: ramdonString(8) }]
        : planDetail.metricPlanLimits.map((m: any) => ({
            localId: ramdonString(8),
            metricId: m.metricId,
            metricLimit: m.metricLimit
          }))
    setSelectedMetrics(metrics)

    setSelectAddons(
      regularAddons.filter(
        (a: any) =>
          a.intervalCount == planDetail.plan.intervalCount &&
          a.intervalUnit == planDetail.plan.intervalUnit &&
          a.currency == planDetail.plan.currency
      )
    )
  }

  // used only when editing an existing plan
  const togglePublish = async () => {
    setPublishing(true)
    const [_, err] = await togglePublishReq({
      planId: (plan as IPlan).id,
      publishAction: plan!.publishStatus == 1 ? 'PUBLISH' : 'UNPUBLISH'
    })
    if (null != err) {
      message.error(err.message)
      return
    }
    await fetchData()
    setPublishing(false)
  }

  // it just adds an empty metrics item
  const addMetrics = () => {
    const m: TMetricsItem = { localId: ramdonString(8) }
    setSelectedMetrics(update(selectedMetrics, { $push: [m] }))
  }

  const removeMetrics = (localId: string) => {
    const idx = selectedMetrics.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setSelectedMetrics(update(selectedMetrics, { $splice: [[idx, 1]] }))
    }
  }

  const updateMetrics =
    (localId: string) => (evt: React.ChangeEvent<HTMLInputElement>) => {
      const idx = selectedMetrics.findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setSelectedMetrics(
          update(selectedMetrics, {
            [idx]: { metricLimit: { $set: evt.target.value } }
          })
        )
      }
    }

  const onMetricSelectChange = (localId: string) => (val: number) => {
    const idx = selectedMetrics.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      const newMetrics = update(selectedMetrics, {
        [idx]: { metricId: { $set: val } }
      })
      setSelectedMetrics(newMetrics)
    }
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
      {plan && (
        <Form
          form={form}
          onFinish={onSave}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          layout="horizontal"
          // disabled={componentDisabled}
          // style={{ maxWidth: 1024 }}
          initialValues={plan}
        >
          {!isNew && (
            <Form.Item label="ID" name="id" hidden>
              <Input disabled />
            </Form.Item>
          )}

          <Form.Item
            label="Plan Name"
            name="planName"
            rules={[
              {
                required: true,
                message: 'Please input your plan name!'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Plan Description"
            name="description"
            rules={[
              {
                required: true,
                message: 'Please input your plan description!'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Status" name="status">
            {/* <span>{PLAN_STATUS[plan.status]}</span> */}
            {STATUS[plan.status]}
          </Form.Item>

          <Form.Item label="Is Published" name="publishStatus">
            <div>
              <span>
                {plan.publishStatus == 2 ? (
                  <CheckCircleOutlined
                    style={{ color: 'green', fontSize: '18px' }}
                  />
                ) : (
                  <MinusOutlined style={{ color: 'red', fontSize: '18px' }} />
                )}{' '}
              </span>
              <Button
                style={{ marginLeft: '12px' }}
                onClick={togglePublish}
                loading={publishing || loading}
                disabled={plan.status != 2 || publishing || loading}
              >
                {/* 2: active, you can only publish/unpublish an active plan */}
                {plan.publishStatus == 2 ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            label="Currency"
            name="currency"
            rules={[
              {
                required: true,
                message: 'Please select your plan currency!'
              }
            ]}
          >
            <Select
              style={{ width: 180 }}
              options={[
                { value: 'EUR', label: 'EUR' },
                { value: 'USD', label: 'USD' },
                { value: 'JPY', label: 'JPY' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Price"
            name="amount"
            dependencies={['currency']}
            rules={[
              {
                required: true,
                message: 'Please input your plan price!'
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  const num = Number(value)
                  if (isNaN(num) || num < 0) {
                    return Promise.reject(`Please input a valid price (> 0).`)
                  }
                  if (
                    !currencyDecimalValidate(num, getFieldValue('currency'))
                  ) {
                    return Promise.reject('Please input a valid price')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input
              style={{ width: 180 }}
              prefix={
                CURRENCY[form.getFieldValue('currency') ?? plan.currency].symbol
              }
            />
          </Form.Item>

          <div>
            <Form.Item
              label="Interval Unit"
              name="intervalUnit"
              rules={[
                {
                  required: planTypeWatch != 3, // == 1 (main plan), == 2(addon), == 3(one time payment)
                  message: 'Please select interval unit!'
                }
              ]}
            >
              <Select
                style={{ width: 180 }}
                disabled={planTypeWatch == 3} // one-time payment has no interval unit/count
                options={[
                  { value: 'day', label: 'day' },
                  { value: 'week', label: 'week' },
                  { value: 'month', label: 'month' },
                  { value: 'year', label: 'year' }
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Interval Count"
            name="intervalCount"
            rules={[
              {
                required: true,
                message: 'Please input interval count!'
              }
            ]}
          >
            <Input disabled={planTypeWatch == 3} style={{ width: 180 }} />
            {/* one-time payment has no interval unit/count */}
          </Form.Item>

          <Form.Item label="Plan Type" name="type">
            <Select
              style={{ width: 180 }}
              disabled={!isNew || plan.status != 1}
              options={[
                { value: 1, label: 'Main plan' },
                { value: 2, label: 'Addon' },
                { value: 3, label: 'One time payment' }
              ]}
            />
          </Form.Item>

          {plan.type == 1 && (
            <Form.Item label="Add-ons" name="addonIds">
              <Select
                mode="multiple"
                allowClear
                disabled={planTypeWatch == 2 || planTypeWatch == 3} // you cannot add addon to another addon (or another one time payment)
                style={{ width: '100%' }}
                options={selectAddons.map((a) => ({
                  label: a.planName,
                  value: a.id
                }))}
              />
            </Form.Item>
          )}

          {plan.type == 1 && (
            <Form.Item label="One-time payment add-on" name="onetimeAddonIds">
              <Select
                allowClear
                disabled={planTypeWatch == 2 || planTypeWatch == 3} // you cannot add one-time payment addon to another addon (or another one time payment)
                style={{ width: '100%' }}
                options={selectOnetime.map((a) => ({
                  label: a.planName,
                  value: a.id
                }))}
              />
            </Form.Item>
          )}

          <Form.Item label="Enable Trial" name="enableTrial">
            <Switch />
          </Form.Item>

          <Form.Item
            label="Trial Price"
            name="trialAmount"
            dependencies={['amount', 'currency']}
            rules={[
              {
                required: enableTrialWatch,
                message: 'Please input your trial price!'
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  const num = Number(value)
                  const planPrice = Number(getFieldValue('amount'))
                  if (isNaN(planPrice)) {
                    return Promise.reject('Invalid plan price')
                  }
                  if (isNaN(num) || num < 0 || num >= planPrice) {
                    return Promise.reject(
                      `Please input a valid price (>= 0 and < plan price ${getFieldValue('amount')}).`
                    )
                  }
                  if (
                    !currencyDecimalValidate(num, getFieldValue('currency'))
                  ) {
                    return Promise.reject('Please input a valid price')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input
              disabled={!enableTrialWatch}
              style={{ width: 180 }}
              prefix={
                CURRENCY[form.getFieldValue('currency') ?? plan.currency].symbol
              }
            />
          </Form.Item>

          <Form.Item
            label="Trial length"
            name="trialDurationTime"
            rules={[
              {
                required: enableTrialWatch,
                message: 'Please input your trial length!'
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  const num = Number(value)
                  if (isNaN(num) || num <= 0) {
                    return Promise.reject('Invalid trial length (>0)')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input
              style={{ width: 220 }}
              addonAfter={selectAfter}
              disabled={!enableTrialWatch}
            />
          </Form.Item>

          <Form.Item label="Trial requires billing info" name="trialDemand">
            <Switch disabled={!enableTrialWatch} />
          </Form.Item>

          <Form.Item label="Auto renew after trial end" name="cancelAtTrialEnd">
            <Switch disabled={!enableTrialWatch} />
          </Form.Item>

          <Form.Item label="Billable Metrics">
            <Row
              gutter={[8, 8]}
              style={{ marginTop: '0px' }}
              className=" font-bold text-gray-500"
            >
              <Col span={5}>Name</Col>
              <Col span={3}>Code</Col>
              <Col span={6}>Description</Col>
              <Col span={5}>Aggregation Property</Col>
              <Col span={3}>Limit Value</Col>
              <Col span={2}>
                <div
                  onClick={addMetrics}
                  className={`w-16 font-bold ${planTypeWatch == 3 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <PlusOutlined />
                </div>
              </Col>
            </Row>
            {selectedMetrics.map((m) => (
              <Row key={m.localId} gutter={[8, 8]} className="my-4">
                <Col span={5}>
                  <Select
                    disabled={planTypeWatch == 3}
                    value={m.metricId}
                    onChange={onMetricSelectChange(m.localId)}
                    style={{ width: 180 }}
                    options={metricsList.map((m) => ({
                      label: m.metricName,
                      value: m.id
                    }))}
                  />
                </Col>
                <Col span={3}>
                  {metricsList.find((metric) => metric.id == m.metricId)?.code}
                </Col>
                <Col span={6}>
                  {
                    metricsList.find((metric) => metric.id == m.metricId)
                      ?.metricDescription
                  }
                </Col>
                <Col span={5}>
                  {
                    metricsList.find((metric) => metric.id == m.metricId)
                      ?.aggregationProperty
                  }
                </Col>
                <Col span={3}>
                  <Input
                    disabled={planTypeWatch == 3}
                    value={m.metricLimit}
                    onChange={updateMetrics(m.localId)}
                  />
                </Col>
                <Col span={2}>
                  <div
                    onClick={() => removeMetrics(m.localId)}
                    className={`w-16 font-bold ${planTypeWatch == 3 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <MinusOutlined />
                  </div>
                </Col>
              </Row>
            ))}
          </Form.Item>

          <Form.Item label="Custom data">
            <Row
              gutter={[8, 8]}
              style={{ marginTop: '0px' }}
              className=" font-bold text-gray-500"
            >
              <Col span={5}>Property</Col>
              <Col span={5}>Value Type</Col>
              <Col span={5}>Value</Col>
              <Col span={5}>
                <div
                  onClick={() => addMetadata()}
                  className={`w-16 cursor-pointer font-bold`}
                >
                  <PlusOutlined />
                </div>
              </Col>
            </Row>

            <Form.List name="metadata">
              {(fields, { add, remove }) => {
                addMetadata = add
                return (
                  <>
                    {fields &&
                      fields.map((field, index) => {
                        return (
                          <Row
                            key={ramdonString(8)}
                            className="flex items-center"
                            style={{ marginBottom: '12px' }}
                          >
                            <Col span={5}>
                              <Form.Item
                                name={[field.name, 'property']}
                                // label={`Event - ${index + 1}`}
                                noStyle={true}
                                rules={[
                                  {
                                    required: true
                                    // message: 'property cannot be empty'
                                  },
                                  ({ getFieldValue }) => ({
                                    validator(rule, value) {
                                      if (
                                        getFieldValue('metadata').filter(
                                          (m: any) => m.property == value
                                        ).length >= 2
                                      ) {
                                        return Promise.reject(
                                          'Duplicate property'
                                        )
                                      } else if (value.trim() == '') {
                                        return Promise.reject(
                                          'Property cannot be empty'
                                        )
                                      } else {
                                        return Promise.resolve()
                                      }
                                    }
                                  })
                                ]}
                              >
                                <Input style={{ width: '85%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item
                                name={[field.name, 'valueType']}
                                // label={`Event - ${index + 1}`}
                                noStyle={true}
                                rules={[{ required: true }]}
                                // dependencies={[field.name, 'value']}
                              >
                                <Select
                                  style={{ width: 180 }}
                                  options={[
                                    { value: 'string', label: 'String' },
                                    { value: 'number', label: 'Number' },
                                    { value: 'boolean', label: 'Bool' }
                                  ]}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item
                                name={[field.name, 'value']}
                                // label={`Event - ${index + 1}`}
                                noStyle={true}
                                rules={[
                                  { required: true },
                                  ({ getFieldValue }) => ({
                                    validator(rule, value) {
                                      // switch (metaDataWatch[index].valueType) {
                                      switch (
                                        getFieldValue([
                                          'metadata',
                                          index,
                                          'valueType'
                                        ])
                                      ) {
                                        case 'boolean':
                                          if (
                                            value != '1' &&
                                            value != '0' &&
                                            value.toLowerCase() != 'true' &&
                                            value.toLowerCase() != 'false'
                                          ) {
                                            return Promise.reject(
                                              'Invalid boolean value, only "true" or "false" are allowed!'
                                            )
                                          }
                                          return Promise.resolve()
                                        case 'number':
                                          if (isNaN(Number(value))) {
                                            return Promise.reject(
                                              'Invalid numeric value'
                                            )
                                          }
                                          return Promise.resolve()
                                        default:
                                          return Promise.resolve()
                                      }
                                    }
                                  })
                                ]}
                              >
                                <Input style={{ width: '85%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <div
                                onClick={() => {
                                  remove(field.name)
                                }}
                                style={{
                                  marginLeft: '5px',
                                  fontWeight: 'bold',
                                  width: '32px',
                                  cursor: `pointer`
                                }}
                              >
                                <MinusOutlined />
                              </div>
                            </Col>
                          </Row>
                        )
                      })}
                  </>
                )
              }}
            </Form.List>
          </Form.Item>

          <Form.Item label="Product Name" name="productName" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Product Description"
            name="productDescription"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item label="imageUrl" name="imageUrl" hidden>
            <Input disabled />
          </Form.Item>

          <Form.Item label="homeUrl" name="homeUrl" hidden>
            <Input disabled />
          </Form.Item>

          <div className="flex justify-center gap-5">
            <Button
              onClick={() => navigate(`${APP_PATH}plan/list`)}
              disabled={loading || activating}
            >
              Go Back
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={plan.status != 1 || loading || activating}
            >
              Save
            </Button>
            {!isNew && (
              <Button
                onClick={onActivate}
                loading={activating}
                disabled={isNew || plan.status != 1 || activating || loading}
              >
                Activate
              </Button>
            )}
          </div>
        </Form>
      )}
    </div>
  )
}

export default Index
