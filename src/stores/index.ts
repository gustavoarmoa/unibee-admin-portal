import { StoreApi, UseBoundStore, create } from 'zustand';
// import { immer } from "zustand/middleware/immer";
import { createJSONStorage, persist } from 'zustand/middleware';
import { IAppConfig, TMerchantInfo } from '../shared.types';
// import { createStore } from "zustand";

const INITIAL_INFO: TMerchantInfo = {
  id: -1,
  address: '',
  companyId: '',
  companyLogo: '',
  companyName: '',
  email: '',
  location: '',
  phone: '',
};

interface MerchantInfoSlice extends TMerchantInfo {
  getMerchantInfo: () => TMerchantInfo;
  setMerchantInfo: (p: TMerchantInfo) => void;
}

export const useMerchantInfoStore = create<MerchantInfoSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_INFO,
      getMerchantInfo: () => get(),
      setMerchantInfo: (p) => set({ ...p }),
    }),
    { name: 'merchantInfo' },
  ),
);

// --------------------------------
const INITIAL_APP_VALUE: IAppConfig = {
  SupportCurrency: [],
  SupportTimeZone: [],
  MerchantId: -1,
  MerchantInfo: INITIAL_INFO,
  Gateway: [],
};

interface AppConfigSlice extends IAppConfig {
  getAppConfig: () => IAppConfig;
  setAppConfig: (a: IAppConfig) => void;
}

export const useAppConfigStore = create<AppConfigSlice>()(
  persist(
    (set, get) => ({
      ...INITIAL_APP_VALUE,
      getAppConfig: () => get(),
      setAppConfig: (a) => set({ ...a }),
    }),
    { name: 'appConfig' },
  ),
);
