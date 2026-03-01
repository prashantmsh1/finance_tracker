import rateLimit from "express-rate-limit";

/**
 * General API rate limiter: 100 requests per 15-minute window.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});

/**
 * Stricter limiter for auth endpoints (login/register): 20 requests per 15-minute window.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication attempts, please try again later." },
});
