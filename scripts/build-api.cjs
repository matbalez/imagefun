const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const functions = ['checkout.js', 'webhook.js', 'payment-status.js', 'generate.js'];

functions.forEach(file => {
    let outfile = `api/${file}`;
    if (file === 'payment-status.js') {
        outfile = `api/payment-status/[id].js`;
    }

    esbuild.build({
        entryPoints: [`api-src/${file}`],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outfile: outfile,
        format: 'cjs',
        footer: { js: 'if (module.exports.default) module.exports = module.exports.default;' },
        external: ['@google/generative-ai', '@moneydevkit/lightning-js'],
        // We MUST bundle @moneydevkit/nextjs because it's broken in Node ESM
    }).catch(() => process.exit(1));
});
