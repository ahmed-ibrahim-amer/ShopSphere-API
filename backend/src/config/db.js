//Core Functions
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
//const PORT = process.env.PORT || 3000;
const env = require('./env');
// Connection to database
// const connectDB = mongoose.connect(process.env.MONGO_URI).then(()=>{
//     console.log("✅ MongoDB Connected Successfully");

// }).catch((error)=>{
//         console.error("❌ MongoDB Connection Failed");
//         console.error(error.message);
//         process.exit(1);
// });

const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        // redisClient
        console.log("✅ MongoDB Connected Successfully");

    }catch(error){
        console.error("❌ MongoDB Connection Failed");
        console.error(error.message);

    process.exit(1);
    }
}
module.exports = connectDB;
