import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
});
