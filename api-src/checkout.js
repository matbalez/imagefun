import { createCheckout } from '@moneydevkit/nextjs/server';

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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { word, feeling } = req.body;

        if (!word || !feeling) {
            return res.status(400).json({ error: 'Word and feeling are required' });
        }

        // Determine the success URL (callback)
        // For Vercel, it's the deployment URL. For local, it's localhost.
        // We can use the Referer header or a hardcoded base URL.
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;
        const successUrl = `${baseUrl}/success?word=${encodeURIComponent(word)}&feeling=${encodeURIComponent(feeling)}`;

        console.log('Creating checkout with success URL:', successUrl);

        const checkout = await createCheckout({
            amount: 100, // 100 sats (approx $0.05)
            currency: 'USD', // Or 'SAT' if supported, but SDK defaults to USD/Sats conversion
            title: 'Nanobanana Image Generation',
            description: `Generating: ${word} (${feeling})`,
            successUrl: successUrl,
            metadata: {
                word,
                feeling,
                type: 'nanobanana_generation'
            }
        });

        if (checkout && checkout.id) {
            res.status(200).json({
                checkoutId: checkout.id,
                invoice: checkout.invoice
            });
        } else {
            res.status(500).json({ error: 'Failed to create checkout' });
        }

    } catch (error) {
        console.error('Error creating checkout:', error);
        res.status(500).json({ error: error.message || 'Failed to create checkout' });
    }
}
