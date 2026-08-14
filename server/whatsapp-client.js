const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let status = 'Initializing';
let latestQr = null;
let socketIo = null;

const initialize = async (io) => {
    socketIo = io;

    // If client already exists and is not disconnected, don't start a new one
    if (client && (status === 'Connected' || status === 'Authenticated' || status === 'Awaiting Scan')) {
        console.log(`WhatsApp Service: Client already ${status}. Skipping re-init.`);
        if (socketIo) {
            socketIo.emit('whatsapp:status', status);
            if (latestQr) socketIo.emit('whatsapp:qr', { qr: latestQr });
        }
        return;
    }

    // Properly destroy existing client if it exists (e.g. if status was Error or Disconnected)
    if (client) {
        try {
            console.log('Destroying existing WhatsApp client...');
            await client.destroy();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for browser to close
        } catch (e) {
            console.error('Error destroying existing client:', e);
        }
        client = null;
    }

    status = 'Initializing';
    if (socketIo) socketIo.emit('whatsapp:status', status);

    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth'
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // helpful in some environments
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', (qr) => {
        console.log('WhatsApp Service: QR Code generated. Awaiting scan by user...');
        latestQr = qr;
        status = 'Awaiting Scan';
        if (socketIo) {
            socketIo.emit('whatsapp:qr', { qr });
            socketIo.emit('whatsapp:status', status);
        }
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('WhatsApp Service: Connection established and client is ready!');
        status = 'Connected';
        latestQr = null;
        if (socketIo) {
            socketIo.emit('whatsapp:status', status);
        }
    });

    client.on('authenticated', () => {
        console.log('WhatsApp Service: Authentication successful.');
        status = 'Authenticated';
        latestQr = null;
        if (socketIo) socketIo.emit('whatsapp:status', status);
    });

    client.on('auth_failure', (msg) => {
        console.error('WhatsApp Auth Failure:', msg);
        status = 'Auth Failure';
        if (socketIo) socketIo.emit('whatsapp:status', status);
    });

    client.on('disconnected', (reason) => {
        console.log(`WhatsApp Service: Client disconnected! Reason: ${reason}`);
        status = 'Disconnected';
        if (socketIo) socketIo.emit('whatsapp:status', status);
    });

    try {
        await client.initialize();
    } catch (err) {
        console.error('Failed to initialize WhatsApp client:', err);
        status = 'Error';
        if (socketIo) socketIo.emit('whatsapp:status', status);
    }
};

const getStatus = () => status;
const getLatestQr = () => latestQr;
const getClient = () => client;

module.exports = {
    initialize,
    getStatus,
    getLatestQr,
    getClient
};
