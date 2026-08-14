const { DateTime } = require('luxon');
const dotenv = require('dotenv');
const connect = require('./utils/db');
const BreakRequest = require('./models/BreakRequest');

dotenv.config();

// تحسين دالة الحذف
async function deleteAllBreaks() {
  const startTime = DateTime.now().setZone('Asia/Baghdad');
  console.log(`[${startTime.toFormat('yyyy-MM-dd HH:mm:ss')}] 🚀 بدء عملية الحذف`);

  try {
    await connect();
    const result = await BreakRequest.deleteMany({});
    console.log(`✅ تم حذف ${result.deletedCount} طلب استراحة`);
    console.log(`⏱ المدة: ${DateTime.now().diff(startTime).as('seconds').toFixed(2)} ثانية`);
  } catch (error) {
    console.error(`❌ خطأ في الحذف: ${error.message}`);
  }
}

// الطريقة المحسنة للجدولة
function scheduleAt4_20() {
  setInterval(async () => {
    const now = DateTime.now().setZone('Asia/Baghdad');
    const targetTime = now.set({ hour: 4, minute: 20, second: 0, millisecond: 0 });

    // التنفيذ عند الساعة 4:20:00 بالضبط
    if (now.toFormat('HH:mm:ss') === '04:25:00') {
      console.log(`\n[${now.toFormat('yyyy-MM-dd HH:mm:ss')}] 🕒 وقت الحذف 4:20 صباحًا`);
      await deleteAllBreaks();
    }
  }, 1000); // التحقق كل ثانية بدل الدقيقة
}

console.log(`🟢 تم بدء خدمة الحذف التلقائي (التحقق كل ثانية)`);
console.log(`⏱ سيتم الحذف يوميًا عند 4:20:00 صباحًا بتوقيت بغداد\n`);

scheduleAt4_20();