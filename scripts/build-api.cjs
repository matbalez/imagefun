const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const functions = ['checkout.js', 'webhook.js'];

functions.forEach(file => {
    esbuild.build({
        entryPoints: [`api-src/${file}`],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outfile: `api/${file}`,
        format: 'cjs',
        footer: { js: 'if (module.exports.default) module.exports = module.exports.default;' },
        external: ['@google/generative-ai', '@moneydevkit/lightning-js'],
        // We MUST bundle @moneydevkit/nextjs because it's broken in Node ESM
    }).catch(() => process.exit(1));
});
