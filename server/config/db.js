const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to db ${conn.connection.host}`.yellow.bold);
  } catch (err) {
    console.log("Failed to connect to db: ", err);
    process.exit();
  }
};

module.exports = connectDB;
