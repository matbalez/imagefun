import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("ERROR: VITE_GEMINI_API_KEY is not set in .env file.");
}

import { createCheckout, getCheckout } from '@moneydevkit/nextjs/server';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });

app.post('/api/checkout', async (req, res) => {
    try {
        const { word, feeling } = req.body;
        if (!word || !feeling) {
            return res.status(400).json({ error: 'Word and feeling are required' });
        }

        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;
        const successUrl = `${baseUrl}/success?word=${encodeURIComponent(word)}&feeling=${encodeURIComponent(feeling)}&checkoutId={CHECKOUT_ID}`;

        console.log('Creating checkout with success URL:', successUrl);

        console.log('Calling createCheckout...');
        const checkout = await createCheckout({
            amount: 100,
            currency: 'USD',
            title: 'Nanobanana Image Generation',
            description: `Generating: ${word} (${feeling})`,
            successUrl: successUrl,
            metadata: { word, feeling }
        });

        console.log('Checkout result:', JSON.stringify(checkout, null, 2));

        if (checkout && checkout.id) {
            res.json({
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
});

app.get('/api/payment-status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const checkout = await getCheckout(id);

        if (checkout && checkout.status === 'PAID') { // Check correct status enum from SDK/Docs
            res.json({ paid: true, checkout });
        } else {
            res.json({ paid: false, status: checkout?.status });
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

app.post('/api/webhook', async (req, res) => {
    try {
        console.log('Webhook received:', req.body);
        // In a real app, verify signature here using process.env.MDK_WEBHOOK_SECRET
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook failed' });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { word, feeling } = req.body;

        if (!word || !feeling) {
            return res.status(400).json({ error: 'Word and feeling are required' });
        }

        const prompt = `generate a high-quality, artistic image of ${word}. The image should strongly embody the feeling of "${feeling}". It should be designed to delight and surprise, with vivid colors, 8k resolution, and a professional composition.`;

        console.log(`Generating image for: ${word} (${feeling})`);

        const result = await model.generateContent(prompt);
        const response = await result.response;

        const parts = response.candidates?.[0]?.content?.parts;
        const imagePart = parts?.find(part => part.inlineData);

        if (imagePart && imagePart.inlineData) {
            const base64Image = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType || 'image/png';
            res.json({ image: `data:${mimeType};base64,${base64Image}` });
        } else {
            // Fallback/Debug for text responses
            const textPart = parts?.find(part => part.text);
            if (textPart) {
                console.log("Model returned text:", textPart.text);
                return res.status(500).json({ error: 'Model returned text instead of image', details: textPart.text });
            }
            res.status(500).json({ error: 'No image data received from model' });
        }

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
