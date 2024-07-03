import axios from 'axios'
import dayjs from 'dayjs'
import Dinero from 'dinero.js'
import passwordValidator from 'password-validator'
import { CURRENCY } from '../constants'
import { IPlan, TInvoicePerm, UserInvoice } from '../shared.types'

export const passwordSchema = new passwordValidator()
passwordSchema
  .is()
  .min(8) // Minimum length 8
  .is()
  .max(30) // Maximum length 30
  .has()
  .uppercase() // Must have uppercase letters
  .has()
  .lowercase() // Must have lowercase letters
  .has()
  .digits(1) // Must have at least 1 digits
  .has()
  .not()
  .spaces() // Should not have spaces
  .is()
  .symbols(1) // should have special characters

export const urlRegx =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/

export const showAmount = (
  amount: number,
  currency: keyof typeof CURRENCY,
  ignoreFactor?: boolean
): string => {
  const isNegative = amount < 0
  if (isNegative) {
    amount *= -1
  }

  const c = CURRENCY[currency]
  return `${isNegative ? '-' : ''}${c.symbol}${amount / (ignoreFactor ? 1 : c.stripe_factor)}`
}

export const daysBetweenDate = (
  start: string | number, // string: '2022-03-15', number: millisecond since Epoch
  end: string | number
) => {
  const d1 = new Date(start).getTime(),
    d2 = new Date(end).getTime()
  // console.log("d1/d2: ", d1, "//", d2);
  return Math.ceil(Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)))
}

export const formatDate = (d: number, showTime?: boolean) => {
  const timeFormat = showTime ? ' HH:mm:ss' : ''
  const result = dayjs(d * 1000)
  return result.year() == dayjs().year()
    ? result.format(`MMM-DD ${timeFormat}`)
    : result.format(`YYYY-MMM-DD ${timeFormat}`)
}

export const currencyDecimalValidate = (val: number, currency: string) => {
  if (Number.isInteger(val)) {
    return true
  }
  const decimalCnt = val.toString().split('.')[1].length
  if (CURRENCY[currency].decimal_places == null) {
    return true
  }
  return CURRENCY[currency]!.decimal_places! >= decimalCnt
}

export const formatPlanPrice = (plan: IPlan) => {
  const amount = Dinero({
    amount: plan.amount,
    currency: plan.currency
  }).toFormat('$0,0.00')
  if (plan.type == 1 || plan.type == 2) {
    // 1: main plan, 2: add-on, 3: one-time addon
    const itv = `/${plan.intervalCount == 1 ? '' : plan.intervalCount} ${plan.intervalUnit}`
    return `${amount}${itv}`
  } else {
    return amount
  }
}

/*
  0: "Initiating", // this status only exist for a very short period, users/admin won't even know it exist
  1: "Pending", // admin manually create an invoice, ready for edit, but not published yet, users won't see it, won't receive email
  // in pending, admin can also delete the invoice
  2: "Pocessing", // admin has published the invoice, user will receive a mail with payment link
  3: "Paid", // user paid the invoice
  4: "Failed", // user not pay the invoice before it get expired
  5: "Cancelled", // admin cancel the invoice after publishing, only if user hasn't paid yet. If user has paid, admin cannot cancel it.
    */
export const getInvoicePermission = (iv: UserInvoice | null): TInvoicePerm => {
  const p: TInvoicePerm = {
    editable: false,
    creatable: false, // create a new invoice
    savable: false, // save it after creation
    deletable: false, // delete before publish as nothing happened
    publishable: false, // publish it, so user could receive it
    revokable: false,
    refundable: false,
    downloadable: false,
    sendable: false,
    asPaidMarkable: false, // asPaid and asRefunded are exclusive to each other, they can be both FALSE, or one TRUE, one FALSE
    asRefundedMarkable: false // but not both TRUE
  }
  if (iv == null) {
    // creating a new invoice
    p.creatable = true
    p.editable = true
    p.savable = true
    p.publishable = true
    return p
  }

  const isWireTransfer = iv.gateway.gatewayName == 'wire_transfer'
  const isCrypto = iv.gateway.gatewayName == 'changelly'
  const isRefund = iv.refund != null

  // subscriptionId exist or not makes a difference???
  // what if invoice is for one-time payment?
  if (iv.subscriptionId == null || iv.subscriptionId == '') {
    // manually created invoice
    switch (iv.status) {
      case 1: // pending, aka edit mode
        p.editable = true
        p.creatable = true
        p.deletable = true
        p.publishable = true
        break
      case 2: // processing mode, user has received the invoice mail with payment link, but hasn't paid yet.
        // ??????????
        /*
        if (isWireTransfer || isCrypto) {
          p.asRefundedMarkable = isRefund
          p.asPaidMarkable = !isRefund
        }
          */
        p.revokable = true
        break
      case 3: // user has paid
        p.downloadable = true
        p.sendable = true
        p.refundable = iv.refund == null // you cannot refund a refund
        break
    }
    return p
  }

  if (iv.subscriptionId != '') {
    // system generated invoice, not admin manually generated
    p.sendable = true
    p.downloadable = true
    if (iv.status == 3) {
      p.refundable = iv.refund == null // you cannot refund a refund
    }
    if (iv.status == 2) {
      if (isWireTransfer || isCrypto) {
        p.asRefundedMarkable = isRefund
        p.asPaidMarkable = !isRefund
      }
    }
  }
  return p
}

export const toFixedNumber = (num: number, digits: number, base?: number) => {
  const pow = Math.pow(base ?? 10, digits)
  return Math.round(num * pow) / pow
}

export const ramdonString = (length: number | null) => {
  if (length == null || length <= 0) {
    length = 8
  }
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
  const charLength = chars.length
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charLength))
  }
  return result
}

export const emailValidate = (email: string) =>
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )

// backend uses obj(key-val pairs), aka Map(in Golang) to save metadata
// but in case of null or empty string, it's also valid, which means no input.
// array is also 'object' in JS, but not a valid map, so it need to be marked as invalid
export const isValidMap = (str: string | null) => {
  if (str == null || str == '') {
    return true
  }
  try {
    const obj = JSON.parse(str)
    if (Array.isArray(obj)) {
      return false
    }
    return typeof obj == 'object'
  } catch (err) {
    return false
  }
}

export const downloadStaticFile = (url: string, fileName: string) => {
  axios({
    url,
    method: 'GET',
    headers: { Authorization: `${localStorage.getItem('merchantToken')}` },
    responseType: 'blob'
  }).then((response) => {
    console.log('download res: ', response)
    const href = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = href
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  })
}
