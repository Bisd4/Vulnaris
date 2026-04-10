import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitInfo {
    windowStart: number;
    count: number;
}

/**
 * Simple in-memory rate limiter to prevent abuse on the API endpoints.
 * Configured limits: MAX_REQUESTS per WINDOW_MS.
 */
class RateLimiter {
    private store: Map<string, RateLimitInfo> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number, maxRequests: number) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        // Cleanup stale entries every 5 minutes to prevent memory leaks
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    public isRateLimited(identifier: string): boolean {
        const now = Date.now();
        const record = this.store.get(identifier);

        if (!record) {
            this.store.set(identifier, { windowStart: now, count: 1 });
            return false;
        }

        if (now - record.windowStart > this.windowMs) {
            // Window expired, reset
            this.store.set(identifier, { windowStart: now, count: 1 });
            return false;
        }

        if (record.count >= this.maxRequests) {
            // Limit reached
            return true;
        }

        // Increment count
        record.count += 1;
        this.store.set(identifier, record);
        return false;
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
            if (now - record.windowStart > this.windowMs) {
                this.store.delete(key);
            }
        }
    }
}

// Global fallback instance: 10 requests per 1 minute per IP
const globalRateLimiter = new RateLimiter(60 * 1000, 10);

// Initialize Upstash Redis if environment variables are present (Production/Vercel)
const redisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
let upstashRatelimit: Ratelimit | null = null;

if (redisConfigured) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    // Limit: 10 requests per 60 seconds
    upstashRatelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(10, "60 s"),
    });
}

/**
 * Universal Rate Limiter check.
 * Uses distributed Redis if configured, otherwise silently falls back to local memory.
 */
export async function checkRateLimit(identifier: string): Promise<boolean> {
    if (upstashRatelimit) {
        const { success } = await upstashRatelimit.limit(identifier);
        return !success; // true means the user is blocked
    }
    // Development fallback
    return globalRateLimiter.isRateLimited(identifier);
}

export function getClientIp(req: NextRequest): string {
    // SECURITY PATCH: IP Spoofing Prevention
    // Never trust x-forwarded-for blindly. Users can manually write this header.
    // We only trust headers that are cryptographically enforced by the edge network/hosting.

    // 1. Vercel Enforced IP (if deployed on Vercel)
    const vercelIp = req.headers.get('x-vercel-forwarded-for');
    if (vercelIp && vercelIp !== '::1') return vercelIp.split(',')[0].trim();

    // 2. Cloudflare Enforced IP (if deployed behind Cloudflare)
    const cfIp = req.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    // 3. Fallback: Localhost / Direct connection IP (No proxy)
    // Note: If you are behind a regular load balancer, you must configure it carefully
    const realIp = req.headers.get('x-real-ip');
    if (realIp) return realIp;

    return 'unknown';
}
