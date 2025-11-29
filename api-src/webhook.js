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
        console.log('Webhook received. Triggering node sync...');

        // Sync the node to receive/claim payments
        // This is triggered by the LSP notifying us of activity
        try {
            const node = createMoneyDevKitNode();
            const events = await node.receivePayments();
            console.log('Node sync complete. Events:', JSON.stringify(events, null, 2));

            const eventList = Array.isArray(events) ? events : [events];

            for (const event of eventList) {
                if (!event) continue;

                // Handle both property names seen in logs/SDK
                const paymentHash = event.payment_hash || event.paymentHash;
                const amountMsat = event.amount_msat || event.amountMsat || event.amount;

                if (paymentHash && amountMsat) {
                    console.log(`Found payment: ${paymentHash}, ${amountMsat} msats`);
                    try {
                        const client = createMoneyDevKitClient();
                        const result = await client.checkouts.paymentReceived({
                            payments: [{
                                paymentHash: paymentHash,
                                amountSats: Math.floor(parseInt(amountMsat) / 1000)
                            }]
                        });
                        console.log('Marked payment as received in API. Result:', JSON.stringify(result));
                    } catch (apiError) {
                        console.error('Failed to call paymentReceived API:', apiError);
                    }
                } else {
                    console.log('Skipping event (missing hash or amount):', JSON.stringify(event));
                }
            }

        } catch (syncError) {
            console.error('Node sync/processing failed:', syncError);
            // We don't fail the webhook request itself, as we might want to retry or just log it
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook failed' });
    }
}
