# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deployment & Secrets

To deploy this app to Vercel:

1.  **Environment Variables**:
    Go to your Vercel Project Settings > Environment Variables and add the following (ensure they are checked for Production):
    - `VITE_GEMINI_API_KEY`: Your Gemini API key.
    - `MDK_ACCESS_TOKEN`: MoneyDevKit Access Token.
    - `MDK_MNEMONIC`: MoneyDevKit Mnemonic.
    - `MDK_WEBHOOK_SECRET`: MoneyDevKit Webhook Secret.

2.  **Redeploy**:
    If you added variables after the initial deploy, you must **Redeploy** for them to take effect.
    You can do this from the Vercel dashboard (Deployments > ... > Redeploy) or by pushing a new commit to your repository.
