export const PLAN_STATUS: { [key: number]: string } = {
  1: "editing",
  2: "active",
  3: "inactive",
  4: "expired",
};

export const SUBSCRIPTION_STATUS: { [key: number]: string } = {
  0: "Initiating",
  1: "Created",
  2: "Active",
  3: "Suspended",
  4: "Cancelled",
  5: "Expired",
};

export const CURRENCY: {
  [key: string]: { symbol: string; stripe_factor: number };
} = {
  // what about PayPal
  CNY: { symbol: "¥", stripe_factor: 100 },
  USD: { symbol: "$", stripe_factor: 100 },
  JPY: { symbol: "¥", stripe_factor: 1 },
};
