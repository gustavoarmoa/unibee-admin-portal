import axios from 'axios'
// import { useProfileStore } from "../stores";
import { CURRENCY } from '../constants'
import {
  DiscountCode,
  ExpiredError,
  IProfile,
  TMerchantInfo
} from '../shared.types.d'
import { useMerchantInfoStore, useSessionStore } from '../stores'
import { request } from './client'

const API_URL = import.meta.env.VITE_API_URL
const session = useSessionStore.getState()

// after login, we need merchantInfo, appConfig, payment gatewayInfo, etc.
// this fn get all these data in one go.
export const initializeReq = async () => {
  const [
    [appConfig, errConfig],
    [gateways, errGateway],
    [merchantInfo, errMerchant]
  ] = await Promise.all([
    getAppConfigReq(),
    getGatewayListReq(),
    getMerchantInfoReq()
  ])
  const err = errConfig || errGateway || errMerchant
  if (null != err) {
    return [null, err]
  }
  return [{ appConfig, gateways, merchantInfo }, null]
}

// ------------
type TSignupReq = {
  email: string
  firstName: string
  lastName: string
  password: string
}
export const signUpReq = async (body: TSignupReq) => {
  try {
    const res = await request.post(`/merchant/auth/sso/register`, body)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// -------------

type TSignupVerifyReq = {
  email: string
  verificationCode: string
}
export const signUpVerifyReq = async (body: TSignupVerifyReq) => {
  try {
    const res = await request.post(`/user/auth/sso/registerVerify`, body)
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TPassLogin = {
  email: string
  password: string
}
export const loginWithPasswordReq = async (body: TPassLogin) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post('/merchant/auth/sso/login', body)
    session.setSession({ expired: false, refresh: null })
    return [res.data.data, null]
  } catch (err) {
    session.setSession({ expired: true, refresh: null })
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const loginWithOTPReq = async (email: string) => {
  try {
    const res = await request.post(`/merchant/auth/sso/loginOTP`, { email })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const loginWithOTPVerifyReq = async (
  email: string,
  verificationCode: string
) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post(`/merchant/auth/sso/loginOTPVerify`, {
      email,
      verificationCode
    })
    session.setSession({ expired: false, refresh: null })
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const forgetPassReq = async (email: string) => {
  try {
    const res = await request.post(`/merchant/auth/sso/passwordForgetOTP`, {
      email
    })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const forgetPassVerifyReq = async (
  email: string,
  verificationCode: string,
  newPassword: string
) => {
  try {
    const res = await request.post(
      `/merchant/auth/sso/passwordForgetOTPVerify`,
      {
        email,
        verificationCode,
        newPassword
      }
    )
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const resetPassReq = async (
  oldPassword: string,
  newPassword: string
) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post(`/merchant/member/passwordReset`, {
      oldPassword,
      newPassword
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const logoutReq = async () => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post(`/merchant/member/logout`, {})
    const code = res.data.code
    session.setSession({ expired: true, refresh: null })
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getAppConfigReq = async () => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(`/system/information/get`, {})
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getGatewayListReq = async () => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(`/merchant/gateway/list`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.gateways, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMerchantInfoReq = async () => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(`/merchant/get`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateMerchantInfoReq = async (body: TMerchantInfo) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post(`/merchant/update`, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.merchant, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const uploadLogoReq = async (f: FormData) => {
  const token = localStorage.getItem('merchantToken')
  const session = useSessionStore.getState()
  try {
    const res = await axios.post(`${API_URL}/merchant/oss/file `, f, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `${token}` // Bearer: ******
      }
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.url, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const generateApiKeyReq = async () => {
  try {
    const res = await request.post('/merchant/new_apikey', {})
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.apiKey, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TGatewayKeyBody = {
  gatewayId?: number
  gatewayName?: string
  gatewayKey: string
  gatewaySecret: string
}
export const saveGatewayKeyReq = async (
  body: TGatewayKeyBody,
  isNew: boolean
) => {
  const url = isNew ? '/merchant/gateway/setup' : '/merchant/gateway/edit'
  try {
    const res = await request.post(url, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveChangellyPubKeyReq = async (
  gatewayId: number,
  webhookSecret: string
) => {
  try {
    const res = await request.post('/merchant/gateway/setup_webhook', {
      gatewayId,
      webhookSecret
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveVatSenseKeyReq = async (vatKey: string) => {
  const body = {
    IsDefault: true,
    gatewayName: 'vatsense',
    data: vatKey
  }
  try {
    const res = await request.post('/merchant/vat/setup_gateway', body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const saveSendGridKeyReq = async (vatKey: string) => {
  const body = {
    IsDefault: true,
    gatewayName: 'sendgrid',
    data: vatKey
  }
  try {
    const res = await request.post('/merchant/email/gateway_setup', body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// ---------------
export type TPlanListBody = {
  type?: number[] | null
  status?: number[] | null
  publishStatus?: number // 1-UnPublished，2-Published
  page: number
  count: number
}
export const getPlanList = async (
  body: TPlanListBody,
  refreshCb: (() => void) | null
) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post('/merchant/plan/list', body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// -----------------

export const getPlanDetail = async (planId: number) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post('/merchant/plan/detail', {
      planId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    console.log('get plan detail: ', res.data.data)
    return [res.data.data.plan, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const copyPlanReq = async (planId: number) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post('/merchant/plan/copy', {
      planId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.plan, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// 3 calls to get planDetail(with planId), addonList, and metricsList
// "planId: null" means caller want to create a new plan, so I pass a resolved promise to meet the caller signature.
export const getPlanDetailWithMore = async (
  planId: number | null,
  refreshCb: (() => void) | null
) => {
  const session = useSessionStore.getState()
  const planDetailRes =
    planId == null
      ? Promise.resolve([{ data: { data: null, code: 0 } }, null])
      : getPlanDetail(planId)
  const [
    [planDetail, errDetail],
    [addonList, addonErr],
    [metricsList, errMetrics]
  ] = await Promise.all([
    planDetailRes,
    getPlanList({ type: [2, 3], status: [2], page: 0, count: 150 }, null), // type: [2,3] -> [addon, one-time-pay], status: 2 -> active
    getMetricsListReq(null)
  ])
  const err = errDetail || addonErr || errMetrics
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({ expired: true, refresh: refreshCb })
    }
    return [null, err]
  }

  return [{ planDetail, addonList, metricsList }, null]
}

// create a new or save an existing plan
export const savePlan = async (planDetail: any, isNew: boolean) => {
  const url = isNew ? '/merchant/plan/new' : `/merchant/plan/edit`
  try {
    const res = await request.post(url, planDetail)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.plan, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const activatePlan = async (planId: number) => {
  try {
    const res = await request.post(`/merchant/plan/activate`, {
      planId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful result returned.
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const deletePlanReq = async (planId: number) => {
  try {
    const res = await request.post(`/merchant/plan/delete`, {
      planId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful result returned.
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const togglePublishReq = async ({
  planId,
  publishAction
}: {
  planId: number
  publishAction: 'PUBLISH' | 'UNPUBLISH'
}) => {
  const url = `/merchant/plan/${
    publishAction === 'PUBLISH' ? 'publish' : 'unpublished'
  }`
  try {
    const res = await request.post(url, { planId })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful result returned.
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMetricsListReq = async (refreshCb: null | (() => void)) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(`/merchant/metric/list`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// --------
type TMetricsBody = {
  // for edit
  metricId: number
  metricName: string
  metricDescription: string
}
type TMetricsBodyNew = {
  // for creation
  code: string
  metricName: string
  metricDescription: string
  aggregationType: number
  aggregationProperty: number
}
// create a new or save an existing metrics
export const saveMetricsReq = async (
  body: TMetricsBody | TMetricsBodyNew,
  isNew: boolean
) => {
  const url = isNew ? `/merchant/metric/new` : `/merchant/metric/edit`
  try {
    const res = await request.post(url, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful result returned.
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// ---------

export const getMetricDetailReq = async (
  metricId: number,
  refreshCb: () => void
) => {
  try {
    const res = await request.post(`/merchant/metric/detail`, {
      metricId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.merchantMetric, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// ----------
type TSubListReq = {
  status: number[]
  page: number
  count: number
}
export const getSublist = async (body: TSubListReq, refreshCb: () => void) => {
  try {
    const res = await request.post(`/merchant/subscription/list`, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// ------------

export const getSubByUserReq = async (
  userId: number,
  refreshCb: () => void
) => {
  try {
    const res = await request.get(
      `/merchant/subscription/user_subscription_detail?userId=${userId}`
    )
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getSubDetail = async (subscriptionId: string) => {
  try {
    const res = await request.post(`/merchant/subscription/detail`, {
      subscriptionId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getSubDetailWithMore = async (
  subscriptionId: string,
  refreshCb: (() => void) | null
) => {
  const [[subDetail, errSubDetail], [planList, errPlanList]] =
    await Promise.all([
      getSubDetail(subscriptionId),
      getPlanList(
        {
          type: [1], // main plan
          status: [2], // active
          page: 0,
          count: 150
        },
        null
      )
    ])
  const err = errSubDetail || errPlanList
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({ expired: true, refresh: refreshCb })
    }
    return [null, err]
  }
  return [{ subDetail, planList }, null]
}

export const getSubscriptionHistoryReq = async ({
  userId,
  page,
  count
}: {
  userId: number
  page: number
  count: number
}) => {
  try {
    const res = await request.post(`/merchant/subscription/timeline_list`, {
      userId,
      page,
      count
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null] // backend has no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// new user has choosen a sub plan, but not paid yet, before the payment due date, user and admin can cancel it.
// this fn is for this purpose only, this call only work for sub.status == created.
// it's not the same as terminate an active sub,
export const cancelSubReq = async (subscriptionId: string) => {
  try {
    const res = await request.post(`/merchant/subscription/cancel`, {
      subscriptionId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// mark pending subscription as incomplete until this date
export const markAsIncompleteReq = async (
  subscriptionId: string,
  until: number
) => {
  try {
    const res = await request.post(
      `/merchant/subscription/active_temporarily`,
      {
        subscriptionId,
        expireTime: until
      }
    )
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const createPreviewReq = async (
  subscriptionId: string,
  newPlanId: number,
  addons: { quantity: number; addonPlanId: number }[]
) => {
  try {
    const res = await request.post(`/merchant/subscription/update_preview`, {
      subscriptionId,
      newPlanId,
      quantity: 1,
      addonParams: addons
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateSubscription = async (
  subscriptionId: string,
  newPlanId: number,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  prorationDate: number
) => {
  try {
    const res = await request.post(`/merchant/subscription/update_submit`, {
      subscriptionId,
      newPlanId,
      quantity: 1,
      addonParams: addons,
      confirmTotalAmount,
      confirmCurrency,
      prorationDate
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
type TCreateSubReq = {
  planId: number
  gatewayId: number
  userId: number
  trialEnd?: number
  addons?: { quantity: number; addonPlanId: number }[]
  confirmTotalAmount?: number
  confirmCurrency?: string
  startIncomplete?: boolean
}
export const createSubscriptionReq = async ({
  planId,
  gatewayId,
  userId,
  trialEnd,
  addons,
  confirmCurrency,
  confirmTotalAmount,
  startIncomplete
}: TCreateSubReq) => {
  try {
    const res = await request.post(`/merchant/subscription/create_submit`, {
      planId,
      gatewayId,
      userId,
      trialEnd,
      quantity: 1,
      addonParams: addons,
      confirmTotalAmount,
      confirmCurrency,
      startIncomplete
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// terminate the subscription, immediate: true -> now, immediate: false -> at the end of this billing cycle
export const terminateSubReq = async (
  SubscriptionId: string,
  immediate: boolean
) => {
  const body: {
    SubscriptionId: string
    invoiceNow?: boolean
    prorate?: boolean
  } = {
    SubscriptionId
  }
  let url = `/merchant/subscription/cancel_at_period_end`
  if (immediate) {
    body.invoiceNow = true
    body.prorate = true
    url = `/merchant/subscription/cancel`
  }
  try {
    const res = await request.post(url, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// resume subscription is for case that it'll get terminated at the end of this billing cycle automatically.
// if it's ended immediately, no resume allowed.
export const resumeSubReq = async (subscriptionId: string) => {
  const url = `/merchant/subscription/cancel_last_cancel_at_period_end`
  try {
    const res = await request.post(url, {
      subscriptionId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// -------------
type TGetSubTimelineReq = {
  userId?: number
  page: number
  count: number
}
export const getSubTimelineReq = async (body: TGetSubTimelineReq) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post(`/merchant/subscription/timeline_list`, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.subscriptionTimeLines, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// query params are the same as getSubTimelineReq
export const getPaymentTimelineReq = async (
  params: TGetSubTimelineReq,
  refreshCb: () => void
) => {
  const { page, count, userId } = params
  let url = `/merchant/payment/timeline/list?page=${page}&count=${count}`
  if (userId != null) {
    url += `&userId=${params.userId}`
  }
  try {
    const res = await request.get(url)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getDetailPaymentListReq = async (
  params: TGetSubTimelineReq,
  refreshCb: () => void
) => {
  const { page, count } = params
  try {
    const res = await request.get(
      `/merchant/payment/list?page=${page}&count=${count}`
    )
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.paymentDetails, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getPaymentDetailReq = async (
  paymentId: string,
  refreshCb: () => void
) => {
  try {
    const res = await request.get(
      `/merchant/payment/detail?paymentId=${paymentId}`
    )
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.paymentDetail, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// -----------
export const getCountryListReq = async () => {
  const merchantStore = useMerchantInfoStore.getState()
  const session = useSessionStore.getState()
  try {
    const res = await request.post(`/merchant/vat/country_list`, {
      merchantId: merchantStore.id
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.vatCountryList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const extendDueDateReq = async (
  subscriptionId: string,
  appendTrialEndHour: number
) => {
  try {
    const res = await request.post(
      `/merchant/subscription/add_new_trial_start`,
      {
        subscriptionId,
        appendTrialEndHour
      }
    )
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getAdminNoteReq = async ({
  subscriptionId,
  page,
  count,
  refreshCb
}: {
  subscriptionId: string
  page: number
  count: number
  refreshCb: (() => void) | null
}) => {
  try {
    const res = await request.post('/merchant/subscription/admin_note_list', {
      subscriptionId,
      page,
      count
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.noteLists, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const createAdminNoteReq = async ({
  subscriptionId,
  note
}: {
  subscriptionId: string
  note: string
}) => {
  const merchantStore = useMerchantInfoStore.getState()
  try {
    const res = await request.post('/merchant/subscription/new_admin_note', {
      subscriptionId,
      merchantMemberId: merchantStore.id,
      note
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const setSimDateReq = async (
  subscriptionId: string,
  newTestClock: number
) => {
  try {
    const res = await request.post(`/system/subscription/test_clock_walk`, {
      subscriptionId,
      newTestClock
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// billing admin can also get user profile.
export const getUserProfile = async (userId: number, refreshCb: () => void) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(`/merchant/user/get?userId=${userId}`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.user, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// billing admin can also update user profile.
export const saveUserProfileReq = async (newProfile: IProfile) => {
  const session = useSessionStore.getState()
  const u = JSON.parse(JSON.stringify(newProfile))
  u.userId = newProfile.id
  try {
    const res = await request.post(`/merchant/user/update`, u)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // this call has no meaningful result to return
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// billing admin can also update user profile.
export const suspendUserReq = async (userId: number) => {
  try {
    const res = await request.post(`/merchant/user/suspend_user`, { userId })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// not the same as user signup, this is for admin to create the user.
type TNewUserInfo = {
  externalUserId?: string
  email: string
  firstName?: string
  lastName?: string
  password?: string
  phone?: string
  address?: string
}
export const createNewUserReq = async (newUser: TNewUserInfo) => {
  try {
    const res = await request.post(`/merchant/user/new`, newUser)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // this call has no meaningful result to return
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const appSearchReq = async (searchKey: string) => {
  try {
    const res = await request.post(`/merchant/search/key_search`, {
      searchKey
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

type TDiscountCodeQry = {
  page: number
  count: number
}
export const getDiscountCodeListReq = async (
  params: TDiscountCodeQry,
  refreshCb: () => void
) => {
  const { page, count } = params // these 2 fields always exist
  try {
    const res = await request.get(
      `/merchant/discount/list?page=${page}&count=${count}`
    )
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

const getDiscountCodeDetailReq = async (codeId: number) => {
  try {
    const res = await request.get(`/merchant/discount/detail?id=${codeId}`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.discount, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getDiscountCodeDetailWithMore = async (
  codeId: number,
  refreshCb: () => void
) => {
  const [[discount, errDiscount], [planList, errPlanList]] = await Promise.all([
    getDiscountCodeDetailReq(codeId),
    getPlanList(
      {
        type: [1], // main plan
        status: [2], // active
        page: 0,
        count: 150
      },
      null
    )
  ])

  const err = errDiscount || errPlanList
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({ expired: true, refresh: refreshCb })
    }
    return [null, err]
  }

  return [{ discount, planList }, null]

  try {
    const res = await request.get(`/merchant/discount/detail?id=${codeId}`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.discount, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const createDiscountCodeReq = async (body: DiscountCode) => {
  try {
    const res = await request.post(`/merchant/discount/new`, body)
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateDiscountCodeReq = async (body: DiscountCode) => {
  try {
    const res = await request.post(`/merchant/discount/edit`, body)
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const deleteDiscountCodeReq = async (id: number) => {
  try {
    const res = await request.post(`/merchant/discount/delete`, { id })
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const toggleDiscountCodeActivateReq = async (
  id: number,
  action: 'activate' | 'deactivate'
) => {
  try {
    const res = await request.post(`/merchant/discount/${action}`, { id })
    if (res.data.code == 61) {
      // session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// ----------
type TGetInvoicesReq = {
  userId?: number
  page: number
  count: number
  firstName?: string
  lastName?: string
  currency?: string
  status?: number[]
  amountStart?: number
  amountEnd?: number
}
export const getInvoiceListReq = async (
  body: TGetInvoicesReq,
  refreshCb: (() => void) | null
) => {
  try {
    const res = await request.post(`/merchant/invoice/list`, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// ----------

export const getInvoiceDetailReq = async (
  invoiceId: string,
  refreshCb: () => void
) => {
  try {
    const res = await request.post(`/merchant/invoice/detail`, {
      invoiceId
    })

    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const markInvoiceAsPaidReq = async (
  invoiceId: string,
  reason: string,
  TransferNumber: string
) => {
  try {
    const res = await request.post(
      `/merchant/invoice/mark_wire_transfer_success`,
      {
        invoiceId,
        reason,
        TransferNumber
      }
    )

    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// ------------
type TCreateInvoiceReq = {
  name: string
  userId: number
  currency: string
  taxPercentage: number
  invoiceItems: TInvoiceItems[]
  lines?: TInvoiceItems[]
  finish: boolean
}
type TInvoiceItems = {
  unitAmountExcludingTax: number
  description: string
  quantity: number
}
// admin manually create an invoice, still editable until the publishInvoice() is called.
// before that, customers won't see(or receive) this invoice.
export const createInvoiceReq = async (body: TCreateInvoiceReq) => {
  body.lines = body.invoiceItems
  try {
    const res = await request.post(`/merchant/invoice/new`, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // backend has no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
// -------------

// before publish, admin can still edit and save.
type TSaveInvoiceReq = {
  invoiceId: string
  taxPercentage: number
  currency: string
  name: string
  invoiceItems: TInvoiceItems[]
  lines?: TInvoiceItems[]
}
export const saveInvoiceReq = async (body: TSaveInvoiceReq) => {
  body.lines = body.invoiceItems
  try {
    const res = await request.post(`/merchant/invoice/edit`, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// admin can delete the invoice, before the following publishInvoice() is called
export const deleteInvoiceReq = async (invoiceId: string) => {
  try {
    const res = await request.post(`/merchant/invoice/delete`, {
      invoiceId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// after publish, user will receive an email informing him/her to finish the payment.
// admin cannot edit it anymore, but can cancel it by calling the following revokeInvoice() before user finish the payment
type TPublishInvoiceReq = {
  invoiceId: string
  payMethod: number
  daysUtilDue: number
}
export const publishInvoiceReq = async (body: TPublishInvoiceReq) => {
  try {
    const res = await request.post(`/merchant/invoice/finish`, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// admin can cancel the invoice(make it invalid) before user make the payment.
export const revokeInvoiceReq = async (invoiceId: string) => {
  try {
    const res = await request.post(`/merchant/invoice/cancel`, {
      invoiceId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// TODO: let caller do the amt convert.
export const refundReq = async (
  body: {
    invoiceId: string
    refundAmount: number
    reason: string
  },
  currency: string
) => {
  body.refundAmount *= CURRENCY[currency].stripe_factor
  body.refundAmount = Math.round(body.refundAmount)
  try {
    const res = await request.post(`/merchant/invoice/refund`, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const sendInvoiceInMailReq = async (invoiceId: string) => {
  try {
    const res = await request.post(`/merchant/invoice/send_email`, {
      invoiceId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // no meaningful return value
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const downloadInvoice = (url: string) => {
  if (url == null || url == '') {
    return
  }
  axios({
    url,
    method: 'GET',
    responseType: 'blob'
  }).then((response) => {
    const href = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = href
    link.setAttribute('download', 'invoice.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  })
}

// ------------------
type TUserList = {
  merchantId: number
  userId?: number
  firstName?: string
  lastName?: string
  email?: string
  status?: number[]
  page: number
  count: number
}
export const getUserListReq = async (
  users: TUserList,
  refreshCb: () => void
) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post(`/merchant/user/list`, users)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getMerchantUserListReq = async (refreshCb: () => void) => {
  try {
    const res = await request.get('/merchant/member/list')
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const inviteMemberReq = async ({
  email,
  firstName,
  lastName,
  role
}: {
  email: string
  firstName: string
  lastName: string
  role: string
}) => {
  const body = { email, firstName, lastName, role }
  try {
    const res = await request.post('/merchant/member/new_member', body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getPaymentGatewayListReq = async () => {
  try {
    const res = await request.get(`/merchant/gateway/list`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.gateways, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getAppKeysWithMore = async (refreshCb: () => void) => {
  const [[merchantInfo, errMerchantInfo], [gateways, errGateways]] =
    await Promise.all([getMerchantInfoReq(), getPaymentGatewayListReq()])
  const err = errMerchantInfo || errGateways
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({ expired: true, refresh: refreshCb })
    }
    return [null, err]
  }
  return [{ merchantInfo, gateways }, null]
}

type TWireTransferAccount = {
  gatewayId?: number // required only for updating
  currency: string
  minimumAmount: number
  bank: {
    accountHolder: string
    bic: string
    iban: string
    address: string
  }
}
export const createWireTransferAccountReq = async (
  body: TWireTransferAccount
) => {
  try {
    const res = await request.post(
      '/merchant/gateway/wire_transfer_setup',
      body
    )
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const updateWireTransferAccountReq = async (
  body: TWireTransferAccount
) => {
  try {
    const res = await request.post('/merchant/gateway/wire_transfer_edit', body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getEventListReq = async () => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(`/merchant/webhook/event_list`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.eventList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getWebhookListReq = async (refreshCb: () => void) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(`/merchant/webhook/endpoint_list`)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.endpointList, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

// used for both creation and update
export const saveWebhookReq = async ({
  url,
  events,
  endpointId
}: {
  url: string
  events: string[]
  endpointId?: number
}) => {
  const session = useSessionStore.getState()
  try {
    const actionUrl =
      endpointId == null
        ? '/merchant/webhook/new_endpoint'
        : '/merchant/webhook/update_endpoint'
    const body: any = { url, events }
    if (endpointId != null) {
      body.endpointId = endpointId
    }
    const res = await request.post(actionUrl, body)
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // this call has no meaningful result
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const deleteWebhookReq = async (endpointId: number) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.post('/merchant/webhook/delete_endpoint', {
      endpointId
    })
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null })
      throw new ExpiredError('Session expired')
    }
    return [null, null] // this call has no meaningful result
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}

export const getWebhookLogs = async (
  {
    endpointId,
    page,
    count
  }: { endpointId: number; page: number; count: number },
  refreshCb: null | (() => void)
) => {
  const session = useSessionStore.getState()
  try {
    const res = await request.get(
      `/merchant/webhook/endpoint_log_list?endpointId=${endpointId}&page=${page}&count=${count}`
    )
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb })
      throw new ExpiredError('Session expired')
    }
    return [res.data.data.endpointLogList ?? [], null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
