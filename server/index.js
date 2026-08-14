// 1. Setup Terminal Capture at the absolute top
const terminalHistory = [];
const MAX_HISTORY = 100;
const originalLog = console.log;
const originalError = console.error;

let ioInstance = null; // To be set later

const addToHistory = (type, args) => {
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    const logEntry = { type, message: msg, time: new Date().toLocaleTimeString() };
    terminalHistory.push(logEntry);
    if (terminalHistory.length > MAX_HISTORY) terminalHistory.shift();
    if (ioInstance) {
        ioInstance.emit('bot:terminal', logEntry);
    }
};

console.log = (...args) => {
    originalLog(...args);
    addToHistory('log', args);
};

console.error = (...args) => {
    originalError(...args);
    addToHistory('error', args);
};

console.log('--- Terminal Real-time Bridge Active ---');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const whatsappService = require('./whatsapp-client');
const scheduler = require('./notification-scheduler');
const notificationService = require('./notification-service');
const NotificationLog = require('./models/NotificationLog');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://halaftth.site", "https://app2.halaftth.site", "http://localhost:3000", "http://localhost:3111", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
    }
});
ioInstance = io; // Link the instance for real-time streaming

console.log(`CORS Policy: Allowing ${io.opts.cors.origin.join(', ')}`);

const SOCKET_PORT = process.env.SOCKET_IO_PORT || 3001;
const SERVER_PORT = process.env.NODE_SERVER_PORT || 3002;

app.use(cors());
app.use(express.json());


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB for Bot Server'))
    .catch(err => console.error('MongoDB connection error:', err));

// Health check
app.get('/status', (req, res) => {
    res.json({ status: 'running', whatsapp: whatsappService.getStatus() });
});

// Fetch current shift for a user from shift.json
app.get('/api/shift/:userName', async (req, res) => {
    const { userName } = req.params;
    console.log(`API Request: Fetching shift info for user: ${userName}`);
    const timezone = process.env.BAGHDAD_TIMEZONE || 'Asia/Baghdad';
    const moment = require('moment-timezone');
    const fs = require('fs');
    const path = require('path');

    const now = moment().tz(timezone);
    const currentDate = now.format('D/M/YYYY');
    const shiftFilePath = path.join(__dirname, 'shift.json');

    try {
        if (!fs.existsSync(shiftFilePath)) {
            return res.status(404).json({ success: false, error: 'shift.json not found' });
        }

        const shiftData = JSON.parse(fs.readFileSync(shiftFilePath, 'utf8'));
        const employees = shiftData.employees || [];
        const normalizedInputName = notificationService.normalizeName(userName);

        const emp = employees.find(e => notificationService.normalizeName(e.name) === normalizedInputName);

        if (!emp) {
            return res.json({ success: false, error: 'Employee not found in schedule' });
        }

        const todayShift = emp.schedule.find(s => s.date === currentDate);

        if (!todayShift || todayShift.shift_type === 'OFF') {
            return res.json({ success: true, name: emp.name, shift: 'OFF اليوم' });
        }

        res.json({
            success: true,
            name: emp.name,
            shift: todayShift.shift_type,
            location: todayShift.location
        });

    } catch (error) {
        console.error('Error fetching shift info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Manual notification trigger for dynamic shifts
app.post('/api/notify/manual', async (req, res) => {
    const { shiftType } = req.body;
    console.log(`API Request: Manual reminder trigger for shift type: ${shiftType}`);
    if (!shiftType) return res.status(400).json({ success: false, error: 'shiftType is required' });

    try {
        const timezone = process.env.BAGHDAD_TIMEZONE || 'Asia/Baghdad';
        const moment = require('moment-timezone');
        const fs = require('fs');
        const path = require('path');

        const now = moment().tz(timezone);
        const currentDate = now.format('D/M/YYYY');
        const shiftFilePath = path.join(__dirname, 'shift.json');

        const emitLog = (user, msg) => {
            io.emit('whatsapp:log', {
                user,
                message: msg,
                time: moment().tz(timezone).format('HH:mm:ss')
            });
        };

        if (!fs.existsSync(shiftFilePath)) {
            return res.status(404).json({ success: false, error: 'shift.json not found' });
        }

        const shiftData = JSON.parse(fs.readFileSync(shiftFilePath, 'utf8'));
        const employees = shiftData.employees || [];
        const allUsers = await User.find({});

        let sentCount = 0;
        for (const emp of employees) {
            const todayShift = emp.schedule.find(s => s.date === currentDate);
            if (!todayShift || todayShift.shift_type === 'OFF') continue;

            // Check if this employee's shift_type matches the requested manual trigger
            if (todayShift.shift_type.includes(shiftType)) {
                const normalizedEmpName = notificationService.normalizeName(emp.name);
                const user = allUsers.find(u => notificationService.normalizeName(u.name) === normalizedEmpName);

                if (user) {
                    let loc = "";
                    if (todayShift.shift_type.includes("Attend/H")) loc = "Attend/H";
                    else if (todayShift.shift_type.includes("Attend/O")) loc = "Attend/O";

                    await notificationService.sendDynamicShiftReminder(user, todayShift.shift_type, loc, emitLog);
                    sentCount++;

                    // Delay between messages if more are to follow
                    await notificationService.sleepRandom();
                }
            }
        }

        res.json({ success: true, message: `Manual trigger processed. Reminders sent to ${sentCount} employees.` });
    } catch (error) {
        console.error('Manual trigger error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetch all users with phone numbers
app.get('/api/users', async (req, res) => {
    try {
        console.log('API Request: Fetching users for directory...');
        const users = await User.find({ phoneNumber: { $exists: true, $ne: null } }).select('-password');
        console.log(`API Response: Found ${users.length} users with phone numbers.`);
        res.json({ success: true, users });
    } catch (error) {
        console.error('API Error fetching users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetch notification logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await NotificationLog.find().sort({ timestamp: -1 }).limit(50);
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send custom message
app.post('/api/notify/custom', async (req, res) => {
    const { phoneNumber, userId, message, userName } = req.body;
    try {
        const timezone = process.env.BAGHDAD_TIMEZONE || 'Asia/Baghdad';
        const moment = require('moment-timezone');

        const emitLog = (user, msg) => {
            io.emit('whatsapp:log', {
                user,
                message: msg,
                time: moment().tz(timezone).format('HH:mm:ss')
            });
        };

        const success = await notificationService.sendCustomMessage({ phoneNumber, userId }, message, userName, emitLog);
        res.json({ success, message: success ? 'Message sent' : 'Failed to send message' });
    } catch (error) {
        console.error('Custom Notify Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    const origin = socket.handshake.headers.origin;
    console.log(`Admin UI connected to Socket.io from origin: ${origin}`);

    // Send status
    socket.emit('whatsapp:status', whatsappService.getStatus());

    // Send QR if available
    const currentQr = whatsappService.getLatestQr();
    if (currentQr) {
        socket.emit('whatsapp:qr', { qr: currentQr });
    }

    // Send Terminal History
    socket.emit('bot:terminal_history', terminalHistory);

    socket.on('bot:reconnect', async () => {
        console.log(`Bot reconnection requested by UI (${socket.id})`);
        await whatsappService.initialize(io);
    });
});

// Initialize WhatsApp Client with Socket emitting
whatsappService.initialize(io);

// Start Scheduler
scheduler.start(io);

server.listen(SOCKET_PORT, () => {
    console.log(`WhatsApp Bot Server running on port ${SOCKET_PORT}`);
});
