interface IProfile {
  address: string;
  // country: string;
  countryCode: string;
  countryName: string;
  companyName: string;
  email: string;
  facebook: string;
  firstName: string;
  lastName: string;
  id: number;
  phone: string;
  paymentMethod: string;
  linkedIn: string;
  telegram: string;
  tikTok: string;
  vATNumber: string;
  weChat: string;
  whatsAPP: string;
  otherSocialInfo: string;
  token: string;
}

type Country = {
  code: string;
  name: string;
};

interface IAddon extends IPlan {
  quantity: number | null;
  checked: boolean;
}

interface IPlan {
  id: number;
  planName: string;
  description: string;
  type: number; // 1: main plan, 2: add-on
  currency: number;
  intervalCount: number;
  intervalUnit: string;
  amount: number;
  status: number; // 1: editing，2: active, 3: inactive，4: expired
  publishStatus: number; // 1: unpublished(not visible to users), 2: published(users could see and choose this plan)
  addons?: IAddon[];
  gmtCreate: string;
  gmtModify: string;
  companyId: number;
  merchantId: number;
}

interface ISubAddon extends IPlan {
  // when update subscription plan, I need to know which addons users have selected,
  // then apply them on the plan
  quantity: number;
  addonPlanId: number;
}

interface ISubscriptionType {
  id: number;
  subscriptionId: string;
  planId: number;
  userId: number;
  status: number;
  firstPayTime: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trialEnd: number; // if it's non-zero (seconds from Epoch): subscription'll end on that date(it should be >= currentPeriodEnd)
  // it's used by admin to extend the next due date.
  cancelAtPeriodEnd: number; // whether this sub will end at the end of billing cycle, 0: false, 1: true
  amount: number;
  currency: string;
  taxScale: number; // 20000 means 20%
  plan: IPlan | undefined; // ?????????? why it can be undefined.
  addons: ISubAddon[];
  user: IProfile | null;
  unfinishedSubscriptionPendingUpdate?: {
    // downgrading will be effective on the next cycle, this props show this pending stat
    effectImmediate: number;
    effectTime: number;
    paid: number; // 1: paid,
    plan: IPlan; // original plan
    updatePlan: IPlan; // plan after change(upgrade/downgrade, or quantity change)
    // these are pending subscription's actual data
    updateAmount: number;
    updateCurrency: string;
    updateAddons: ISubAddon[];
  };
}

interface IPreview {
  totalAmount: number;
  currency: string;
  prorationDate: number;
  invoice: Invoice;
  nextPeriodInvoice: Invoice;
}

type InvoiceItem = {
  id?: string; // when creating new invoice, list needs an id for each row, but backend response has no id.
  amount: number | string; // when admin creating an invoice, inputbox value is string.
  amountExcludingTax: number | string;
  currency: string;
  description: string;
  periodEnd?: number;
  periodStart?: number;
  proration?: boolean;
  quantity: number | string;
  tax: number | string; // tax amount
  taxScale: number | string; // tax rate
  unitAmountExcludingTax: number | string;
};

// when admin update user subscription, this Invoice is part of the response
type Invoice = {
  currency: string;
  subscriptionAmount: number;
  subscriptionAmountExcludingTax: number;
  taxAmount: number;
  totalAmount: number;
  totalAmountExcludingTax: number;
  lines: InvoiceItem[];
};

// this is for user view only, generated by admin or system automatically
interface UserInvoice {
  id: number;
  merchantId: number;
  userId: number;
  subscriptionId: string;
  invoiceId: string;
  invoiceName: string;
  channelInvoiceId: string;
  uniqueId: string;
  gmtCreate: string;
  totalAmount: number;
  taxAmount: number;
  subscriptionAmount: number;
  currency: string;
  lines: InvoiceItem[];
  channelId: number;
  status: number;
  sendStatus: number;
  sendEmail: string;
  sendPdf: string;
  data: string;
  gmtModify: string;
  isDeleted: number;
  link: string;
  channelStatus: string;
  channelPaymentId: string;
  channelUserId: string;
  channelInvoicePdf: string;
  taxPercentage: number;
  sendNote: string;
  sendTerms: string;
  totalAmountExcludingTax: number;
  subscriptionAmountExcludingTax: number;
  periodStart: number;
  periodEnd: number;
  paymentId: string;
  refundId: string;
}

export type {
  IProfile,
  IPlan,
  ISubscriptionType,
  Country,
  IPreview,
  UserInvoice,
  InvoiceItem,
};
