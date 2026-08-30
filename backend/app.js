//Library setup
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');





// Import Routes
const Auth = require('../backend/src/routes/authRoute');
const Users = require('../backend/src/routes/userRoutes');
const Products = require('../backend/src/routes/ProductRoutes');
const Category = require('../backend/src/routes/CategoryRoute');
const Cart = require('./src/routes/CartRoutes');  
const Order = require('./src/routes/OrderRoute');
//Route setup
const notFound = require('./src/middlewares/NotFound');
const globalError = require('./src/middlewares/error');


//Middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('tiny'));


// Express 5 fix: sanitize req.body, req.params manually (req.query is read-only now)
app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    next();
});






//routes
app.use('/api/v1/Auth' ,Auth);
app.use('/api/v1/users',Users);
app.use('/api/v1/Products',Products);
app.use('/api/v1/Category',Category);
app.use('/api/v1/Cart',Cart);
app.use('/api/v1/Orders',Order);
// ... after your other middlewares ...
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


//apply middlewares
app.use(globalError);

app.get('/' , (req,res)=>{
    res.status(200).json({
        status:'success',
        message: "ShopSphere API is running 🚀",
    }
    )
});

app.use(notFound);




module.exports = app;