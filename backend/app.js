//Library setup
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');



// Import Routes
const Auth = require('../backend/src/routes/authRoute');
const Users = require('../backend/src/routes/userRoutes');
const Products = require('../backend/src/routes/ProductRoutes');

//Route setup
const notFound = require('./src/middlewares/NotFound');
const globalError = require('./src/middlewares/error');


//Middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('tiny'));







//routes
app.use('/api/v1/Auth' ,Auth);
app.use('/api/v1/users',Users);
app.use('/api/v1/Products',Products);

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