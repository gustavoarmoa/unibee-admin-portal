import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import { useProfileStore } from "../stores";

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
