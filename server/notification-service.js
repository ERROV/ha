const webpush = require('web-push');
const mongoose = require('mongoose');
const whatsappClient = require('./whatsapp-client');
const User = require('./models/User');
const NotificationLog = require('./models/NotificationLog');

const sleepRandom = async () => {
    const min = parseInt(process.env.MIN_MESSAGE_DELAY) || 5000;
    const max = parseInt(process.env.MAX_MESSAGE_DELAY) || 10000;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`WhatsApp Service: Sleeping for ${delay}ms to prevent ban...`);
    return new Promise(resolve => setTimeout(resolve, delay));
};

// Configure web-push safely
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            process.env.VAPID_EMAIL || 'mailto:admin@halaftth.site',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    } catch (e) {
        console.warn("Failed to set VAPID details for web-push:", e);
    }
}


const dispatchNotification = async (user, message, title = "Taskaty Notification") => {
    const results = { whatsapp: 'n/a', webpush: 'n/a' };
 if (!user || !user.phoneNumber){
       console.warn(`${user?.name || 'Unknown User'} has no phoneNumber`);
        return results
    }
    // Send WhatsApp
    if(user.phoneNumber){
    try {
        const client = whatsappClient.getClient();
        if (client && whatsappClient.getStatus() === 'Connected') {
            const chatId = `${user.phoneNumber}@c.us`;
            await client.sendMessage(chatId, message);
            console.log(`WhatsApp Service: Message sent to ${user.name} (${user.phoneNumber})`);
            results.whatsapp = 'sent';
        } else {
            console.warn(`WhatsApp Service:  Cannot send to ${user.name}. Client status: ${whatsappClient.getStatus()}`);
            results.whatsapp = 'failed';
        }
    } catch (err) {
        console.error(`WhatsApp Service:  Error sending to ${user.name}:`, err.message);
        results.whatsapp = 'failed';
    }
}

    // Send Web Push
    if(user.pushSubscription){

    
    try {
        if (user.pushSubscription) {
            await webpush.sendNotification(
                user.pushSubscription,
                JSON.stringify({
                    title: title,
                    body: message,
                    icon: '/favicon.ico',
                })
            );
            results.webpush = 'sent';
            console.log(` Web Push sent to ${user.name}`);
        }
    } catch (err) {
        console.error(`Failed to send Web Push to ${user.name}:`, err);
        results.webpush = 'failed';
        // If 410 Gone, remove invalid subscription
        if (err.statusCode === 410) {
            await User.findByIdAndUpdate(user._id, { pushSubscription: null });
        }
    }
}

    return results;
};

const sendCustomMessage = async (recipient, message, userName = 'Direct Message', logCallback) => {
    const phoneNumber = typeof recipient === 'object' ? recipient.phoneNumber : recipient;
    const pushSubscription = typeof recipient === 'object' ? recipient.pushSubscription : null;

    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        const results = await dispatchNotification({ phoneNumber, pushSubscription, name: userName }, message, "Direct Message");
 
    

        await NotificationLog.create({
            userName: userName,
            phoneNumber: phoneNumber || 'N/A',
            message: message,
            type: 'custom',
            whatsappStatus: results.whatsapp,
            webpushStatus: results.webpush
        });

        if (logCallback) {
            logCallback(userName, `Custom: ${message.substring(0, 20)}...`);
        }

        return results.whatsapp === 'sent' || results.webpush === 'sent';
        
    } catch (error) {
        console.error('Error in sendCustomMessage:', error);
        return false;
    }
};


const sendDynamicShiftReminder = async (user, shiftType, locationInfo, logCallback) => {
    console.log(`Notification Service: Sending dynamic reminder to ${user.name} for ${shiftType}...`);

    // Composing the message based on shiftType and locationInfo
    // "2-9 من 2 فجر الئ 9 صبحا
    // 7:30-2:30 من 7 م الئ 2 ونصف فجر 
    // 4-11 من 4 م الئ 11 مساء 
    // 11-6 من 11 ص الئ 6 مساء 

    let timeLabel = "";
    if (shiftType.includes("2-9")) timeLabel = "2:00 AM";
    else if (shiftType.includes("7:30-2:30")) timeLabel = "7:30 PM";
    else if (shiftType.includes("4-11")) timeLabel = "4:00 PM";
    else if (shiftType.includes("11-6")) timeLabel = "11:00 AM";

    const locationMessage = locationInfo === 'Attend/H' ? " (من البيت)" : (locationInfo === 'Attend/O' ? " (من المكتب)" : "");
    const message = `تذكير ${user.name}، يبدأ شفتك خلال 5 دقائق في الساعة ${timeLabel}${locationMessage}. يرجى الاستعداد وبصمة الحضور.`;

    const results = await dispatchNotification(user, message, "تذكير الشفت");

    // Log to Database
    try {
        await NotificationLog.create({
            userName: user.name,
            phoneNumber: user.phoneNumber || 'N/A',
            message: message,
            type: 'reminder',
            whatsappStatus: results.whatsapp,
            webpushStatus: results.webpush
        });
    } catch (logErr) {
        console.error('Failed to save log to DB:', logErr);
    }

    if (logCallback) {
        logCallback(user.name, `Sent dynamic reminder for ${shiftType}`);
    }
};

const sendShiftEndReminder = async (user, shiftType, logCallback) => {
    console.log(`Notification Service: Sending shift end notification to ${user.name} for ${shiftType}...`);

    const message = `تذكير ${user.name}، لقد انتهى وقت شفتك (${shiftType}) الآن. شكراً لجهودك، يرجى بصمة الانصراف.`;

    const results = await dispatchNotification(user, message, "انتهاء الشفت");

    // Log to Database
    try {
        await NotificationLog.create({
            userName: user.name,
            phoneNumber: user.phoneNumber || 'N/A',
            message: message,
            type: 'end_reminder',
            whatsappStatus: results.whatsapp,
            webpushStatus: results.webpush
        });
    } catch (logErr) {
        console.error('Failed to save log to DB:', logErr);
    }

    if (logCallback) {
        logCallback(user.name, `Sent shift end reminder for ${shiftType}`);
    }
};

const normalizeName = (name) => {
    if (!name) return "";
    return name.replace(/\s+/g, '').toLowerCase();
};

module.exports = {
    dispatchNotification,
    sendCustomMessage,
    sendDynamicShiftReminder,
    sendShiftEndReminder,
    normalizeName,
    sleepRandom
};
