import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'taskforge-super-secret-jwt-key-2026';

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Signs and generates a JSON Web Token with a standard lifespan of 7 days.
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Validates the token structure and decodes the payload parameters.
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
