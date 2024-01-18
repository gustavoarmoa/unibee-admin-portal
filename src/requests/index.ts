import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import { useProfileStore } from "../stores";
import { IProfile } from "../shared.types";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

export const getPlanList = async (planType: number) => {
  const token = localStorage.getItem("merchantToken");
  return axios.post(
    `${API_URL}/merchant/plan/subscription_plan_list`,
    {
      merchantId: 15621,
      type: planType, // 1: main plan, 2: addon
      status: 2, // 1: editing, 2: active, 3: inactive, 4: expired
      // currency: "usd",
      page: 0,
      count: 100,
    },
    {
      headers: {
        Authorization: `${token}`, // Bearer: ******
      },
    }
  );
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

// terminate the subscription at the end of this billing cycle
export const terminateSub = async (SubscriptionId: string) => {
  const token = localStorage.getItem("merchantToken");
  const body = {
    SubscriptionId,
  };
  return await axios.post(
    `${API_URL}/user/subscription/subscription_cancel_at_period_end`,
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

// billing admin can also update user profile, not implemented yet.
export const saveProfile = async (newProfile: IProfile) => {
  const token = localStorage.getItem("merchantToken");
  return await axios.post(`${API_URL}/user/profile`, newProfile, {
    headers: {
      Authorization: `${token}`, // Bearer: ******
    },
  });
};
