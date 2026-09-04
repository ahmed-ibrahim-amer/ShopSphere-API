// Load environment variables first
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");

const connectDB = require("./src/config/db");
const { connectRedis } = require("./src/cache/redis");

const env = require("./src/config/env");


async function startServer() {

    try {

        // Connect to MongoDB
        await connectDB();

        // Connect to Redis
        await connectRedis();

        // Start Express server
        app.listen(env.PORT, () => {

            console.log(
                `🚀 Server running on http://localhost:${env.PORT}`
            );

        });

    } catch (error) {

        console.error("❌ Server failed to start");
        console.error(error);

        process.exit(1);
    }
}


startServer();