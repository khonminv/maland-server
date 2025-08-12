import { Router, Request, Response } from "express";
import Notice from "../models/Notice";
import {authMiddleware} from "../middlewares/auth";
import {adminMiddleware} from "../middlewares/admin";
import mongoose from "mongoose";

const router = Router();

/**
 * 공지사항 목록 불러오기
 */
router.get("/" ,async (_req: Request, res: Response) => {
  try {
    const notices = await Notice.find().sort({ pinned: -1, createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: "공지사항 불러오기 실패" });
  }
});

/**
 * 공지사항 등록 (관리자 전용)
 */
router.post("/", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, content, severity, pinned } = req.body;
    const newNotice = new Notice({
      title,
      content,
      severity,
      pinned: pinned || false,
    });
    await newNotice.save();
    res.status(201).json(newNotice);
  } catch (err) {
    res.status(500).json({ message: "공지사항 등록 실패" });
  }
});

/**
 * 공지사항 수정
 */
router.put("/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const updatedNotice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedNotice) {
      return res.status(404).json({ message: "공지사항을 찾을 수 없습니다" });
    }
    res.json(updatedNotice);
  } catch (err) {
    res.status(500).json({ message: "공지사항 수정 실패" });
  }
});

/**
 * 공지사항 삭제
 */
router.delete("/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await Notice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "공지사항을 찾을 수 없습니다" });
    }
    res.json({ message: "삭제 완료" });
  } catch (err) {
    res.status(500).json({ message: "공지사항 삭제 실패" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "잘못된 ID 입니다." });
    }
    const notice = await Notice.findById(id);
    if (!notice) return res.status(404).json({ message: "공지사항이 없습니다." });
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: "공지사항 조회 실패" });
  }
});

export default router;
