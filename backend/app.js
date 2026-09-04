// ======================================================
// Load Environment Variables
// ======================================================

const dotenv = require("dotenv");
const path = require("path");

// Local development:
// backend/.env
//
// Vercel:
// Environment Variables are loaded automatically
dotenv.config({
    path: path.join(__dirname, ".env"),
});


// ======================================================
// Libraries
// ======================================================

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");


// ======================================================
// App
// ======================================================

const app = express();


// ======================================================
// Config
// ======================================================

const swaggerSpec = require("./src/config/swagger");
const limiter = require("./src/utils/RateLimiting");


// ======================================================
// Redis
// ======================================================

const { redisClient, connectRedis } = require("./src/cache/redis");


// ======================================================
// Routes
// ======================================================

const Auth = require("./src/routes/authRoute");
const Users = require("./src/routes/userRoutes");
const Products = require("./src/routes/ProductRoutes");
const Category = require("./src/routes/CategoryRoute");
const Cart = require("./src/routes/CartRoutes");
const Order = require("./src/routes/OrderRoute");


// ======================================================
// Middlewares
// ======================================================

const notFound = require("./src/middlewares/NotFound");
const globalError = require("./src/middlewares/error");


// ======================================================
// Stripe Webhook Controller
// ======================================================

const { stripeWebhook } = require("./src/controllers/OrderController");


// ======================================================
// Database & Redis Connection
// Serverless / Vercel compatible
// ======================================================

let mongoConnectionPromise = null;
let redisConnectionPromise = null;


// ======================================================
// MongoDB Connection
// ======================================================

const connectDatabase = async () => {

    // Already connected
    if (mongoose.connection.readyState === 1) {
        return;
    }

    // Connection already in progress
    if (mongoConnectionPromise) {
        return mongoConnectionPromise;
    }

    mongoConnectionPromise = mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log("✅ MongoDB Connected Successfully");
        })
        .catch((error) => {

            mongoConnectionPromise = null;

            console.error("❌ MongoDB Connection Failed");
            console.error(error.message);

            throw error;
        });

    return mongoConnectionPromise;
};


// ======================================================
// Redis Connection
// Redis is OPTIONAL
// ======================================================

const connectRedisServerless = async () => {

    // Redis is not configured
    if (!process.env.REDIS_URL) {
        return;
    }

    // Already connected
    if (redisClient.isOpen) {
        return;
    }

    // Connection already in progress
    if (redisConnectionPromise) {
        return redisConnectionPromise;
    }

    redisConnectionPromise = connectRedis()
        .catch((error) => {

            redisConnectionPromise = null;

            console.error("❌ Redis Connection Failed");
            console.error(error.message);

            // Redis is optional.
            // Do NOT stop the whole API if Redis fails.
            return null;
        });

    return redisConnectionPromise;
};


// ======================================================
// Security / Basic Middlewares
// ======================================================

app.use(helmet());

app.use(cors());

app.use(compression());

app.use(morgan("tiny"));


// ======================================================
// Stripe Webhook
// IMPORTANT:
// Must be BEFORE express.json()
// ======================================================

app.post(
    "/api/v1/Orders/webhook",
    express.raw({
        type: "application/json",
    }),
    stripeWebhook
);


// ======================================================
// JSON Parser
// ======================================================

app.use(express.json());


// ======================================================
// Mongo Sanitize
// Express 5 compatible
// ======================================================

app.use((req, res, next) => {

    try {

        if (req.body) {
            mongoSanitize.sanitize(req.body);
        }

        if (req.params) {
            mongoSanitize.sanitize(req.params);
        }

        next();

    } catch (error) {

        next(error);

    }

});


// ======================================================
// Rate Limiter
// ======================================================

app.use(limiter);


// ======================================================
// Database / Redis Middleware
// ======================================================

app.use(async (req, res, next) => {

    try {

        // MongoDB is required
        await connectDatabase();

        // Redis is optional
        await connectRedisServerless();

        next();

    } catch (error) {

        next(error);

    }

});


// ======================================================
// Routes
// ======================================================

app.use("/api/v1/Auth", Auth);

app.use("/api/v1/users", Users);

app.use("/api/v1/Products", Products);

app.use("/api/v1/Category", Category);

app.use("/api/v1/Cart", Cart);

app.use("/api/v1/Orders", Order);


// ======================================================
// Swagger
// ======================================================

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);


// ======================================================
// Home Route
// ======================================================

app.get("/", (req, res) => {

    res.status(200).json({
        status: "success",
        message: "ShopSphere API is running 🚀",
    });

});


// ======================================================
// 404 Not Found
// ======================================================

app.use(notFound);


// ======================================================
// Global Error Handler
// ======================================================

app.use(globalError);


// ======================================================
// Export Express App
// IMPORTANT FOR VERCEL
// ======================================================

module.exports = app;