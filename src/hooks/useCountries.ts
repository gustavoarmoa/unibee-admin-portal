import { useMemo } from 'react'
import { merchant } from '../requests/client'
import { useClientFetch } from './useFetch'

export const useCountries = () => {
  const { data, ...restStates } = useClientFetch(() =>
    merchant.vatCountryListList()
  )
  const countries = useMemo(() => data?.vatCountryList ?? [], [data])

  return { countries, ...restStates }
}
