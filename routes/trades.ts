// routes/trades.ts
import express from "express";
import Trade from "../models/Trade";
import { getAveragePrices } from "../controllers/tradeController";

const router = express.Router();

router.get("/average-prices", getAveragePrices);

// 전체 리스트 가져오기
router.get("/", async (req, res) => {
  const { status, search } = req.query;

  const query: any = {};
  if (status) query.status = status;
  if (search) query.mapName = { $regex: search, $options: "i" };

  const trades = await Trade.find(query).sort({ createdAt: -1 });
  res.json(trades);
});

// 글 하나 등록
router.post("/", async (req, res) => {
  const { mapName, price, description, userId } = req.body;

  if (!mapName || userId == null || price == null) {
    return res.status(400).json({ error: "필수 항목이 빠졌습니다." });
  }

  const priceNum = Number(price);
  if (isNaN(priceNum)) {
    return res.status(400).json({ error: "가격이 숫자가 아닙니다." });
  }

  const newTrade = new Trade({ mapName, price: priceNum, description, userId });
  await newTrade.save();

  res.status(201).json(newTrade);
});


// 상태 변경
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  const trade = await Trade.findByIdAndUpdate(
    req.params.id,
    { status, isCompleted: status === "거래완료" },
    { new: true }
  );
  res.json(trade);
});

// 삭제
router.delete("/:id", async (req, res) => {
  await Trade.findByIdAndDelete(req.params.id);
  res.json({ message: "삭제됨" });
});

export default router;
