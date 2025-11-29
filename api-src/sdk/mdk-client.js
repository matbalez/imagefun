import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { ensureUndiciDispatcher } from './undici-dispatcher';
ensureUndiciDispatcher();
export class MoneyDevKitClient {
    client;
    constructor(options) {
        const link = new RPCLink({
            url: options.baseUrl,
            headers: () => ({
                'x-api-key': options.accessToken,
            }),
        });
        this.client = createORPCClient(link);
    }
    get checkouts() {
        return {
            get: async (params) => {
                return await this.client.checkout.get(params);
            },
            create: async (fields, nodeId) => {
                return await this.client.checkout.create({
                    ...fields,
                    nodeId,
                });
            },
            confirm: async (params) => {
                return await this.client.checkout.confirm(params);
            },
            registerInvoice: async (params) => {
                return await this.client.checkout.registerInvoice(params);
            },
            paymentReceived: async (params) => {
                return await this.client.checkout.paymentReceived(params);
            },
        };
    }
}
//# sourceMappingURL=mdk-client.js.map