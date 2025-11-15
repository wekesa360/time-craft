import { Context } from 'hono';
import { AuthService } from '../services/auth-service';
import { logger } from '../lib/logger';

export class AuthController {
  private authService: AuthService;

  constructor(private env: any) {
    this.authService = new AuthService(env);
  }

  login = async (c: Context) => {
    try {
      const { email, password } = await c.req.json();
      
      // Validate input
      if (!email || !password) {
        return c.json(
          { success: false, error: 'Email and password are required' },
          400
        );
      }

      // Get user from database
      const user = await this.getUserByEmail(email);
      if (!user) {
        return c.json(
          { success: false, error: 'Invalid email or password' },
          401
        );
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return c.json(
          { success: false, error: 'Invalid email or password' },
          401
        );
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens({
        id: user.id,
        email: user.email,
        subscriptionType: user.subscription_type,
        isStudent: user.is_student,
        preferredLanguage: user.preferred_language || 'en',
      });

      // Set HTTP-only cookie for refresh token
      c.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.refreshExpiresIn,
        path: '/auth/refresh',
      });

      // Return access token in response
      return c.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            subscriptionType: user.subscription_type,
            isStudent: user.is_student,
            preferredLanguage: user.preferred_language,
          },
        },
      });
    } catch (error) {
      logger.error('Login failed', { error });
      return c.json(
        { success: false, error: 'Authentication failed' },
        500
      );
    }
  };

  refreshToken = async (c: Context) => {
    try {
      // Get refresh token from cookie
      const refreshToken = c.req.cookie('refresh_token');
      if (!refreshToken) {
        return c.json(
          { success: false, error: 'Refresh token is required' },
          400
        );
      }

      // Generate new tokens using refresh token
      const tokens = await this.authService.refreshTokens(refreshToken);

      // Set new refresh token in HTTP-only cookie
      c.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.refreshExpiresIn,
        path: '/auth/refresh',
      });

      // Return new access token
      return c.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      logger.error('Token refresh failed', { error });
      return c.json(
        { success: false, error: 'Failed to refresh token' },
        401
      );
    }
  };

  logout = async (c: Context) => {
    try {
      // Get refresh token from cookie
      const refreshToken = c.req.cookie('refresh_token');
      
      if (refreshToken) {
        try {
          // Verify and get token ID to revoke
          const { verify } = await import('hono/jwt');
          const payload = await verify(refreshToken, this.env.REFRESH_TOKEN_SECRET || this.env.JWT_SECRET + '_refresh') as any;
          
          if (payload.jti) {
            await this.authService.revokeRefreshToken(payload.jti);
          }
        } catch (error) {
          logger.warn('Failed to revoke refresh token during logout', { error });
        }
      }
      
      // Clear refresh token cookie
      c.cookie('refresh_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/auth/refresh',
      });
      
      return c.json({ success: true });
    } catch (error) {
      logger.error('Logout failed', { error });
      return c.json(
        { success: false, error: 'Failed to logout' },
        500
      );
    }
  };

  private async getUserByEmail(email: string) {
    try {
      const user = await this.env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
      )
        .bind(email)
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to get user by email', { email, error });
      return null;
    }
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // In a real implementation, you would use a proper password hashing library
    // like bcrypt or Argon2 to verify the password hash
    const { compare } = await import('bcryptjs');
    try {
      return await compare(password, hash);
    } catch (error) {
      logger.error('Password verification failed', { error });
      return false;
    }
  }
}
