import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "@expense-tracker/redis";

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    message: { error: "Too many requests, please try again later." },
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(...args),
        prefix: "rl:auth:",
    }),
    message: { error: "Too many authentication attempts, please try again later." },
});
