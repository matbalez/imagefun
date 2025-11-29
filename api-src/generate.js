import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("ERROR: VITE_GEMINI_API_KEY is not set in .env file.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });

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
}
