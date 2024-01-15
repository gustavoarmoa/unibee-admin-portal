export const PLAN_STATUS: { [key: number]: string } = {
  1: "editing",
  2: "active",
  3: "inactive",
  4: "expired",
};

export const CURRENCY: {
  [key: string]: { symbol: string; stripe_factor: number };
} = {
  // what about PayPal
  CNY: { symbol: "¥", stripe_factor: 100 },
  USD: { symbol: "$", stripe_factor: 100 },
  JPY: { symbol: "¥", stripe_factor: 1 },
};
