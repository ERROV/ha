import mongoose from "mongoose";

// تأكد من تسجيل الموديلات
import "@/models/User";
import "@/models/Reservation";
import "@/models/BreakRequest";


const connect = async () => {
  if (mongoose.connection.readyState === 1) {
    
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI!, {});
    
  } catch (error) {
    console.error("❌ Error connecting to Mongoose:", error);
    throw error;
  }
};

export default connect;
