import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", appName: "BM Food Express API", timestamp: new Date().toISOString() });
  });

  // Online gateway integration is intentionally disabled until a real provider
  // and webhook signature secret are configured. Never fabricate a paid
  // transaction or report an unverified webhook as successful.
  app.post("/api/payments/create-session", (_req, res) => {
    return res.status(503).json({
      success: false,
      error: "Online payment gateway is not configured. Use a configured payment method.",
    });
  });

  app.post("/api/payments/webhook", (_req, res) => {
    return res.status(503).json({
      received: false,
      verified: false,
      error: "Online payment webhook is not configured.",
    });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BM Food Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start BM Food server:", err);
});
