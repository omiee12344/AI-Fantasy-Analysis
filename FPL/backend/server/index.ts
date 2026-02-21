import express from "express";
import cors from "cors";
import playersRouter from "./routes/players";
import opponentsRouter from "./routes/opponents";
import teamRouter from "./routes/team";
import authRouter from "./routes/auth";
import fplRouter from "./routes/fpl";
import aiOverviewRouter from "./routes/ai-overview";

const app = express();
app.use(cors({ origin: ["http://localhost:8081", "http://localhost:8082", "http://localhost:5173"], credentials: false }));
app.use(express.json());

// Health check (optional)
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Mount routers (this creates /api/players/* and /api/fpl/opponents/*)
app.use("/api", playersRouter);
app.use("/api", opponentsRouter);
app.use("/api/team", teamRouter);
app.use("/api", authRouter);
app.use("/api", fplRouter);
app.use("/api/ai-overview", aiOverviewRouter);

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => console.log(`API listening at http://localhost:${PORT}`));
