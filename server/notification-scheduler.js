const cron = require('node-cron');
const moment = require('moment-timezone');
const notificationService = require('./notification-service');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

const shiftFilePath = path.join(__dirname, 'shift.json');

const start = (io) => {
    console.log('Starting Notification Scheduler (Dynamic Shifts)...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        const timezone = process.env.BAGHDAD_TIMEZONE || 'Asia/Baghdad';
        const now = moment().tz(timezone);
        const currentTime = now.format('HH:mm');
        const currentDate = now.format('D/M/YYYY'); // Format used in shift.json

        // Helper to emit logs to UI
        const emitLog = (user, msg) => {
            if (io) {
                io.emit('whatsapp:log', {
                    user,
                    message: msg,
                    time: moment().tz(timezone).format('HH:mm:ss')
                });
            }
        };

        try {
            if (!fs.existsSync(shiftFilePath)) {
                console.error('Scheduler: shift.json not found!');
                return;
            }

            const shiftData = JSON.parse(fs.readFileSync(shiftFilePath, 'utf8'));
            const employees = shiftData.employees || [];

            console.log(`Scheduler Heartbeat: Scanning ${employees.length} employees for date ${currentDate} at ${currentTime}...`);

            // Fetch all users to match in-memory for performance (if number of users is manageable)
            const allUsers = await User.find({});

            for (const emp of employees) {
                // 1. Find the entry for the current date in employee's schedule
                const todayShift = emp.schedule.find(s => s.date === currentDate);
                if (!todayShift || todayShift.shift_type === 'OFF') continue;

                // 2. Map shift type to start and end times
                let startTimeStr = "";
                let endTimeStr = "";
                if (todayShift.shift_type.includes("2-9")) {
                    startTimeStr = "02:00";
                    endTimeStr = "09:00";
                } else if (todayShift.shift_type.includes("7:30-2:30")) {
                    startTimeStr = "19:30";
                    endTimeStr = "02:30";
                } else if (todayShift.shift_type.includes("4-11")) {
                    startTimeStr = "16:00";
                    endTimeStr = "23:00";
                } else if (todayShift.shift_type.includes("11-6")) {
                    startTimeStr = "11:00";
                    endTimeStr = "18:00";
                } else if (todayShift.shift_type.includes("9-4")) {
                    startTimeStr = "09:00";
                    endTimeStr = "16:00";
                }

                if (!startTimeStr && !endTimeStr) continue;

                // 3. Start Reminder Logic (5 minutes before)
                if (startTimeStr) {
                    const shiftStartTime = moment.tz(`${currentDate} ${startTimeStr}`, "D/M/YYYY HH:mm", timezone);
                    const reminderTime = shiftStartTime.clone().subtract(5, 'minutes');

                    if (now.isSame(reminderTime, 'minute')) {
                        console.log(`Scheduler: Start Time match for ${emp.name} (${todayShift.shift_type}) at ${currentTime}. Dispatching reminder...`);
                        const normalizedEmpName = notificationService.normalizeName(emp.name);
                        const user = allUsers.find(u => notificationService.normalizeName(u.name) === normalizedEmpName);

                        if (user) {
                            let loc = "";
                            if (todayShift.shift_type.includes("Attend/H")) loc = "Attend/H";
                            else if (todayShift.shift_type.includes("Attend/O")) loc = "Attend/O";

                            await notificationService.sendDynamicShiftReminder(user, todayShift.shift_type, loc, emitLog);
                            await notificationService.sleepRandom();
                        } else {
                            console.warn(`Scheduler: Could not find MongoDB user for employee: ${emp.name}`);
                        }
                    }
                }

                // 4. End Reminder Logic (Exactly at End Time)
                if (endTimeStr) {
                    let shiftEndTime;
                    if (endTimeStr === "02:30" || (endTimeStr === "09:00" && startTimeStr === "02:00")) {
                        if (startTimeStr === "19:30") {
                            shiftEndTime = moment.tz(`${currentDate} ${endTimeStr}`, "D/M/YYYY HH:mm", timezone).add(1, 'day');
                        } else {
                            shiftEndTime = moment.tz(`${currentDate} ${endTimeStr}`, "D/M/YYYY HH:mm", timezone);
                        }
                    } else {
                        shiftEndTime = moment.tz(`${currentDate} ${endTimeStr}`, "D/M/YYYY HH:mm", timezone);
                    }

                    if (now.isSame(shiftEndTime, 'minute')) {
                        console.log(`Scheduler: End Time match for ${emp.name} (${todayShift.shift_type}) at ${currentTime}. Dispatching end notification...`);
                        const normalizedEmpName = notificationService.normalizeName(emp.name);
                        const user = allUsers.find(u => notificationService.normalizeName(u.name) === normalizedEmpName);

                        if (user) {
                            await notificationService.sendShiftEndReminder(user, todayShift.shift_type, emitLog);
                            await notificationService.sleepRandom();
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error in scheduler dynamic shift task:', error);
        }
    });
};

module.exports = { start };
