import axios from 'axios';
// import { useProfileStore } from "../stores";
import { useNavigate } from 'react-router-dom';
import { CURRENCY } from '../constants';
import {
  ExpiredError,
  IBillableMetrics,
  IProfile,
  TMerchantInfo,
} from '../shared.types.d';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useSessionStore,
} from '../stores';
import { request } from './client';

const API_URL = import.meta.env.VITE_API_URL;
const session = useSessionStore.getState();

// after login, we need merchantInfo, appConfig, payment gatewayInfo, etc.
// this fn get all these data in one go.
export const initializeReq = async () => {
  const [
    [appConfig, errConfig],
    [gateways, errGateway],
    [merchant, errMerchant],
  ] = await Promise.all([
    getAppConfigReq(),
    getGatewayListReq(),
    getMerchantInfoReq(),
  ]);
  const err = errConfig || errGateway || errMerchant;
  if (null != err) {
    return [null, err];
  }
  return [{ appConfig, gateways, merchant }, null];
};

type TPassLogin = {
  email: string;
  password: string;
};
export const loginWithPasswordReq = async (body: TPassLogin) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post('/merchant/auth/sso/login', body);
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    session.setSession({ expired: false, refresh: null });
    return [res.data.data, null];
  } catch (err) {
    session.setSession({ expired: true, refresh: null });
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const loginWithOTPReq = async (email: string) => {
  try {
    const res = await request.post(`/merchant/auth/sso/loginOTP`, { email });
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [null, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const loginWithOTPVerifyReq = async (
  email: string,
  verificationCode: string,
) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post(`/merchant/auth/sso/loginOTPVerify`, {
      email,
      verificationCode,
    });
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    session.setSession({ expired: false, refresh: null });
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const forgetPassReq = async (email: string) => {
  try {
    const res = await request.post(`/merchant/auth/sso/passwordForgetOTP`, {
      email,
    });
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [null, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const forgetPassVerifyReq = async (
  email: string,
  verificationCode: string,
  newPassword: string,
) => {
  try {
    const res = await request.post(
      `/merchant/auth/sso/passwordForgetOTPVerify`,
      {
        email,
        verificationCode,
        newPassword,
      },
    );
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [null, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const resetPassReq = async (
  oldPassword: string,
  newPassword: string,
) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post(`/merchant/passwordReset`, {
      oldPassword,
      newPassword,
    });
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [null, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const logoutReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post(`/merchant/member/logout`, {});
    const code = res.data.code;
    // if (code != 0 && code != 61) { }
    session.setSession({ expired: true, refresh: null });
    return [null, null];
  } catch (err) {
    return [null, null];
  }
};

export const getAppConfigReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(`/system/information/get`, {});
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getGatewayListReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(`/merchant/gateway/list`);
    console.log('gateway res: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.gateways, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getMerchantInfoReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(`/merchant/get`);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
      // throw new ExpiredError('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.merchant, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const updateMerchantInfoReq = async (body: TMerchantInfo) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post(`/merchant/update`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.MerchantInfo, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const uploadLogoReq = async (f: FormData) => {
  const token = localStorage.getItem('merchantToken');
  const session = useSessionStore.getState();
  try {
    const res = await axios.post(`${API_URL}/merchant/oss/file `, f, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `${token}`, // Bearer: ******
      },
    });
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.url, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// ---------------
type TPlanListBody = {
  type?: number[] | null;
  status?: number[] | null;
  page: number;
  count: number;
};
export const getPlanList = async (
  body: TPlanListBody,
  refreshCb: (() => void) | null,
) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post('/merchant/plan/list', body);
    console.log('plan list res: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      // throw new Error('Session expired');
      throw new ExpiredError('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.plans, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getPlanList2 = async (body: TPlanListBody) => {
  return await request.post('/merchant/plan/list', body);
};

// -----------------

export const getPlanDetail = async (planId: number) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post('/merchant/plan/subscription_plan_detail', {
      planId,
    });
    console.log('planDetail res: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      // throw new Error('Session expired');
      throw new ExpiredError('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.Plan, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// 3 calls to get planDetail(with planId), addonList, and metricsList
// "planId: null" means caller want to create a new plan, so I pass a resolved promise to meet the caller fn signature.
export const getPlanDetailWithMore = async (
  planId: number | null,
  refreshCb: (() => void) | null,
) => {
  const session = useSessionStore.getState();
  const planDetailRes =
    planId == null
      ? Promise.resolve([{ data: { data: null, code: 0 } }, null])
      : getPlanDetail(planId);
  const [
    [planDetail, errDetail],
    [addonList, addonErr],
    [metricsList, errMetrics],
  ] = await Promise.all([
    planDetailRes,
    getPlanList({ type: [2], status: [2], page: 0, count: 100 }, null), // type: 2 -> addon, status: 2 -> active
    getMetricsListReq(null),
  ]);
  const err = errDetail || addonErr || errMetrics;
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({ expired: true, refresh: refreshCb });
    }
    return [null, err];
  }

  return [{ planDetail, addonList, metricsList }, null];
};

// create a new plan
/*
export const createPlan = async (planDetail: any) => {
  return await request.post(
    '/merchant/plan/subscription_plan_create',
    planDetail,
  );
};
*/

// create a new or save an existing plan
export const savePlan = async (planDetail: any, isNew: boolean) => {
  const url = isNew
    ? '/merchant/plan/subscription_plan_create'
    : `/merchant/plan/subscription_plan_edit`;
  return await request.post(url, planDetail);
};

export const activatePlan = async (planId: number) => {
  return await request.post(`/merchant/plan/subscription_plan_activate`, {
    planId,
  });
};

export const togglePublishReq = async ({
  planId,
  publishAction,
}: {
  planId: number;
  publishAction: 'PUBLISH' | 'UNPUBLISH';
}) => {
  const url = `/merchant/plan/subscription_plan_${
    publishAction === 'PUBLISH' ? 'publish' : 'unpublished'
  }`;
  return await request.post(url, { planId });
};

export const getMetricsListReq = async (refreshCb: null | (() => void)) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(
      `/merchant/merchant_metric/merchant_metric_list`,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      // throw new ExpiredError('Session expired');
      throw new ExpiredError('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.merchantMetrics, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// --------
type TMetricsBody = {
  // for edit
  metricId: number;
  metricName: string;
  metricDescription: string;
};
type TMetricsBodyNew = {
  // for creation
  code: string;
  metricName: string;
  metricDescription: string;
  aggregationType: number;
  aggregationProperty: number;
};
export const saveMetricsReq = async (
  body: TMetricsBody | TMetricsBodyNew,
  isNew: boolean,
) => {
  const url = isNew
    ? `/merchant/merchant_metric/new_merchant_metric`
    : `/merchant/merchant_metric/edit_merchant_metric`;
  return await request.post(url, body);
};
/*
export const updateMetricsReq = async (body: TMetricsBody) => {
  return await request.post(
    `/merchant/merchant_metric/edit_merchant_metric`,
    body,
  );
};

export const createMetricsReq = async (metrics: any) => {
  return await request.post(
    `/merchant/merchant_metric/new_merchant_metric`,
    metrics,
  );
};
*/
// ---------

export const getMetricDetailReq = async (
  metricId: number,
  refreshCb: () => void,
) => {
  try {
    const res = await request.post(
      `/merchant/merchant_metric/merchant_metric_detail`,
      {
        metricId,
      },
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.merchantMetric, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// ----------
type TSubListReq = {
  status: number[];
  page: number;
  count: number;
};
export const getSublist = async (body: TSubListReq, refreshCb: () => void) => {
  try {
    const res = await request.post(`/merchant/subscription/list`, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.subscriptions, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};
// ------------

export const getSubDetail = async (subscriptionId: string) => {
  try {
    const res = await request.post(`/merchant/subscription/detail`, {
      subscriptionId,
    });
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new ExpiredError('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getSubDetailWithMore = async (
  subscriptionId: string,
  refreshCb: (() => void) | null,
) => {
  const [[subDetail, errSubDetail], [planList, errPlanList]] =
    await Promise.all([
      getSubDetail(subscriptionId),
      getPlanList(
        {
          type: [1], // main plan
          status: [2], // active
          page: 0,
          count: 100,
        },
        null,
      ),
    ]);
  const err = errSubDetail || errPlanList;
  if (null != err) {
    if (err instanceof ExpiredError) {
      session.setSession({ expired: true, refresh: refreshCb });
    }
    return [null, err];
  }
  return [{ subDetail, planList }, null];
};

// new user has choosen a sub plan, but not paid yet, before the payment due date, user and admin can cancel it.
// this fn is for this purpose only, this call only work for sub.status == created.
// it's not the same as terminate an active sub,
export const cancelSubReq = async (subscriptionId: string) => {
  return await request.post(`/merchant/subscription/subscription_cancel`, {
    subscriptionId,
  });
};

export const createPreviewReq = async (
  subscriptionId: string,
  newPlanId: number,
  addons: { quantity: number; addonPlanId: number }[],
) => {
  return await request.post(
    `/merchant/subscription/subscription_update_preview`,
    {
      subscriptionId,
      newPlanId,
      quantity: 1,
      addonParams: addons,
    },
  );
};

export const updateSubscription = async (
  subscriptionId: string,
  newPlanId: number,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  prorationDate: number,
) => {
  return await request.post(
    `/merchant/subscription/subscription_update_submit`,
    {
      subscriptionId,
      newPlanId,
      quantity: 1,
      addonParams: addons,
      confirmTotalAmount,
      confirmCurrency,
      prorationDate,
    },
  );
};

// terminate the subscription, immediate: true -> now, immediate: false -> at the end of this billing cycle
export const terminateSub = async (
  SubscriptionId: string,
  immediate: boolean,
) => {
  const body: {
    SubscriptionId: string;
    invoiceNow?: boolean;
    prorate?: boolean;
  } = {
    SubscriptionId,
  };
  let url = `/merchant/subscription/subscription_cancel_at_period_end`;
  if (immediate) {
    body.invoiceNow = true;
    body.prorate = true;
    url = `/merchant/subscription/subscription_cancel`;
  }
  return await request.post(url, body);
};

// resume subscription for case that it's been terminated at the end of this billing cycle.
// if it's ended immediately, no resume allowed.
export const resumeSub = async (subscriptionId: string) => {
  const url = `/merchant/subscription/subscription_cancel_last_cancel_at_period_end`;
  return await request.post(url, {
    subscriptionId,
  });
};

// -------------
type TGetSubTimelineReq = {
  userId: number;
  page: number;
  count: number;
};
export const getSubTimeline = async (body: TGetSubTimelineReq) => {
  return await request.post(`/merchant/subscription/timeline_list`, body);
};
export const getSubTimeline2 = async (body: TGetSubTimelineReq) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post(
      `/merchant/subscription/timeline_list`,
      body,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.subscriptionTimeLines, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};
// -----------

export const getCountryList = async () => {
  const merchantStore = useMerchantInfoStore.getState();
  return await request.post(`/merchant/vat/country_list`, {
    merchantId: merchantStore.id,
  });
};
export const getCountryList2 = async () => {
  const merchantStore = useMerchantInfoStore.getState();
  const session = useSessionStore.getState();
  try {
    const res = await request.post(`/merchant/vat/country_list`, {
      merchantId: merchantStore.id,
    });
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.vatCountryList, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const extendDueDate = async (
  subscriptionId: string,
  appendTrialEndHour: number,
) => {
  return await request.post(
    `/merchant/subscription/subscription_add_new_trial_start`,
    { subscriptionId, appendTrialEndHour },
  );
};

export const setSimDateReq = async (
  subscriptionId: string,
  newTestClock: number,
) => {
  return await request.post(
    `/system/subscription/subscription_test_clock_walk`,
    { subscriptionId, newTestClock },
  );
};

// billing admin can also get user profile.
export const getUserProfile = async (userId: number, refreshCb: () => void) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(
      // `/merchant/merchant_user/get_user_profile?userId=${userId}`,
      `/merchant/user/get`,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    console.log('get usr profile: ', res);
    return [res.data.data.user, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// billing admin can also update user profile.
export const saveUserProfile = async (newProfile: IProfile) => {
  const u = JSON.parse(JSON.stringify(newProfile));
  u.userId = newProfile.id;
  return await request.post(`/merchant/merchant_user/update_user_profile`, u);
};
export const saveUserProfile2 = async (newProfile: IProfile) => {
  const session = useSessionStore.getState();
  const u = JSON.parse(JSON.stringify(newProfile));
  u.userId = newProfile.id;
  try {
    const res = await request.post(
      `/merchant/merchant_user/update_user_profile`,
      u,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [null, null]; // this call has no meaningful result to return
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const appSearchReq = async (searchKey: string) => {
  return await request.post(`/merchant/search/key_search`, {
    searchKey,
  });
};

// ----------
type TGetInvoicesReq = {
  userId?: number;
  page: number;
  count: number;
  firstName?: string;
  lastName?: string;
  currency?: string;
  status?: number[];
  amountStart?: number;
  amountEnd?: number;
};
export const getInvoiceList = async (body: TGetInvoicesReq) => {
  return await request.post(
    `/merchant/invoice/subscription_invoice_list`,
    body,
  );
};
// ----------

export const getInvoiceDetailReq = async (invoiceId: string) => {
  return await request.post(`/merchant/invoice/subscription_invoice_detail`, {
    invoiceId,
  });
};

// ------------
type TCreateInvoiceReq = {
  name: string;
  userId: number;
  currency: string;
  taxScale: number;
  invoiceItems: TInvoiceItems[];
  lines?: TInvoiceItems[];
  finish: boolean;
};
type TInvoiceItems = {
  unitAmountExcludingTax: number;
  description: string;
  quantity: number;
};
// admin manually create an invoice, still editable until the publishInvoice() is called.
// before that, customers won't see(or receive) this invoice.
export const createInvoice = async (body: TCreateInvoiceReq) => {
  body.lines = body.invoiceItems;
  return await request.post(`/merchant/invoice/new_invoice_create`, body);
};
// -------------

// before publish, admin can still edit and save.
type TSaveInvoiceReq = {
  invoiceId: string;
  taxScale: number;
  currency: string;
  name: string;
  invoiceItems: TInvoiceItems[];
  lines?: TInvoiceItems[];
};
export const saveInvoice = async (body: TSaveInvoiceReq) => {
  body.lines = body.invoiceItems;
  return await request.post(`/merchant/invoice/new_invoice_edit`, body);
};

// admin can delete the invoice, before the following publishInvoice() is called
export const deleteInvoice = async (invoiceId: string) => {
  return await request.post(`/merchant/invoice/new_invoice_delete`, {
    invoiceId,
  });
};

// after publish, user will receive an email informing him/her to finish the payment.
// admin cannot edit it anymore, but can cancel it by calling the following revokeInvoice() before user finish the payment
type TPublishInvoiceReq = {
  invoiceId: string;
  payMethod: number;
  daysUtilDue: number;
};
export const publishInvoice = async (body: TPublishInvoiceReq) => {
  return await request.post(`/merchant/invoice/finish_new_invoice`, body);
};

// admin can cancel the invoice(make it invalid) before user make the payment.
export const revokeInvoice = async (invoiceId: string) => {
  return await request.post(`/merchant/invoice/cancel_processing_invoice`, {
    invoiceId,
  });
};

// TODO: let caller do the amt convert.
export const refund = async (
  body: {
    invoiceId: string;
    refundAmount: number;
    reason: string;
  },
  currency: string,
) => {
  body.refundAmount *= CURRENCY[currency].stripe_factor;
  body.refundAmount = Math.round(body.refundAmount);
  return await request.post(`/merchant/invoice/new_invoice_refund`, body);
};

export const sendInvoiceInMailReq = async (invoiceId: string) => {
  return await request.post(
    `/merchant/invoice/subscription_invoice_send_user_email`,
    { invoiceId },
  );
};

export const downloadInvoice = (url: string) => {
  if (url == null || url == '') {
    return;
  }
  axios({
    url,
    method: 'GET',
    responseType: 'blob',
  }).then((response) => {
    const href = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', 'invoice.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  });
};

// ------------------
type TUserList = {
  merchantId: number;
  userId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: number[];
  page: number;
  count: number;
};
export const getUserListReq = async (
  users: TUserList,
  refreshCb: () => void,
) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post(`/merchant/merchant_user/user_list`, users);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.userAccounts, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getEventListReq = async () => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(
      `/merchant/merchant_webhook/webhook_event_list`,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.eventList, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getWebhookListReq = async (refreshCb: () => void) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(
      `/merchant/merchant_webhook/webhook_endpoint_list`,
    );
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.endpointList, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

// used for both creation and update
export const saveWebhookReq = async ({
  url,
  events,
  endpointId,
}: {
  url: string;
  events: string[];
  endpointId?: number;
}) => {
  const session = useSessionStore.getState();
  try {
    const actionUrl =
      endpointId == null
        ? '/merchant/merchant_webhook/new_webhook_endpoint'
        : '/merchant/merchant_webhook/update_webhook_endpoint';
    const body: any = { url, events };
    if (endpointId != null) {
      body.endpointId = endpointId;
    }
    const res = await request.post(actionUrl, body);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [null, null]; // this call has no meaningful result
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const deleteWebhookReq = async (endpointId: number) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.post(
      '/merchant/merchant_webhook/delete_webhook_endpoint',
      { endpointId },
    );
    console.log('delete webhook res: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: null });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [null, null]; // this call has no meaningful result
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const getWebhookLogs = async (
  {
    endpointId,
    page,
    count,
  }: { endpointId: number; page: number; count: number },
  refreshCb: null | (() => void),
) => {
  const session = useSessionStore.getState();
  try {
    const res = await request.get(
      `/merchant/merchant_webhook/webhook_endpoint_log_list?endpointId=${endpointId}&page=${page}&count=${count}`,
    );
    console.log('webhook logs: ', res);
    if (res.data.code == 61) {
      session.setSession({ expired: true, refresh: refreshCb });
      throw new Error('Session expired');
    }
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data.endpointLogList ?? [], null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};
