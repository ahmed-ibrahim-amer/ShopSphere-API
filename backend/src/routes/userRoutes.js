const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/User');
const   { VerifyToken , VerifyRole , VerifyAdmin} =require('../middlewares/VerifyToken')



router
.get('/',VerifyToken,userControllers.GetAllUsers);

router
.get('/:id',VerifyToken,userControllers.getUserById);

router
.delete('/:id',VerifyToken,VerifyAdmin,userControllers.DeleteUser);


module.exports = router;