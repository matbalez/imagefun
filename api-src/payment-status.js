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
            const events = await node.receivePayments();
            console.log('Node sync complete. Events:', JSON.stringify(events, null, 2));

            if (Array.isArray(events)) {
                for (const event of events) {
                    // Check for PaymentReceived event (structure depends on SDK, checking common patterns)
                    // Log showed: PaymentReceived { payment_hash: ..., amount_msat: ... }
                    // It might be an object like { type: 'PaymentReceived', ... } or just the object itself if it's a class instance

                    // We look for payment_hash and amount_msat
                    const paymentHash = event.payment_hash || event.paymentHash;
                    const amountMsat = event.amount_msat || event.amountMsat;

                    if (paymentHash && amountMsat) {
                        console.log(`Found payment: ${paymentHash}, ${amountMsat} msats`);
                        const client = createMoneyDevKitClient();
                        await client.checkouts.paymentReceived({
                            payments: [{
                                paymentHash: paymentHash,
                                amountSats: Math.floor(parseInt(amountMsat) / 1000)
                            }]
                        });
                        console.log('Marked payment as received in API');
                    }
                }
            }

        } catch (syncError) {
            console.error('Node sync/processing failed:', syncError);
        }

        const checkout = await getCheckout(id);
        console.log(`Status for ${id}:`, checkout ? checkout.status : 'Not found');

        if (checkout && checkout.status === 'PAID') {
            res.status(200).json({ paid: true, checkout });
        } else {
            res.status(200).json({ paid: false, status: checkout?.status, checkout });
        }

    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: error.message || 'Failed to check status' });
    }
}
