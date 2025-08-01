import express from "express";
import Party from "../models/Party";

const router = express.Router();

// 전체 파티 목록 조회 (필터 가능)
router.get("/", async (req, res) => {
  try {
    const { map, subMap, position } = req.query;

    let filter: any = {};
    if (map) filter.map = map;
    if (subMap) filter.subMap = subMap;
    if (position) filter.positions = position;

    const parties = await Party.find(filter).sort({ createdAt: -1 });
    res.json(parties);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// 파티 모집글 등록
router.post("/", async (req, res) => {
  try {
    const { map, subMap, positions, content } = req.body;
    if (!map || !subMap || !positions || !content) {
      return res.status(400).json({ message: "필수 항목 누락" });
    }

    const newParty = new Party({ map, subMap, positions, content });
    await newParty.save();

    res.status(201).json(newParty);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// 모집글 삭제
router.delete("/:id", async (req, res) => {
  try {
    await Party.findByIdAndDelete(req.params.id);
    res.json({ message: "삭제 완료" });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
