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
        outfile: `api/${file.replace('.js', '.cjs')}`,
        format: 'cjs',
        footer: { js: 'if (module.exports.default) module.exports = module.exports.default;' },
        external: ['@google/generative-ai'], // Keep this external if it works, or bundle it too to be safe. 
        // We MUST bundle @moneydevkit/nextjs because it's broken in Node ESM
    }).catch(() => process.exit(1));
});
