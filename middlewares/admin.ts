import { Request, Response, NextFunction } from "express";

// 환경변수 예: ADMIN_IDS=1318241174787457075,123456789012345678
const adminSet = new Set(
  (process.env.ADMIN_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const discordId = (req as any).user?.discordId; // authMiddleware가 req.user에 넣어둔 값

  if (!discordId) {
    // 토큰은 있는데 discordId가 없으면 권한 판별 불가
    return res.status(403).json({ message: "관리자 권한이 필요합니다.(no discordId)" });
  }

  if (!adminSet.size) {
    // 운영 중 실수 방지용 로그 (필요 없으면 제거)
    console.warn("[adminMiddleware] ADMIN_IDS가 설정되어 있지 않습니다.");
  }

  if (adminSet.has(discordId)) {
    return next();
  }

  return res.status(403).json({ message: "관리자 권한이 필요합니다." });
};
