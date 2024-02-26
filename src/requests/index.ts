import axios from 'axios';
// import { useProfileStore } from "../stores";
import { CURRENCY } from '../constants';
import { IBillableMetrics, IProfile, TMerchantInfo } from '../shared.types';
import { useAppConfigStore } from '../stores';
import { request } from './client';

const API_URL = import.meta.env.VITE_API_URL;

type TPassLogin = {
  email: string;
  password: string;
};
export const loginWithPasswordReq = async (body: TPassLogin) => {
  try {
    const res = await request.post('/merchant/auth/sso/login', body);
    console.log('login withh pass res: ', res);
    if (res.data.code != 0) {
      throw new Error(res.data.message);
    }
    return [res.data.data, null];
  } catch (err) {
    let e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export const loginWithOTPReq = async (email: string) => {
  return await request.post(`/merchant/auth/sso/loginOTP`, { email });
};

export const loginWithOTPVerifyReq = async (
  email: string,
  verificationCode: string,
) => {
  return await request.post(`/merchant/auth/sso/loginOTPVerify`, {
    email,
    verificationCode,
  });
};

export const forgetPassReq = async (email: string) => {
  return await request.post(`/merchant/auth/sso/passwordForgetOTP`, {
    email,
  });
};

export const forgetPassVerifyReq = async (
  email: string,
  verificationCode: string,
  newPassword: string,
) => {
  return await request.post(`/merchant/auth/sso/passwordForgetOTPVerify`, {
    email,
    verificationCode,
    newPassword,
  });
};

export const resetPassReq = async (
  oldPassword: string,
  newPassword: string,
) => {
  return await request.post(`/merchant/passwordReset`, {
    oldPassword,
    newPassword,
  });
};

export const logoutReq = async () => {
  return await request.post(`/merchant/user_logout`, {});
};

export const getAppConfigReq = async () => {
  return await request.post(`/system/merchant/merchant_information`);
};

export const getMerchantInfoReq = async () => {
  return await request.get(`/merchant/merchant_info/info`);
};

export const updateMerchantInfoReq = async (body: TMerchantInfo) => {
  return await request.post(`/merchant/merchant_info/update`, body);
};

export const uploadLogoReq = async (f: FormData) => {
  const token = localStorage.getItem('merchantToken');
  return await axios.post(`${API_URL}/merchant/oss/file `, f, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

// ---------------
type TPlanListBody = {
  merchantId?: number;
  type?: number;
  status?: number;
  page: number;
  count: number;
};
export const getPlanList = async (body: TPlanListBody) => {
  const appConfig = useAppConfigStore.getState();
  body.merchantId = appConfig.MerchantId;
  return await request.post('/merchant/plan/subscription_plan_list', body);
};
// -----------------

export const getPlanDetail = async (planId: number) => {
  return await request.post('/merchant/plan/subscription_plan_detail', {
    planId,
  });
};

// create a new plan
export const createPlan = async (planDetail: any) => {
  return await request.post(
    '/merchant/plan/subscription_plan_create',
    planDetail,
  );
};

// save an existing plan
export const savePlan = async (planDetail: any) => {
  return await request.post(
    `/merchant/plan/subscription_plan_edit`,
    planDetail,
  );
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

export const getMetricsListReq = async () => {
  const appConfig = useAppConfigStore.getState();
  return await request.get(
    `/merchant/merchant_metric/merchant_metric_list?merchantId=${appConfig.MerchantId}`,
  );
};

export const createMetricsReq = async (metrics: any) => {
  const appConfig = useAppConfigStore.getState();
  metrics.merchantId = appConfig.MerchantId;
  return await request.post(
    `/merchant/merchant_metric/new_merchant_metric`,
    metrics,
  );
};

// --------
type TMetricsBody = {
  metricId: number;
  metricName: string;
  metricDescription: string;
};
export const updateMetricsReq = async (body: TMetricsBody) => {
  return await request.post(
    `/merchant/merchant_metric/edit_merchant_metric`,
    body,
  );
};
// ---------

export const getMetricDetailReq = async (metricId: number) => {
  return await request.post(
    `/merchant/merchant_metric/merchant_metric_detail`,
    { metricId },
  );
};

// ----------
type TSubListReq = {
  merchantId?: number;
  status: number[];
  page: number;
  count: number;
};
export const getSublist = async (body: TSubListReq) => {
  const appConfig = useAppConfigStore.getState();
  body.merchantId = appConfig.MerchantId;
  return await request.post(`/merchant/subscription/subscription_list`, body);
};
// ------------

export const getSubDetail = async (subscriptionId: string) => {
  return await request.post(`/merchant/subscription/subscription_detail`, {
    subscriptionId,
  });
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
  merchantId?: number;
};
export const getSubTimeline = async (body: TGetSubTimelineReq) => {
  const appConfig = useAppConfigStore.getState();
  body.merchantId = appConfig.MerchantId;
  return await request.post(
    `/merchant/subscription/subscription_timeline_list`,
    body,
  );
};
// -----------

export const getCountryList = async () => {
  const appConfig = useAppConfigStore.getState();
  return await request.post(`/merchant/vat/vat_country_list`, {
    merchantId: appConfig.MerchantId,
  });
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
export const getUserProfile = async (userId: number) => {
  return await request.get(
    `/merchant/merchant_user/get_user_profile?userId=${userId}`,
  );
};

// billing admin can also update user profile.
export const saveUserProfile = async (newProfile: IProfile) => {
  const u = JSON.parse(JSON.stringify(newProfile));
  u.userId = newProfile.id;
  return await request.post(`/merchant/merchant_user/update_user_profile`, u);
};

export const appSearchReq = async (searchKey: string) => {
  const appConfig = useAppConfigStore.getState();
  return await request.post(`/merchant/search/key_search`, {
    merchantId: appConfig.MerchantId,
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
  merchantId?: number;
};
export const getInvoiceList = async (body: TGetInvoicesReq) => {
  const appConfig = useAppConfigStore.getState();
  body.merchantId = appConfig.MerchantId;
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
  merchantId?: number;
  name: string;
  userId: number;
  currency: string;
  taxScale: number;
  invoiceItems: TInvoiceItems[];
  lines?: TInvoiceItems[];
  finish: boolean;
  gatewayId?: number;
};
type TInvoiceItems = {
  unitAmountExcludingTax: number;
  description: string;
  quantity: number;
};
// admin manually create an invoice, still editable until the publishInvoice() is called.
// before that, customers won't see(or receive) this invoice.
export const createInvoice = async (body: TCreateInvoiceReq) => {
  const appConfig = useAppConfigStore.getState();
  body.merchantId = appConfig.MerchantId;
  body.lines = body.invoiceItems;
  body.gatewayId = 25;
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
  gatewayId?: number;
};
export const saveInvoice = async (body: TSaveInvoiceReq) => {
  body.lines = body.invoiceItems;
  body.gatewayId = 25;
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
export const getUserListReq = async (users: TUserList) => {
  return await request.post(`/merchant/merchant_user/user_list`, users);
};
// -----------------
