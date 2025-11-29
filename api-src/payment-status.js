import { getCheckout } from '@moneydevkit/nextjs/server';

export default async function handler(req, res) {
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
        const { id } = req.query; // Vercel puts dynamic route params in req.query

        console.log(`Checking payment status for ID: ${id}`);
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
