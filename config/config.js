const mongoose = require("mongoose");

const uri = process.env.CONNECT_MAIN_DATABASE;

const ConnectDB = async () => {
  try {
    await mongoose.connect(uri);

    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.log("❌ Failed to connect to MongoDB");
    console.log("..............................................");
    console.log(error);
  }
};

module.exports = ConnectDB;
