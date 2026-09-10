const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.ACCES_TOKEN_SECRET;

function requireJwtSecret() {
    if (!JWT_SECRET) {
        const error = new Error('ACCESS_TOKEN_SECRET ni nastavljen.');
        error.status = 500;
        throw error;
    }
    return JWT_SECRET;
}

module.exports = { requireJwtSecret };
