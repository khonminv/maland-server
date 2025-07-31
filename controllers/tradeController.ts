import { Request, Response } from "express";
import Trade from "../models/Trade";

export const getAveragePrices = async (_: Request, res: Response) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2시간 전

    const averages = await Trade.aggregate([
      {
        $match: {
          isCompleted: true,
          createdAt: { $gte: twoHoursAgo },
          $and: [
            { subMap: { $exists: true } },
            { subMap: { $ne: null } },
            { subMap: { $ne: "" } },
          ], // subMap이 존재하고 빈 값이 아닌 것만
        }
      },
      {
        $group: {
          _id: "$subMap", // 서브맵 기준 그룹화
          averagePrice: { $avg: "$price" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          subMap: "$_id",
          averagePrice: { $round: ["$averagePrice", 0] },
          count: 1
        }
      },
      { $sort: { averagePrice: -1 } } // 평균가 내림차순 정렬
    ]);

    res.json(averages);
  } catch (error) {
    res.status(500).json({ message: "평균 가격 계산 실패", error });
  }
};
