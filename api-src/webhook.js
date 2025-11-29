// Imports removed to avoid build errors with unexported SDK paths
// import { handleMdkWebhook } from '@moneydevkit/nextjs/dist/server/handlers/webhooks.js';
// import { log } from '@moneydevkit/nextjs/dist/server/logging.js';

// We need to adapt the Next.js Request object to what the SDK expects if it's strict,
// but the SDK seems to use standard Request/Response objects.
// Vercel serverless functions use Node.js http.IncomingMessage and http.ServerResponse.
// The SDK's `handleMdkWebhook` expects a standard Web API `Request` object.
// We might need to construct one.

import { createMoneyDevKitNode, createMoneyDevKitClient } from './sdk/mdk.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Webhook received. Body:', JSON.stringify(req.body, null, 2));

        const { payment_hash, amount_msat, amount } = req.body || {};
        const paymentHash = payment_hash || req.body?.paymentHash;
        const amountVal = amount_msat || amount || req.body?.amountMsat;

        // STRATEGY:
        // 1. If payload has payment info, use it directly (FAST).
        // 2. If not, sync the node (FALLBACK).

        if (paymentHash && amountVal) {
            console.log(`Payload contains payment info: ${paymentHash}, ${amountVal} msats`);
            try {
                const client = createMoneyDevKitClient();
                const result = await client.checkouts.paymentReceived({
                    payments: [{
                        paymentHash: paymentHash,
                        amountSats: Math.floor(parseInt(amountVal) / 1000)
                    }]
                });
                console.log('Marked payment as received via payload. Result:', JSON.stringify(result));
            } catch (apiError) {
                console.error('Failed to call paymentReceived API from payload:', apiError);
            }
        } else {
            console.log('Payload missing direct payment info. Falling back to node sync...');

            // Sync the node to receive/claim payments
            try {
                const node = createMoneyDevKitNode();
                const events = await node.receivePayments();
                console.log('Node sync complete. Events:', JSON.stringify(events, null, 2));

                const eventList = Array.isArray(events) ? events : [events];

                for (const event of eventList) {
                    if (!event) continue;

                    const pHash = event.payment_hash || event.paymentHash;
                    const amt = event.amount_msat || event.amountMsat || event.amount;

                    if (pHash && amt) {
                        console.log(`Found payment via sync: ${pHash}, ${amt} msats`);
                        try {
                            const client = createMoneyDevKitClient();
                            const result = await client.checkouts.paymentReceived({
                                payments: [{
                                    paymentHash: pHash,
                                    amountSats: Math.floor(parseInt(amt) / 1000)
                                }]
                            });
                            console.log('Marked payment as received via sync. Result:', JSON.stringify(result));
                        } catch (apiError) {
                            console.error('Failed to call paymentReceived API via sync:', apiError);
                        }
                    }
                }

            } catch (syncError) {
                console.error('Node sync/processing failed:', syncError);
            }
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook failed' });
    }
}
