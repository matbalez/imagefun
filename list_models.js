import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client? No, need direct API call or SDK method.
        // SDK doesn't have listModels directly exposed easily in all versions, let's use fetch.

        const apiKey = process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No API KEY found");
            return;
        }
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
