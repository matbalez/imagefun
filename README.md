# Nanobanana Image Generator

A generative AI image creation tool powered by Google Gemini and monetized via Bitcoin Lightning payments using MoneyDevKit.

## Features

- **AI Image Generation**: Create high-quality, artistic images based on a word and a feeling.
- **Lightning Payments**: Micro-transactions via Bitcoin Lightning Network to unlock generation.
- **Serverless Architecture**: Built with Next.js/Express logic adapted for Vercel Serverless Functions.
- **Secure**: API keys are kept server-side and never exposed to the client.

## Deployment

This app is designed to be deployed on **Vercel**.

### Environment Variables

You must configure the following environment variables in your Vercel Project Settings:

- `GEMINI_API_KEY`: Your Google Gemini API key (get one from AI Studio).
- `MDK_ACCESS_TOKEN`: MoneyDevKit Access Token.
- `MDK_MNEMONIC`: MoneyDevKit Mnemonic (12 words).
- `MDK_WEBHOOK_SECRET`: MoneyDevKit Webhook Secret.
- `MDK_NETWORK`: `mainnet` (or `signet` for testing).

**Important**: Do not prefix `GEMINI_API_KEY` with `VITE_`. It must remain a server-side secret.

### Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Run the local API server (for testing backend logic):
    ```bash
    npm run server
    ```
