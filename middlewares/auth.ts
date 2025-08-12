import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || 'your-secret';

if (!secret) {
  throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    avatar?: string;
    discordId?: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('❌ No valid auth header');
    return res.status(401).json({ error: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      username: string;
      avatar?: string;
      discordId?: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err);
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};
