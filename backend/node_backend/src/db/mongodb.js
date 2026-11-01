const mongoose = require("mongoose");
const dotenv=require("dotenv");
require("dotenv").config();

// --- MongoDB Atlas connection ---
async function connectDB() {
    try{
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Database connected successfully.");
   }
    catch(error)
    {
       console.error(`MongoDB Database connection error ${error.message}`);
    }
};

module.exports=connectDB;