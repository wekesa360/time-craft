import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { logger } from '../lib/logger';
import type { AuthJWTPayload } from '../middleware/auth';

export class AuthService {
  private jwtSecret: string;
  private refreshTokenSecret: string;
  
  constructor(private env: any) {
    this.jwtSecret = env.JWT_SECRET;
    this.refreshTokenSecret = env.REFRESH_TOKEN_SECRET || env.JWT_SECRET + '_refresh';
    
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
  }

  async generateTokens(user: {
    id: string;
    email: string;
    subscriptionType: string;
    isStudent: boolean;
    preferredLanguage: string;
  }) {
    const now = Math.floor(Date.now() / 1000);
    const accessTokenExp = now + 15 * 60; // 15 minutes
    const refreshTokenExp = now + 7 * 24 * 60 * 60; // 7 days
    
    // Generate access token
    const accessToken = await sign(
      {
        userId: user.id,
        email: user.email,
        subscriptionType: user.subscriptionType,
        isStudent: user.isStudent,
        preferredLanguage: user.preferredLanguage,
        type: 'access',
        iat: now,
        exp: accessTokenExp,
      },
      this.jwtSecret
    );
    
    // Generate refresh token with a unique identifier
    const refreshTokenId = crypto.randomUUID();
    const refreshToken = await sign(
      {
        jti: refreshTokenId,
        userId: user.id,
        type: 'refresh',
        iat: now,
        exp: refreshTokenExp,
      },
      this.refreshTokenSecret
    );
    
    // Store the refresh token in the database
    try {
      await this.storeRefreshToken({
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(refreshTokenExp * 1000),
        createdAt: new Date(now * 1000),
      });
    } catch (error) {
      logger.error('Failed to store refresh token', { error });
      throw new Error('Failed to generate authentication tokens');
    }
    
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExp - now,
      refreshExpiresIn: refreshTokenExp - now,
    };
  }
  
  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = await verify(refreshToken, this.refreshTokenSecret) as any;
      
      if (payload.type !== 'refresh' || !payload.jti || !payload.userId) {
        throw new Error('Invalid refresh token');
      }
      
      // Check if the token exists in the database and is not revoked
      const tokenInDb = await this.getRefreshToken(payload.jti);
      if (!tokenInDb || tokenInDb.revoked) {
        // If the token was used, revoke all refresh tokens for this user
        if (tokenInDb) {
          await this.revokeAllUserRefreshTokens(payload.userId);
        }
        throw new Error('Invalid or revoked refresh token');
      }
      
      // Get user data
      const user = await this.getUserById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Revoke the used refresh token
      await this.revokeRefreshToken(payload.jti);
      
      // Generate new tokens
      return this.generateTokens({
        id: user.id,
        email: user.email,
        subscriptionType: user.subscription_type,
        isStudent: user.is_student,
        preferredLanguage: user.preferred_language,
      });
    } catch (error) {
      logger.error('Refresh token validation failed', { error });
      throw new Error('Invalid refresh token');
    }
  }
  
  async revokeRefreshToken(tokenId: string) {
    try {
      // Update the token in the database as revoked
      await this.env.DB.prepare(
        'UPDATE refresh_tokens SET revoked = 1 WHERE id = ?'
      ).bind(tokenId).run();
    } catch (error) {
      logger.error('Failed to revoke refresh token', { error });
      throw new Error('Failed to revoke refresh token');
    }
  }
  
  async revokeAllUserRefreshTokens(userId: string) {
    try {
      // Mark all refresh tokens for this user as revoked
      await this.env.DB.prepare(
        'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND revoked = 0'
      ).bind(userId).run();
    } catch (error) {
      logger.error('Failed to revoke user refresh tokens', { userId, error });
      throw new Error('Failed to revoke refresh tokens');
    }
  }
  
  private async storeRefreshToken(token: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
  }) {
    try {
      await this.env.DB.prepare(
        'INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at, revoked) VALUES (?, ?, ?, ?, ?, 0)'
      )
        .bind(
          token.id,
          token.userId,
          token.token,
          token.expiresAt.toISOString(),
          token.createdAt.toISOString()
        )
        .run();
    } catch (error) {
      logger.error('Failed to store refresh token in database', { error });
      throw error;
    }
  }
  
  private async getRefreshToken(tokenId: string) {
    try {
      const result = await this.env.DB.prepare(
        'SELECT * FROM refresh_tokens WHERE id = ?'
      )
        .bind(tokenId)
        .first();
      
      return result || null;
    } catch (error) {
      logger.error('Failed to get refresh token', { error });
      return null;
    }
  }
  
  private async getUserById(userId: string) {
    try {
      const user = await this.env.DB.prepare(
        'SELECT id, email, subscription_type, is_student, preferred_language FROM users WHERE id = ?'
      )
        .bind(userId)
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to get user by ID', { userId, error });
      return null;
    }
  }
}
