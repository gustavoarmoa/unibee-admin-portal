import axios from "axios";
// import { useProfileStore } from "../stores";
import { IProfile, TMerchantInfo } from "../shared.types";
import { CURRENCY } from "../constants";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

export const passwordloginReq = async (email: string, password: string) => {
  return await axios.post(`${API_URL}/merchant/auth/sso/login`, {
    email,
    password,
  });
};

export const otpLoginReq = async (email: string) =>
  await axios.post(`${API_URL}/merchant/auth/sso/loginOTP`, { email });

export const otpLoginVerifyReq = async (
  email: string,
  verificationCode: string
) => {
  return await axios.post(`${API_URL}/merchant/auth/sso/loginOTPVerify`, {
    email,
    verificationCode,
  });
};

export const logoutReq = async () => {
  const token = localStorage.getItem("merchantToken");
  return await axios.post(
    `${API_URL}/merchant/user_logout`,
    {},
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

/*
export const getProfileReq = async () => {
  const token = localStorage.getItem("merchantToken");
  return await axios.get(`${API_URL}/merchant/profile`, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};
*/

/*
export const updateProfileReq = async () => {

}
*/

export const getMerchantInfoReq = async () => {
  const token = localStorage.getItem("merchantToken");
  return await axios.get(`${API_URL}/merchant/merchant_info/info`, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

export const updateMerchantInfoReq = async (body: TMerchantInfo) => {
  const token = localStorage.getItem("merchantToken");
  return await axios.post(`${API_URL}/merchant/merchant_info/update`, body, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

export const uploadLogoReq = async (f: FormData) => {
  const token = localStorage.getItem("merchantToken");
  return await axios.post(`${API_URL}/merchant/oss/file `, f, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

export const getPlanList = async ({
  type,
  status,
}: {
  type?: number;
  status?: number;
}) => {
  const token = localStorage.getItem("merchantToken");
  const body: {
    merchantId: number;
    type?: number;
    status?: number;
    page: number;
    count: number;
  } = {
    merchantId: 15621,
    // currency: "usd",
    page: 0,
    count: 100,
  };
  if (type != null) {
    body.type = type; // null: all types, 1: main plan, 2: addon
  }
  if (status != null) {
    body.status = status; // 1: editing, 2: active, 3: inactive, 4: expired
  }
  return axios.post(`${API_URL}/merchant/plan/subscription_plan_list`, body, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

export const getPlanDetail = async (planId: number) => {
  const token = localStorage.getItem("merchantToken");
  return await axios.post(
    `${API_URL}/merchant/plan/subscription_plan_detail`,
    {
      planId,
    },
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const createPlan = async (planDetail: any) => {
  const token = localStorage.getItem("merchantToken");
  return await axios.post(
    `${API_URL}/merchant/plan/subscription_plan_create`,
    planDetail,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const savePlan = async (planDetail: any) => {
  const token = localStorage.getItem("merchantToken");
  return await axios.post(
    `${API_URL}/merchant/plan/subscription_plan_edit`,
    planDetail,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const activatePlan = async (planId: number) => {
  const token = localStorage.getItem("merchantToken");
  const body = { planId };
  return await axios.post(
    `${API_URL}/merchant/plan/subscription_plan_activate`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const togglePublishReq = async ({
  planId,
  publishAction,
}: {
  planId: number;
  publishAction: "PUBLISH" | "UNPUBLISH";
}) => {
  // 1: to publish, 0: to unpublish
  const token = localStorage.getItem("merchantToken");
  const body = { planId };
  const url = `${API_URL}/merchant/plan/subscription_plan_${
    publishAction === "PUBLISH" ? "publish" : "unpublished"
  }`;
  return await axios.post(url, body, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

export const getSublist = async () => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    merchantId: 15621,
    // userId: 0,
    // status: 0,
    // sortField: "string",
    // sortType: "string",
    page: 0,
    count: 100,
  };
  return await axios.post(
    `${API_URL}/merchant/subscription/subscription_list`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
  /**
     * {
  "merchantId": 0,
  "userId": 0,
  "status": 0,
  "sortField": "string",
  "sortType": "string",
  "page": 0,
  "count": 0
}
     */
};

export const getSubDetail = async (subscriptionId: string) => {
  const token = localStorage.getItem("merchantToken");
  const body = { subscriptionId };
  return await axios.post(
    `${API_URL}/merchant/subscription/subscription_detail`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

// new user has choosen a sub plan, but not paid yet, befoer the payment due date, user and admin can cancel it
// this fn is for this purpose only, it's not the same as terminate an active sub, this call only work for sub.status == created
export const cancelSubReq = async (subscriptionId: string) => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    subscriptionId,
  };
  return await axios.post(
    `${API_URL}/merchant/subscription/subscription_cancel`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const createPreviewReq = async (
  subscriptionId: string,
  newPlanId: number,
  addons: { quantity: number; addonPlanId: number }[]
) => {
  const token = localStorage.getItem("merchantToken");
  // isNew: true: create new subscription, false: update existing sub
  /*
  const urlPath = isNew
    ? "subscription_create_preview"
    : "subscription_update_preview";
  */
  const body = {
    subscriptionId,
    newPlanId,
    quantity: 1,
    // channelId: 25,
    addonParams: addons,
  };
  return await axios.post(
    `${API_URL}/merchant/subscription/subscription_update_preview`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const updateSubscription = async (
  subscriptionId: string,
  newPlanId: number,
  addons: { quantity: number; addonPlanId: number }[],
  confirmTotalAmount: number,
  confirmCurrency: string,
  prorationDate: number
) => {
  const token = localStorage.getItem("merchantToken");
  // "subscription_create_submit"
  const body = {
    subscriptionId,
    newPlanId,
    quantity: 1,
    addonParams: addons,
    confirmTotalAmount,
    confirmCurrency,
    prorationDate,
  };
  return await axios.post(
    `${API_URL}/merchant/subscription/subscription_update_submit`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

// terminate the subscription, immediate: true -> now, immediate: false -> at the end of this billing cycle
export const terminateSub = async (
  SubscriptionId: string,
  immediate: boolean
) => {
  const token = localStorage.getItem("merchantToken");
  const body: {
    SubscriptionId: string;
    invoiceNow?: boolean;
    prorate?: boolean;
  } = {
    SubscriptionId,
  };
  let url = `${API_URL}/merchant/subscription/subscription_cancel_at_period_end`;
  if (immediate) {
    body.invoiceNow = true;
    body.prorate = true;
    url = `${API_URL}/merchant/subscription/subscription_cancel`;
  }
  return await axios.post(url, body, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

// resume subscription, if it's been terminated on end of this billing cycle.
// if it's ended immediately, no resume allowed
export const resumeSub = async (subscriptionId: string) => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    subscriptionId,
  };
  const url = `${API_URL}/merchant/subscription/subscription_cancel_last_cancel_at_period_end`;
  return await axios.post(url, body, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

export const getSubTimeline = async ({ userId }: { userId: number }) => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    merchantId: 15621,
    userId,
    // "sortField": "string",
    // "sortType": "string",
    page: 0,
    count: 100,
  };
  return await axios.post(
    `${API_URL}/merchant/subscription/subscription_timeline_list`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const getCountryList = async (merchantId: number) => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    merchantId,
  };
  return await axios.post(`${API_URL}/merchant/vat/vat_country_list`, body, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

export const extendDueDate = async (
  subscriptionId: string,
  appendTrialEndHour: number
) => {
  const token = localStorage.getItem("merchantToken");
  const body = { subscriptionId, appendTrialEndHour };
  return await axios.post(
    `${API_URL}/merchant/subscription/subscription_add_new_trial_start`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

// billing admin can also get user profile.
export const getUserProfile = async (userId: number) => {
  const token = localStorage.getItem("merchantToken");
  return await axios.get(
    `${API_URL}/merchant/merchant_user/get_user_profile?userId=${userId}`,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

// billing admin can also update user profile.
export const saveUserProfile = async (newProfile: IProfile) => {
  const u = JSON.parse(JSON.stringify(newProfile));
  u.userId = newProfile.id;
  const token = localStorage.getItem("merchantToken");
  return await axios.post(
    `${API_URL}/merchant/merchant_user/update_user_profile`,
    u,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const appSearchReq = async (searchKey: string) => {
  const body = {
    merchantId: 15621,
    searchKey,
  };
  const token = localStorage.getItem("merchantToken");
  return await axios.post(`${API_URL}/merchant/search/key_search`, body, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};

export const getInvoiceList = async ({
  userId,
  page = 0,
  count = 10,
}: {
  userId?: number;
  page: number;
  count?: number;
}) => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    merchantId: 15621,
    userId,
    /*
    "sendEmail": 0,
    "sortField": "string",
    "sortType": "string",
    "deleteInclude": true,
    */
    page,
    count,
  };

  return await axios.post(
    `${API_URL}/merchant/invoice/subscription_invoice_list`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

type TInvoiceItems = {
  unitAmountExcludingTax: number;
  description: string;
  quantity: number;
};
// admin manually create an invoice, still editable until the following publishInvoice() is called.
// before that, users won't see(or receive) this invoice.
export const createInvoice = async ({
  name,
  userId,
  currency,
  taxScale,
  invoiceItems,
  finish,
}: {
  name: string;
  userId: number;
  currency: string;
  taxScale: number;
  invoiceItems: TInvoiceItems[];
  finish: boolean;
}) => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    merchantId: 15621,
    userId,
    taxScale,
    channelId: 25,
    currency,
    name,
    lines: invoiceItems,
    finish,
  };
  return await axios.post(
    `${API_URL}/merchant/invoice/new_invoice_create`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

// before publish, admin can still edit.
export const saveInvoice = async ({
  invoiceId,
  taxScale,
  currency,
  name,
  invoiceItems,
}: {
  invoiceId: string;
  taxScale: number;
  currency: string;
  name: string;
  invoiceItems: TInvoiceItems[];
}) => {
  const body = {
    invoiceId,
    taxScale,
    channelId: 25,
    currency,
    name,
    lines: invoiceItems,
  };
  const token = localStorage.getItem("merchantToken");
  return await axios.post(
    `${API_URL}/merchant/invoice/new_invoice_edit`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

// admin can delete the invoice, before the following publishInvoice() is called
export const deleteInvoice = async (invoiceId: string) => {
  const token = localStorage.getItem("merchantToken");
  const body = { invoiceId };
  return await axios.post(
    `${API_URL}/merchant/invoice/new_invoice_delete`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

// after publish, user will receive an email informing him/her to make the payment.
// admin cannot edit it anymore, but can cancel it by calling the following cancelInvoice() before user make the payment
export const publishInvoice = async ({
  invoiceId,
  payMethod,
  daysUtilDue,
}: {
  invoiceId: string;
  payMethod: number;
  daysUtilDue: number;
}) => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    invoiceId,
    payMethod,
    daysUtilDue,
  };
  return await axios.post(
    `${API_URL}/merchant/invoice/finish_new_invoice`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

// admin can cancel the invoice(make it invalid) before user make the payment.
export const revokeInvoice = async (invoiceId: string) => {
  const token = localStorage.getItem("merchantToken");
  const body = { invoiceId };
  return await axios.post(
    `${API_URL}/merchant/invoice/cancel_processing_invoice`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const refund = async (
  body: {
    invoiceId: string;
    refundAmount: number;
    reason: string;
  },
  currency: string
) => {
  body.refundAmount *= CURRENCY[currency].stripe_factor;
  body.refundAmount = Math.round(body.refundAmount);
  const token = localStorage.getItem("merchantToken");
  return await axios.post(
    `${API_URL}/merchant/invoice/new_invoice_refund`,
    body,
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};

export const downloadInvoice = (url: string) => {
  if (url == null || url == "") {
    return;
  }
  axios({
    url,
    method: "GET",
    responseType: "blob", // important
  }).then((response) => {
    // create file link in browser's memory
    const href = URL.createObjectURL(response.data);

    // create "a" HTML element with href to file & click
    const link = document.createElement("a");
    link.href = href;
    link.setAttribute("download", "invoice.pdf"); //or any other extension
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  });
};

export const searchUserReq = async () => {
  const token = localStorage.getItem("merchantToken");
  return await axios.post(
    `${API_URL}/merchant/merchant_user/user_search`,
    { merchantId: 15621 },
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
};
