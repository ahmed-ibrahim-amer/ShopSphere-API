//Core Functions
const mongoose = require('mongoose');
const app = require('./app');
const dotenv = require('dotenv');
dotenv.config();
//const PORT = process.env.PORT || 3000;
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const  {redisClient , connectRedis} = require('../backend/src/cache/redis');
// Connection to database
// const ConnectionToDatabase = mongoose.connect(process.env.MONGO_URI).then(()=>{
// console.log('Connected to DataBase has been Successfully')

// }).catch((error)=>{
//     console.error(error);
// });


async function startServer(){
    try{
        await connectDB();
        await connectRedis();
        app.listen(env.PORT, ()=>{
        console.log(`Server running on http://localhost:${env.PORT}`);
        });
    }catch(err){
    console.error(err);
    process.exit(1);
    }
}

startServer();
