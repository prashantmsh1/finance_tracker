import Redis, { RedisOptions } from "ioredis";

// Centralized Redis client instance
let redisClient: Redis | null = null;

const getRedisClient = (): Redis => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

        const options: RedisOptions = {
            maxRetriesPerRequest: null, // Required by some queues like BullMQ if used later
            enableReadyCheck: false,
        };

        try {
            redisClient = new Redis(redisUrl, options);

            redisClient.on("error", (err) => {
                console.error("❌ Redis connection error:", err);
            });

            redisClient.on("connect", () => {
                console.log("✅ Redis connected successfully");
            });
        } catch (error) {
            console.error("❌ Failed to initialize Redis client:", error);
            throw error;
        }
    }
    return redisClient;
};

// Caching Utils
export const getCache = async <T>(key: string): Promise<T | null> => {
    const client = getRedisClient();
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error reading cache for key ${key}:`, error);
        return null;
    }
};

export const setCache = async (
    key: string,
    value: any,
    ttlSeconds: number = 3600,
): Promise<void> => {
    const client = getRedisClient();
    try {
        await client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
    }
};

export const clearCache = async (keyPattern: string): Promise<void> => {
    const client = getRedisClient();
    try {
        const keys = await client.keys(keyPattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
    } catch (error) {
        console.error(`Error clearing cache for pattern ${keyPattern}:`, error);
    }
};

// Export the singleton instance explicitly if someone needs the raw client
export const redis = getRedisClient();

export default redis;
