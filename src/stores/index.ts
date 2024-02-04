import { StoreApi, UseBoundStore } from "zustand";
import { create } from "zustand";
// import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { TMerchantInfo } from "../shared.types";
// import { createStore } from "zustand";

const INITIAL_INFO: TMerchantInfo = {
  id: -1,
  address: "",
  companyId: "",
  companyLogo: "",
  companyName: "",
  email: "",
  location: "",
  phone: "",
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
    { name: "merchantInfo" }
  )
);
