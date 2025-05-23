// const mongoose = require("mongoose");

// const ConnectDB = async () => {
//   try {
//     await mongoose.connect("mongodb+srv://user1:yahiamo99@cluster0.pzmvgfj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
//     console.log("✅ Connected to MongoDB");

//   } catch (error) {
//     console.error("❌ Failed to connect to MongoDB:", error);
//   }
// };

// module.exports = ConnectDB;

const mongoose = require("mongoose");

const uri = "mongodb+srv://user1:yahiamo99@cluster0.34d4ikz.mongodb.net/projectS?retryWrites=true&w=majority";

const ConnectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.log("❌ Failed to connect to MongoDB");
    console.log("..............................................");
    console.log(error);
  }
};

module.exports = ConnectDB;
