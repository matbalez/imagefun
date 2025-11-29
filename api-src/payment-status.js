import { getCheckout } from '@moneydevkit/nextjs/server';
import { createMoneyDevKitNode, createMoneyDevKitClient } from './sdk/mdk.js';

export default async function handler(req, res) {
    // ... (CORS headers omitted for brevity in thought, but kept in file) ...
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        console.log(`Checking payment status for ID: ${id}`);

        // Sync the node to receive payments
        console.log('Syncing node...');
        try {
            const node = createMoneyDevKitNode();

            // Health check
            try {
                const balance = await node.getBalance();
                console.log('Node balance check:', JSON.stringify(balance));
            } catch (e) {
                console.error('Node health check failed:', e);
            }

            // Wrap receivePayments in a timeout to prevent indefinite hanging
            const syncPromise = node.receivePayments();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('receivePayments timed out after 5s')), 5000)
            );

            const events = await Promise.race([syncPromise, timeoutPromise]);
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
        }

        const checkout = await getCheckout(id);
        console.log(`Status for ${id}:`, checkout ? checkout.status : 'Not found');

        if (checkout && (checkout.status === 'PAID' || checkout.status === 'PAYMENT_RECEIVED')) {
            res.status(200).json({ paid: true, checkout });
        } else {
            res.status(200).json({ paid: false, status: checkout?.status, checkout });
        }

    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: error.message || 'Failed to check status' });
    }
}
