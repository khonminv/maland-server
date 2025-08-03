import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import partyRoutes from "./routes/party";
import tradeRoutes from "./routes/trades";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

// Express 앱의 CORS도 허용
app.use(cors({
    origin: allowedOrigin,
    credentials: true  // 이 줄을 추가!
}));

// ✅ JSON 파싱 먼저
app.use(express.json());

// ✅ 로그 찍기
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl} - Origin: ${req.headers.origin}`);
  next();
});

connectDB();

// ✅ 라우트 연결
app.use("/trades", tradeRoutes);
app.use("/party", partyRoutes);
app.use("/auth", authRouter);

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
