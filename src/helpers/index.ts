import { CURRENCY } from "../constants";

export const showAmount = (
  amount: number,
  currency: keyof typeof CURRENCY
): string => {
  const c = CURRENCY[currency];
  return `${c.symbol}${amount / c.stripe_factor}`;
};

export const daysBetweenDate = (
  start: string | number, // string: '2022-03-15', number: millisecond since Epoch
  end: string | number
) => {
  const d1 = new Date(start).getTime(),
    d2 = new Date(end).getTime();
  // console.log("d1/d2: ", d1, "//", d2);
  return Math.ceil(Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)));
};

export const ramdonString = (length: number | null) => {
  if (length == null || length <= 0) {
    length = 8;
  }
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  const charLength = chars.length;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return result;
};
