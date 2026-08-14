// db.js
const mongoose = require("mongoose");

const connect = async () => {
  if (mongoose.connection.readyState === 1) {
    
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Optional options can be added here if needed
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

module.exports = connect;
