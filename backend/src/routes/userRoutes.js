const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/User');
const  {VerifyAdmin} =require('../middlewares/VerifyToken')



router.get('/',userControllers.GetAllUsers);
router.get('/:id',userControllers.getUserById);

router.delete('/:id',VerifyAdmin,userControllers.DeleteUser);


module.exports = router;