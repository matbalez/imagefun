const toBoolean = (value) => value?.toLowerCase() === 'true';
// const loggingEnabled = toBoolean(process.env.MDK_ENABLE_LOGS)
const loggingEnabled = true;
export const isLoggingEnabled = () => loggingEnabled;
export const log = (...args) => {
    if (!loggingEnabled) {
        return;
    }
    console.log(...args);
};
export const warn = (...args) => {
    if (!loggingEnabled) {
        return;
    }
    console.warn(...args);
};
//# sourceMappingURL=logging.js.map