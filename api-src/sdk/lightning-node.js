import { createRequire } from 'module';
import { lightningLogErrorHandler, lightningLogHandler } from './lightning-logs';
import { MAINNET_MDK_NODE_OPTIONS, SIGNET_MDK_NODE_OPTIONS } from './mdk-config';
import { ensureUndiciDispatcher } from './undici-dispatcher';
ensureUndiciDispatcher();
process.env.RUST_LOG ??=
    'ldk_node=trace,lightning_background_processor=trace,vss_client=trace,reqwest=debug';
const OPTIONAL_LIGHTNING_PACKAGES = [
    '@moneydevkit/lightning-js-linux-x64-gnu',
    '@moneydevkit/lightning-js-linux-x64-musl',
    '@moneydevkit/lightning-js-linux-arm64-gnu',
    '@moneydevkit/lightning-js-linux-arm64-musl',
    '@moneydevkit/lightning-js-linux-arm-gnueabihf',
    '@moneydevkit/lightning-js-android-arm64',
    '@moneydevkit/lightning-js-android-arm-eabi',
    '@moneydevkit/lightning-js-win32-x64-msvc',
    '@moneydevkit/lightning-js-win32-ia32-msvc',
    '@moneydevkit/lightning-js-win32-arm64-msvc',
    '@moneydevkit/lightning-js-darwin-x64',
    '@moneydevkit/lightning-js-darwin-arm64',
    '@moneydevkit/lightning-js-freebsd-x64',
];
let cachedLightningModule;
const getRuntimeRequire = () => {
    if (typeof __non_webpack_require__ === 'function') {
        return __non_webpack_require__;
    }
    try {
        return createRequire(import.meta.url);
    }
    catch (error) {
        if (typeof require === 'function') {
            return require;
        }
        throw error;
    }
};
const ensureLightningPackagesForTracing = () => {
    const runtimeRequire = getRuntimeRequire();
    const specifiers = ['@moneydevkit/lightning-js', ...OPTIONAL_LIGHTNING_PACKAGES];
    for (const specifier of specifiers) {
        try {
            if (typeof runtimeRequire.resolve === 'function') {
                runtimeRequire.resolve(specifier);
            }
        }
        catch {
            // Ignore resolution errors; only needed to hint bundlers about the dependency graph.
        }
    }
};
ensureLightningPackagesForTracing();
const loadLightningModule = () => {
    if (!cachedLightningModule) {
        const runtimeRequire = getRuntimeRequire();
        cachedLightningModule = runtimeRequire('@moneydevkit/lightning-js');
    }
    return cachedLightningModule;
};
const RECEIVE_PAYMENTS_MIN_THRESHOLD_MS = 500;
const RECEIVE_PAYMENTS_QUIET_THRESHOLD_MS = 500;
export class MoneyDevKitNode {
    node;
    constructor(options) {
        const { MdkNode, setLogListener } = loadLightningModule();
        setLogListener((err, entry) => {
            if (err) {
                lightningLogErrorHandler(err);
                return;
            }
            lightningLogHandler(entry);
        }, 'TRACE');
        const network = options.nodeOptions?.network ?? MAINNET_MDK_NODE_OPTIONS.network;
        const defaultNodeOptions = network === 'signet' ? SIGNET_MDK_NODE_OPTIONS : MAINNET_MDK_NODE_OPTIONS;
        this.node = new MdkNode({
            network,
            mdkApiKey: options.accessToken,
            vssUrl: options.nodeOptions?.vssUrl ?? defaultNodeOptions.vssUrl,
            esploraUrl: options.nodeOptions?.esploraUrl ?? defaultNodeOptions.esploraUrl,
            rgsUrl: options.nodeOptions?.rgsUrl ?? defaultNodeOptions.rgsUrl,
            mnemonic: options.mnemonic,
            lspNodeId: options.nodeOptions?.lspNodeId ?? defaultNodeOptions.lspNodeId,
            lspAddress: options.nodeOptions?.lspAddress ?? defaultNodeOptions.lspAddress,
        });
    }
    get id() {
        return this.node.getNodeId();
    }
    receivePayments() {
        return this.node.receivePayment(RECEIVE_PAYMENTS_MIN_THRESHOLD_MS, RECEIVE_PAYMENTS_QUIET_THRESHOLD_MS);
    }
    payBolt12Offer(bolt12, amountMsat) {
        return this.node.payBolt12Offer(bolt12, amountMsat);
    }
    payBolt11(bolt11) {
        return this.node.payBolt11(bolt11);
    }
    payLNUrl(lnurl, amountMsat) {
        return this.node.payLnurl(lnurl, amountMsat, 15);
    }
    listChannels() {
        return this.node.listChannels();
    }
    syncWallets() {
        return this.node.syncWallets();
    }
    getBalance() {
        return this.node.getBalance();
    }
    get invoices() {
        return {
            create: (amountSats) => {
                const expirySecs = 15 * 60;
                const description = 'mdk invoice';
                const invoice = amountSats === null
                    ? this.node.getVariableAmountJitInvoice(description, expirySecs)
                    : this.node.getInvoice(amountSats * 1000, description, expirySecs);
                return {
                    invoice: invoice.bolt11,
                    paymentHash: invoice.paymentHash,
                    scid: invoice.scid,
                    expiresAt: new Date(invoice.expiresAt * 1000),
                };
            },
            createWithScid: (scid, amountSats) => {
                const expirySecs = 15 * 60;
                const description = 'mdk invoice';
                const invoice = amountSats === null
                    ? this.node.getVariableAmountJitInvoiceWithScid(scid, description, expirySecs)
                    : this.node.getInvoiceWithScid(scid, amountSats * 1000, description, expirySecs);
                return {
                    invoice: invoice.bolt11,
                    paymentHash: invoice.paymentHash,
                    scid: invoice.scid,
                    expiresAt: new Date(invoice.expiresAt * 1000),
                };
            },
        };
    }
}
//# sourceMappingURL=lightning-node.js.map