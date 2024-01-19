import { CURRENCY } from "../constants";

export const showAmount = (
  amount: number,
  currency: keyof typeof CURRENCY
): string => {
  const c = CURRENCY[currency];
  return `${c.symbol}${amount / c.stripe_factor}`;
};

export const daysBetweenDate = (
  start: string | number,
  end: string | number
) => {
  // string: '2022-03-15', number: millisecond since Epoch
  const d1 = new Date(start).getTime(),
    d2 = new Date(end).getTime();
  console.log("d1/d2: ", d1, "//", d2);
  return Math.ceil(Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)));
};
