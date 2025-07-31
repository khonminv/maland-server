import { Request, Response } from "express";
import Trade from "../models/Trade"; // Trade 모델이 있어야 해요

export const getAveragePrices = async (_: Request, res: Response) => {
  try {
    const averages = await Trade.aggregate([
      { $match: { isCompleted: true } }, // 거래 완료된 것만 선택
      {
        $group: {
          _id: "$mapName", // 맵 이름별로 그룹화
          averagePrice: { $avg: "$price" }, // 가격 평균 계산
        },
      },
      {
        $project: {
          _id: 0,
          mapName: "$_id",
          averagePrice: { $round: ["$averagePrice", 0] }, // 소수점 반올림
        },
      },
      { $sort: { averagePrice: -1 } }, // 가격 높은 순 정렬 (선택)
    ]);

    res.json(averages);
  } catch (error) {
    res.status(500).json({ message: "평균 가격 계산 실패", error });
  }
};
