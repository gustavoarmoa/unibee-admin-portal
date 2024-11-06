import { AxiosInstance } from 'axios'

enum ResponseCode {
  SESSION_EXPIRED = 61,
  INVALID_PERMISSION = 62,
  SUCCESS = 0
}

export interface Response<T> {
  data: T
  code: ResponseCode
  message: string
  redirect: string
  requestId: string
}

export const prepareAxiosInstance = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (requestConfig) => {
      const token = localStorage.getItem('merchantToken')

      requestConfig.headers.Authorization = token // to be declared as: `Bearer ${token}`;

      return requestConfig
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  instance.interceptors.response.use(
    (responseConfig) => {
      const { data } = responseConfig

      // If the Content-Type is not application/json, we don't need to check the response
      if (typeof data === 'string') {
        return responseConfig
      }

      if (
        data.code !== ResponseCode.SUCCESS &&
        data.code !== ResponseCode.SESSION_EXPIRED &&
        data.code !== ResponseCode.INVALID_PERMISSION
      ) {
        return Promise.reject(new Error(responseConfig.data.message))
      }

      if (data.code === ResponseCode.INVALID_PERMISSION) {
        window.redirectToLogin = true
      }
      return responseConfig
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  return instance
}
