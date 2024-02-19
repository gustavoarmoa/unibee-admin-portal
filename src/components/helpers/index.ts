import { CURRENCY } from '../../constants';
import { UserInvoice } from '../../shared.types';

export const normalizeAmt = (iv: UserInvoice[]) => {
  iv.forEach((v) => {
    const c = v.currency;
    const f = CURRENCY[c].stripe_factor;
    v.subscriptionAmount /= f;
    v.subscriptionAmountExcludingTax /= f;
    v.taxAmount /= f;
    v.totalAmount /= f;
    v.totalAmountExcludingTax /= f;
    v.lines.forEach((l) => {
      (l.amount as number) /= f;
      (l.amountExcludingTax as number) /= f;
      (l.tax as number) /= f;
      (l.unitAmountExcludingTax as number) /= f;
    });
  });
};
