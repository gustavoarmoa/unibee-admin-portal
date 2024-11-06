import axios from 'axios'
import { Merchant } from 'unibee-ts-client'
import { prepareAxiosInstance } from './apiClient'

export const merchant = new Merchant()

export const request = prepareAxiosInstance(
  axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 60000
  })
)

export const analyticsRequest = prepareAxiosInstance(
  axios.create({
    baseURL: import.meta.env.VITE_ANALYTICS_API_URL,
    timeout: 60000
  })
)

prepareAxiosInstance(merchant.instance)
