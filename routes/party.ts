import express from "express";
import Party from "../models/Party";
import { authMiddleware, authOptional, AuthenticatedRequest } from "../middlewares/auth";

const router = express.Router();


// 전체 파티 목록 조회
router.get("/", authOptional, async (req: AuthenticatedRequest, res) => {
  try {
    const { map, subMap, position } = req.query as {
      map?: string; subMap?: string; position?: string;
    };

    const filter: any = {};
    if (map) filter.map = map;
    if (subMap) filter.subMap = subMap;
    if (position) filter.positions = position;

    const now = Date.now();
    const parties = await Party.find(filter).sort({ createdAt: -1 }).lean();

    const userDiscordId =
      (req as any)?.user?.discordId ? String((req as any).user.discordId).trim() : null;

    const updatedParties = await Promise.all(
      parties.map(async (party: any) => {
        // 2시간 자동 마감
        const createdMs = party.createdAt ? new Date(party.createdAt).getTime() : 0;
        if (!party.isClosed && createdMs && now - createdMs > 2 * 60 * 60 * 1000) {
          await Party.findByIdAndUpdate(party._id, { isClosed: true });
          party.isClosed = true;
        }

        // ✅ 로그인한 경우에만 isApplied 계산
        const isApplied =
          !!userDiscordId &&
          Array.isArray(party.applicants) &&
          party.applicants.some(
            (a: any) => String(a?.discordId || "").trim() === userDiscordId
          );

        return { ...party, isApplied };
      })
    );

    res.json(updatedParties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 모집글 등록 (생성)
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { map, subMap, positions, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증 필요" });
    }
    if (!map || !subMap || !Array.isArray(positions) || positions.length === 0 || !content?.trim()) {
      return res.status(400).json({ message: "필수 항목 누락" });
    }

    const newParty = new Party({
      userId,
      map,
      subMap,
      positions,
      content,
      // createdAt은 스키마 default 사용
    });

    await newParty.save();
    res.status(201).json(newParty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});



// 파티 신청
router.post("/:id/apply", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { discordId, username, avatar, job, level, message, positions } = req.body;

    if (!discordId || !username || !positions || positions.length === 0) {
      return res.status(400).json({ message: "신청자 정보 누락 또는 신청 자리 없음" });
    }

    const party = await Party.findById(id);
    if (!party) return res.status(404).json({ message: "파티를 찾을 수 없습니다." });

    const alreadyApplied = party.applicants?.some((a: any) => a.discordId === discordId);
    if (alreadyApplied) {
      return res.status(400).json({ message: "이미 신청한 파티입니다." });
    }

    party.applicants.push({
      discordId,
      username,
      avatar,
      job,
      level,
      appliedAt: new Date(),
      message: message || "",
      positions,
    });

    await party.save();

    res.json({ message: "신청 완료", party });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// 신청자 목록 조회
router.get("/:id/applicants", async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) return res.status(404).json({ message: "파티를 찾을 수 없습니다." });

    res.json({ applicants: party.applicants || [] });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// 모집 마감 예시
router.patch("/:id/close", async (req, res) => {
  const party = await Party.findById(req.params.id);
  if (!party) return res.status(404).send("Not found");

  party.isClosed = true;
  await party.save();

  res.send({ success: true });
});

// ✅ 파티 상세 조회
router.get("/:id", async (req, res) => {
  try {
    const party = await Party.findById(req.params.id).lean();
    if (!party) {
      return res.status(404).json({ message: "파티를 찾을 수 없습니다." });
    }

    res.json(party);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});


export default router;
