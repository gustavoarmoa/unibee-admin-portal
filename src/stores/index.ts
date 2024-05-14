import { StoreApi, UseBoundStore, create } from 'zustand'
// import { immer } from "zustand/middleware/immer";
import { createJSONStorage, persist } from 'zustand/middleware'
import { IAppConfig, IProfile, TMerchantInfo } from '../shared.types.d'
// import { createStore } from "zustand";

// logged-in user profile
const INITIAL_PROFILE: IProfile = {
  address: '',
  companyName: '',
  email: '',
  mobile: '',
  facebook: '',
  firstName: '',
  lastName: '',
  countryCode: '',
  countryName: '',
  createTime: 0,
  id: null,
  phone: '',
  paymentMethod: '',
  linkedIn: '',
  telegram: '',
  tikTok: '',
  vATNumber: '',
  weChat: '',
  whatsAPP: '',
  otherSocialInfo: '',
  token: ''
}

interface ProfileSlice extends IProfile {
  getProfile: () => IProfile
  setProfile: (p: IProfile) => void
  reset: () => void
  // setProfileField: (field: string, value: any) => void;
}

export const useProfileStore = create<ProfileSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_PROFILE,
      getProfile: () => get(),
      setProfile: (p) => set({ ...p }),
      reset: () => set(INITIAL_PROFILE)
    }),
    { name: 'profile' }
  )
)

// the merchant which the current logged-in user is working for
const INITIAL_INFO: TMerchantInfo = {
  id: -1,
  address: '',
  companyId: '',
  companyLogo: '',
  companyName: '',
  email: '',
  location: '',
  phone: ''
}

interface MerchantInfoSlice extends TMerchantInfo {
  getMerchantInfo: () => TMerchantInfo
  setMerchantInfo: (p: TMerchantInfo) => void
  reset: () => void
}

export const useMerchantInfoStore = create<MerchantInfoSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_INFO,
      getMerchantInfo: () => get(),
      setMerchantInfo: (p) => set({ ...p }),
      reset: () => set(INITIAL_INFO)
    }),
    { name: 'merchantInfo' }
  )
)

// --------------------------------
const INITIAL_APP_VALUE: IAppConfig = {
  env: 'local',
  isProd: false,
  supportCurrency: [],
  supportTimeZone: [],
  gateway: []
}

interface AppConfigSlice extends IAppConfig {
  getAppConfig: () => IAppConfig
  setAppConfig: (a: IAppConfig) => void
  setGateway: (g: any) => void
  reset: () => void
}

export const useAppConfigStore = create<AppConfigSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_APP_VALUE,
      getAppConfig: () => get(),
      setAppConfig: (a) => set({ ...a }),
      setGateway: (g: any) => {
        set({ ...get(), gateway: g })
      },
      reset: () => set(INITIAL_APP_VALUE)
    }),
    { name: 'appConfig' }
  )
)

// ---------------
interface ISession {
  expired: boolean
  refresh: null | (() => void) // if session is expired when making an async fn call, save this fn here, so after re-login, re-run this fn
}
const INITIAL_SESSION: ISession = {
  expired: true,
  refresh: null
}
interface SessionStoreSlice extends ISession {
  getSession: () => ISession
  setSession: (s: ISession) => void
  reset: () => void
}

export const useSessionStore = create<SessionStoreSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_SESSION,
      getSession: () => get(),
      setSession: (a) => set({ ...a }),
      reset: () => set(INITIAL_SESSION)
    }),
    { name: 'session' }
  )
)

// --------------------------------
interface IPermission {
  role: string // Owner | Customer Support
  permissions: string[] // not used yet
}
const INITIAL_PERM: IPermission = {
  role: '',
  permissions: []
}
interface PermissionStoreSlice extends IPermission {
  getPerm: () => IPermission
  setPerm: (s: IPermission) => void
  reset: () => void
}
export const usePermissionStore = create<PermissionStoreSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_PERM,
      getPerm: () => get(),
      setPerm: (a) => set({ ...a }),
      reset: () => set(INITIAL_PERM)
    }),
    { name: 'permissions' }
  )
)
