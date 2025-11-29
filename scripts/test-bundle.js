import * as mod from '../api/checkout.js';
console.log('Module exports:', mod);
const handler = mod.default || mod;

console.log('Successfully imported handler');

const req = {
    method: 'POST',
    headers: { host: 'localhost' },
    body: { word: 'test', feeling: 'test' }
};

const res = {
    setHeader: () => { },
    status: (code) => ({
        json: (data) => console.log('Response:', code, data),
        end: () => console.log('Response ended')
    })
};

try {
    await handler(req, res);
} catch (e) {
    console.error('Handler crashed:', e);
}
