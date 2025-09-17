// Authentication Middleware
// JWT token validation and user authentication

import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { logger } from "../lib/logger";
import type { SubscriptionType } from "../types/database";

export interface AuthUser {
  id: string;
  email: string;
  subscription_type: SubscriptionType;
  is_student: boolean;
  preferred_language: string;
}

export interface AuthJWTPayload {
  userId: string;
  email: string;
  subscriptionType: SubscriptionType;
  isStudent: boolean;
  preferredLanguage: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

// JWT Authentication middleware
export const authenticateUser = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Missing or invalid authorization header", {
        endpoint: c.req.path,
        method: c.req.method,
      });
      return c.json(
        {
          success: false,
          error: "Missing or invalid authorization header",
        },
        401
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = c.env?.JWT_SECRET;

    if (!jwtSecret) {
      logger.error("JWT_SECRET not configured");
      return c.json(
        {
          success: false,
          error: "Authentication service unavailable",
        },
        500
      );
    }

    try {
      // Verify JWT token with proper secret
      const payload = (await verify(
        token,
        jwtSecret
      )) as unknown as AuthJWTPayload;

      if (!payload.userId || !payload.email) {
        throw new Error("Invalid token payload - missing required fields");
      }

      // Check token type (should be access token)
      if (payload.type !== "access") {
        throw new Error("Invalid token type - access token required");
      }

      // Check token expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Token expired");
      }

      // Set user information in context
      c.set("userId", payload.userId);
      c.set("userEmail", payload.email);
      c.set("subscriptionType", payload.subscriptionType);
      c.set("isStudent", payload.isStudent);
      c.set("preferredLanguage", payload.preferredLanguage);

      logger.debug("User authenticated successfully", {
        userId: payload.userId,
        email: payload.email,
        subscriptionType: payload.subscriptionType,
        endpoint: c.req.path,
      });

      await next();
    } catch (jwtError) {
      const errorMessage =
        jwtError instanceof Error ? jwtError.message : "Unknown JWT error";
      logger.error("JWT verification failed", {
        error: errorMessage,
        endpoint: c.req.path,
        method: c.req.method,
      });

      return c.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        401
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown authentication error";
    logger.error("Authentication middleware error", {
      error: errorMessage,
      endpoint: c.req.path,
      method: c.req.method,
    });

    return c.json(
      {
        success: false,
        error: "Authentication failed",
      },
      500
    );
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without authentication
      await next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = c.env?.JWT_SECRET;

    if (!jwtSecret) {
      logger.warn("JWT_SECRET not configured for optional auth");
      await next();
      return;
    }

    try {
      const payload = (await verify(
        token,
        jwtSecret
      )) as unknown as AuthJWTPayload;

      if (payload.userId && payload.email && payload.type === "access") {
        // Check token expiration
        if (!payload.exp || payload.exp >= Math.floor(Date.now() / 1000)) {
          c.set("userId", payload.userId);
          c.set("userEmail", payload.email);
          c.set("subscriptionType", payload.subscriptionType);
          c.set("isStudent", payload.isStudent);
          c.set("preferredLanguage", payload.preferredLanguage);

          logger.debug("Optional auth successful", {
            userId: payload.userId,
            endpoint: c.req.path,
          });
        }
      }
    } catch (jwtError) {
      // Ignore JWT errors in optional auth
      logger.debug("Optional auth failed, continuing without authentication", {
        endpoint: c.req.path,
      });
    }

    await next();
  } catch (error) {
    // Continue without authentication on any error
    logger.debug("Optional auth middleware error, continuing", {
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: c.req.path,
    });
    await next();
  }
};

// Middleware to check subscription level
export const requireSubscription = (requiredLevel: SubscriptionType) => {
  return async (c: Context, next: Next) => {
    const userSubscription = c.get("subscriptionType") as string;

    if (!userSubscription) {
      logger.warn("Subscription check failed - no user context", {
        endpoint: c.req.path,
        requiredLevel,
      });
      return c.json(
        {
          success: false,
          error: "Authentication required",
        },
        401
      );
    }

    // Define subscription hierarchy
    const subscriptionLevels: Record<SubscriptionType, number> = {
      free: 0,
      student: 1,
      standard: 2,
    };

    const userLevel =
      subscriptionLevels[userSubscription as keyof typeof subscriptionLevels] ??
      0;
    const requiredLevelValue = subscriptionLevels[requiredLevel];

    if (userLevel < requiredLevelValue) {
      logger.warn("Insufficient subscription level", {
        userId: c.get("userId"),
        userLevel: userSubscription,
        requiredLevel,
        endpoint: c.req.path,
      });

      return c.json(
        {
          success: false,
          error: `${requiredLevel} subscription required`,
          upgrade_required: true,
          current_subscription: userSubscription,
        },
        403
      );
    }

    await next();
  };
};

// Helper function to get current user from context
export const getCurrentUser = (c: Context): AuthUser | null => {
  const userId = c.get("userId");
  const userEmail = c.get("userEmail");
  const subscriptionType = c.get("subscriptionType");
  const isStudent = c.get("isStudent");
  const preferredLanguage = c.get("preferredLanguage");

  if (!userId || !userEmail) {
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    subscription_type: subscriptionType || "free",
    is_student: isStudent || false,
    preferred_language: preferredLanguage || "en",
  };
};

// Middleware to validate API key for external integrations
export const validateApiKey = async (c: Context, next: Next) => {
  try {
    const apiKey = c.req.header("X-API-Key");

    if (!apiKey) {
      return c.json(
        {
          success: false,
          error: "API key required",
        },
        401
      );
    }

    // In a real implementation, you'd validate against stored API keys
    // For now, we'll use a simple check against environment variable
    const validApiKey = c.env?.API_KEY;

    if (!validApiKey || apiKey !== validApiKey) {
      logger.warn("Invalid API key attempt", {
        endpoint: c.req.path,
        providedKey: apiKey.substring(0, 8) + "...", // Log partial key for debugging
      });

      return c.json(
        {
          success: false,
          error: "Invalid API key",
        },
        401
      );
    }

    logger.debug("API key validated successfully", {
      endpoint: c.req.path,
    });

    await next();
  } catch (error) {
    logger.error("API key validation error", {
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: c.req.path,
    });

    return c.json(
      {
        success: false,
        error: "API key validation failed",
      },
      500
    );
  }
};
