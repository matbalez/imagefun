import { Agent, setGlobalDispatcher } from 'undici';
export const ensureUndiciDispatcher = () => {
    if (globalThis.__mdkUndiciDispatcherConfigured) {
        return;
    }
    setGlobalDispatcher(new Agent({
        keepAliveTimeout: 1,
        keepAliveTimeoutThreshold: 1,
    }));
    globalThis.__mdkUndiciDispatcherConfigured = true;
};
ensureUndiciDispatcher();
//# sourceMappingURL=undici-dispatcher.js.map