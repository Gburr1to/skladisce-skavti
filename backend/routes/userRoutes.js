var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');
var { authenticateToken } = require('../middleware/authMiddleware');


router.get('/', userController.list);
//router.get('/register', userController.showRegister);
//router.get('/login', userController.showLogin);

/**
 * @swagger
 * /users/profile:
 *    get:
 *        summary: Retrieves the logged-in user's profile
 *        tags: [Users]
 *        description: Fetches profile data for the user identified by the JWT token.
 *        security:
 *            - bearerAuth: []
 *        responses:
 *            '200':
 *                description: User profile data.
 *            '401':
 *                description: Unauthorized.
 */
router.get('/profile', authenticateToken, userController.profile);

/**
 * @swagger
 * /users/logout:
 *    get:
 *        summary: Logs out the user
 *        tags: [Users]
 *        description: Invalidate the session (client-side JWT removal is usually sufficient).
 *        responses:
 *            '200':
 *                description: Logout message.
 */
router.get('/logout', userController.logout);


/**
 * @swagger
 * /users/csrf-token:
 *    get:
 *        summary: Retrieves a CSRF token
 *        tags: [Users]
 *        description: Endpoint for CSRF protection (placeholder in this stateless app).
 *        responses:
 *            '200':
 *                description: CSRF token message.
 */
router.get('/csrf-token', userController.getCsrfToken);


/**
 * @swagger
 * /users/register-dev:
 *    post:
 *        summary: Registers a new user (Dev only)
 *        tags: [Users]
 *        description: Creates a user account without CAPTCHA verification. For testing purposes only.
 *        requestBody:
 *            required: true
 *            content:
 *                application/json:
 *                    schema:
 *                        type: object
 *                        properties:
 *                            username:
 *                                type: string
 *                            password:
 *                                type: string
 *                            email:
 *                                type: string
 *        responses:
 *            '201':
 *                description: User created successfully.
 *            '500':
 *                description: Server error.
 */
router.post('/register-dev', userController.registerDev);


/**
 * @swagger
 * /users/login:
 *    post:
 *        summary: Authenticates a user
 *        tags: [Users]
 *        description: Validates credentials and returns a JWT token.
 *        requestBody:
 *            required: true
 *            content:
 *                application/json:
 *                    schema:
 *                        type: object
 *                        properties:
 *                            username:
 *                                type: string
 *                            password:
 *                                type: string
 *        responses:
 *            '200':
 *                description: Login successful. Returns a JWT.
 *            '401':
 *                description: Invalid credentials.
 */
router.post('/login', userController.login);

router.put('/', authenticateToken, userController.upload.single('image'), userController.update);

router.delete('/:id', authenticateToken, userController.remove);

module.exports = router;
