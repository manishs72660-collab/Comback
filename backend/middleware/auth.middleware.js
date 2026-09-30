const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis.js");
const User = require("../models/user.models.js");

const authMiddleware = async (req, res, next) => {
try {
// 1. Get access token from cookie
const accessToken = req.cookies.accessToken;

    if (!accessToken) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    // 2. Verify access token
    let decoded;

    try {
        decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token",
        });
    }

    // 3. Make sure this is an access token
    if (decoded.type !== "access") {
        return res.status(401).json({
            success: false,
            message: "Invalid access token",
        });
    }

    // 4. Check if access token is blacklisted
    const isBlacklisted = await redisClient.get(
        `blacklist:${decoded.jti}`
    );

    if (isBlacklisted) {
        return res.status(401).json({
            success: false,
            message: "Token has been revoked",
        });
    }

    // 5. Find user from MongoDB
    const user = await User.findById(decoded.userId).select(
        "-password"
    );

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "User not found",
        });
    }

    // 6. Store authenticated user in request
    req.user = user;

    // 7. Continue to API
    next();
} catch (error) {
    console.error("Auth Middleware Error:", error);

    return res.status(500).json({
        success: false,
        message: "Authentication error",
    });
}

};

module.exports = authMiddleware;
