// index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import partyRoutes from "./routes/party";
import tradeRoutes from "./routes/trades";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.NODE_ENV === "production"
  ? [process.env.FRONTEND_URL || "https://your-production-frontend.com"]
  : ["http://localhost:3000"]; // 개발용 프론트 주소

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      // Postman, 서버에서 직접 요청하는 경우도 허용
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.use("/trades", tradeRoutes);
app.use("/party", partyRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
