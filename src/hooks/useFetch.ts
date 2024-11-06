import { AxiosResponse } from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { safeRun } from '../utils'
import { useCache } from './useCache'

interface DataSetterOptions<T> {
  optimistic: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateRemoteSourceFunction: (payload: any, data: T) => Promise<T>
  onError: (err: Error) => void
  // The useFetch hook use the url as the cache key by default
  // But if you want to use a different cache key or use useClientFetch, you can pass a cacheKey
  cacheKey: string
}

export function useFetch<T, U extends string | undefined>(
  url: U,
  fetcher: (url: U) => Promise<T>,
  options?: Partial<DataSetterOptions<T>>
) {
  const [error, setError] = useState<Error | undefined>()
  const [loading, setLoading] = useState(true)
  const [cachedData, setCachedData] = useCache<T>(url ?? options?.cacheKey)

  const fetchData = useCallback(
    async (fetcher: () => Promise<T>, isOptimistic?: boolean) => {
      if (!isOptimistic) {
        setLoading(true)
      }

      const [_, err] = await safeRun(async () => {
        const res = await fetcher()

        setCachedData(res)
      })

      if (err !== null) {
        setError(err)
        options?.onError?.(err)
      }

      setLoading(false)
    },
    [url]
  )

  const setData = useCallback(
    async (data: T, payload?: unknown) => {
      setCachedData(data)

      if (options?.optimistic && options?.updateRemoteSourceFunction) {
        fetchData(
          () => options.updateRemoteSourceFunction!(payload, data),
          options.optimistic
        )
      }
    },
    [fetchData, options]
  )

  useEffect(() => {
    fetchData(() => fetcher(url))
  }, [fetchData, url])

  return { data: cachedData, error, loading, setData }
}

// Axios usually return a response object with a data property
// useAxiosFetch is a wrapper around useFetch that automatically extracts the data property
export const useAxiosFetch = <T>(
  url: string,
  fetcher: (url: string) => Promise<T>,
  options?: Partial<DataSetterOptions<T>>
) =>
  useFetch<T, string>(
    url,
    async (url) => {
      const { data } = (await fetcher(url)) as AxiosResponse<T>

      return data
    },
    options
  )

interface useClientFetchOptions {
  unwrapData?: boolean
}

// useClientFetch is a wrapper around useFetch that doesn't require a url
// This hook is useful when you want to fetch data by API client
// It's worth noting that useClientFetch doesn't cache anything, if you want
// cache the data, you can pass custom cache key to the options
export const useClientFetch = <
  T,
  O extends Partial<DataSetterOptions<T> & useClientFetchOptions>
>(
  fetcher: () => Promise<T>,
  options?: O
) => {
  type Res = O extends { unwrapData?: false }
    ? T
    : T extends { data?: infer U }
      ? U
      : T

  return useFetch<Res, undefined>(
    undefined,
    async () => {
      const res = await fetcher()

      return (
        (options?.unwrapData ?? true) ? (res as { data: T }).data : res
      ) as Res
    },
    options as Partial<DataSetterOptions<Res> & useClientFetchOptions>
  )
}
