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
            console.log('Node sync complete. Events type:', typeof events);
            console.log('Events raw:', JSON.stringify(events, null, 2));

            const eventList = Array.isArray(events) ? events : [events];

            for (const event of eventList) {
                if (!event) continue;

                let paymentHash, amountMsat;

                // Case 1: Object with properties
                if (typeof event === 'object') {
                    paymentHash = event.payment_hash || event.paymentHash;
                    amountMsat = event.amount_msat || event.amountMsat;
                }

                // Case 2: String representation (Rust debug output)
                if (!paymentHash && typeof event === 'string') {
                    console.log('Parsing string event:', event);
                    const hashMatch = event.match(/payment_hash:\s*([a-f0-9]+)/);
                    const amountMatch = event.match(/amount_msat:\s*(\d+)/);
                    if (hashMatch) paymentHash = hashMatch[1];
                    if (amountMatch) amountMsat = amountMatch[1];
                }

                // Case 3: Object with string property (e.g. event.toString())
                if (!paymentHash && typeof event === 'object' && event.toString) {
                    const str = event.toString();
                    if (str.includes('PaymentReceived')) {
                        console.log('Parsing object.toString():', str);
                        const hashMatch = str.match(/payment_hash:\s*([a-f0-9]+)/);
                        const amountMatch = str.match(/amount_msat:\s*(\d+)/);
                        if (hashMatch) paymentHash = hashMatch[1];
                        if (amountMatch) amountMsat = amountMatch[1];
                    }
                }

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
                    console.log('Could not extract payment details from event:', event);
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
