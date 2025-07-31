// routes/party.ts
import express from "express";
import Party from "../models/Party";

const router = express.Router();

// 파티 목록 가져오기
router.get("/", async (req, res) => {
  const { search, mapName } = req.query;

  const query: any = {};
  if (mapName) query.mapName = mapName;
  if (search) query.title = { $regex: search, $options: "i" };

  const parties = await Party.find(query).sort({ createdAt: -1 });
  res.json(parties);
});

// 파티 모집 글 작성
router.post("/", async (req, res) => {
  const { mapName, title, description, userId, type, maxMember } = req.body;

  if (!mapName || !title || !userId) {
    return res.status(400).json({ error: "필수 항목이 누락됨" });
  }

  const newParty = new Party({
    mapName,
    title,
    description,
    userId,
    type,
    maxMember,
  });

  await newParty.save();
  res.status(201).json(newParty);
});

// 파티 삭제
router.delete("/:id", async (req, res) => {
  await Party.findByIdAndDelete(req.params.id);
  res.json({ message: "삭제됨" });
});

export default router;
