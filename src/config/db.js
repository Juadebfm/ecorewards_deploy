const mongoose = require("mongoose");

// Cache the database connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
