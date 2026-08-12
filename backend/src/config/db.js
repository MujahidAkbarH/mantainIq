const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 
              process.env.MONGO_URI || 
              process.env.DATABASE_URL || 
              'mongodb://127.0.0.1:27017/maintainiq';

  const fallbackUri = 'mongodb://127.0.0.1:27017/maintainiq';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected Successfully");
    console.log(`[MongoDB Host] ${conn.connection.host}`);
    return conn;
  } catch (primaryError) {
    console.warn(`[MongoDB Warning] Failed connecting to ${uri}: ${primaryError.message}`);
    if (uri !== fallbackUri) {
      try {
        console.log(`[MongoDB] Retrying with fallback URI ${fallbackUri}...`);
        const fallbackConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB Connected Successfully");
        console.log(`[MongoDB Host] ${fallbackConn.connection.host}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error(`[MongoDB Error] Connection failed: ${fallbackError.message}`);
      }
    }
  }
};

module.exports = connectDB;
