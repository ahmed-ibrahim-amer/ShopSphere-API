const express = require('express');
const router = express.Router();

const authController = require('../controllers/Authentication');
const {VerifyToken} = require('../middlewares/VerifyToken');

/**
 * @swagger
 * /Auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ahmed Ibrahim
 *               email:
 *                 type: string
 *                 example: ahmed@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *               phone:
 *                 type: number
 *                 example: 1012345678
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register' , authController.Register);


/**
 * @swagger
 *  /Auth/Login:
 *   post:
 *     summary: Login a user
 *     description: Login user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *           properties:
 *             email:
 *               type: string
 *               example: ahmed@example.com
 *             password:
 *               type: string
 *               example: Password123
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Invalid Email or Password
 */
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