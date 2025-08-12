// middlewares/auth.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const secret = process.env.JWT_SECRET || 'your-secret';
if (!secret) {
  throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
}

export interface JwtUserPayload extends JwtPayload {
  id: string;
  username: string;
  avatar?: string;
  discordId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

/** 로그인 없어도 통과. 토큰이 있으면 req.user 설정 */
export const authOptional: RequestHandler = (req, _res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return next();

  const token = h.slice(7);
  try {
    const decoded = jwt.verify(token, secret) as JwtUserPayload;
    (req as AuthenticatedRequest).user = decoded;
  } catch {
    // 유효하지 않은 토큰이면 무시하고 익명으로 진행
  }
  next();
};

/** 반드시 인증 필요할 때 사용 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({ error: "인증 토큰이 없습니다." });
  }

  const token = h.slice(7);
  try {
    const decoded = jwt.verify(token, secret) as JwtUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};
