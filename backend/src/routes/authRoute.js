const express = require('express');
const router = express.Router();

const authController = require('../controllers/Authentication');
const {VerifyToken} = require('../middlewares/VerifyToken');



router.post('/register' , authController.Register);
router.post('/Login' , authController.Login);


router.get('/profile',VerifyToken,(req,res)=>{
    res.status(200).json({
        status:true,
        message: 'You are authenticated',
        user: req.user
    })
});

router.post(
    '/refresh-token',
    authController.RefreshToken
);
router.post(
    '/Logout',
    authController.Logout
)
module.exports = router;