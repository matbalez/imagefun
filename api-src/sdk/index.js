'use server';
import { getCheckout as getCheckoutImpl, confirmCheckout as confirmCheckoutImpl, createCheckout as createCheckoutImpl, payInvoice as payInvoiceImpl, } from './actions';
export async function getCheckout(...args) {
    return getCheckoutImpl(...args);
}
export async function confirmCheckout(...args) {
    return confirmCheckoutImpl(...args);
}
export async function createCheckout(...args) {
    return createCheckoutImpl(...args);
}
export async function payInvoice(...args) {
    return payInvoiceImpl(...args);
}
//# sourceMappingURL=index.js.map