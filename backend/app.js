// Load environment variables first
const dotenv = require("dotenv");
dotenv.config();

// Libraries
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");

// App
const app = express();

// Config
const swaggerSpec = require("./src/config/swagger");
const limiter = require("./src/utils/RateLimiting");

// Redis
const { redisClient, connectRedis } = require("./src/cache/redis");

// Routes
const Auth = require("./src/routes/authRoute");
const Users = require("./src/routes/userRoutes");
const Products = require("./src/routes/ProductRoutes");
const Category = require("./src/routes/CategoryRoute");
const Cart = require("./src/routes/CartRoutes");
const Order = require("./src/routes/OrderRoute");

// Middlewares
const notFound = require("./src/middlewares/NotFound");
const globalError = require("./src/middlewares/error");

// Stripe webhook controller
const { stripeWebhook } = require("./src/controllers/OrderController");


// ======================================================
// Database & Redis connection for Vercel / Serverless
// ======================================================

let mongoConnectionPromise = null;
let redisConnectionPromise = null;

const connectDatabase = async () => {

    // Already connected
    if (mongoose.connection.readyState === 1) {
        return;
    }

    // Connection is already being established
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


const connectRedisServerless = async () => {

    // Redis is optional
    if (!process.env.REDIS_URL) {
        console.log("⚠️ REDIS_URL is not configured");
        return;
    }

    // Already connected
    if (redisClient.isOpen) {
        return;
    }

    // Connection is already being established
    if (redisConnectionPromise) {
        return redisConnectionPromise;
    }

    redisConnectionPromise = connectRedis()
        .catch((error) => {
            redisConnectionPromise = null;

            console.error("❌ Redis Connection Failed");
            console.error(error.message);

            throw error;
        });

    return redisConnectionPromise;
};


// ======================================================
// Database / Redis middleware
// ======================================================

app.use(async (req, res, next) => {

    try {

        await connectDatabase();
        await connectRedisServerless();

        next();

    } catch (error) {

        next(error);

    }

});


// ======================================================
// Stripe Webhook
// IMPORTANT: Must be before express.json()
// ======================================================

app.post(
    "/api/v1/Orders/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook
);


// ======================================================
// Middlewares
// ======================================================

app.use(express.json());

app.use(helmet());

app.use(cors());

app.use(compression());

app.use(morgan("tiny"));


// Express 5 fix:
// sanitize req.body and req.params manually
app.use((req, res, next) => {

    if (req.body) {
        mongoSanitize.sanitize(req.body);
    }

    if (req.params) {
        mongoSanitize.sanitize(req.params);
    }

    next();

});


// Rate limiter
app.use(limiter);


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
        message: "ShopSphere API is running 🚀"
    });

});


// ======================================================
// Error Handling
// ======================================================

app.use(notFound);

app.use(globalError);


// ======================================================
// Export
// ======================================================

module.exports = app;