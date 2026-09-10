const jwt = require('jsonwebtoken');
const { requireJwtSecret } = require('../config/auth.js');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    let secret;
    try {
        secret = requireJwtSecret();
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

module.exports = { authenticateToken };
