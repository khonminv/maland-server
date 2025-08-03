import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "your_secret";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('❌ No valid auth header'); // 추가
    return res.status(401).json({ error: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];
  console.log('🔑 Token:', token.substring(0, 20) + '...'); // 추가

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      username: string;
      avatar?: string;
    };
    
    console.log('✅ Decoded user:', decoded); // 추가
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err); // 추가
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};