// When quantity is 0, it means the quantity is unlimited.
const UNLIMITED_QUANTITY = 0

export const formatQuantity = (quantity: number) =>
  quantity === UNLIMITED_QUANTITY ? 'Unlimited' : quantity

enum RECURRING_STATUS {
  NO,
  YES
}

const FORMATTED_RECURRING_MAP = {
  [RECURRING_STATUS.NO]: 'No',
  [RECURRING_STATUS.YES]: 'Yes'
}

export const formatRecurringStatus = (recurring: RECURRING_STATUS) =>
  FORMATTED_RECURRING_MAP[recurring] ?? 'Unknown'
