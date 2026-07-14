import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { rbac } from "../../middleware/rbac.js";

const router = Router();

/**
 * POST /api/livekit/token
 * Generate a LiveKit room token for the authenticated user.
 * Trainer role can create rooms; students can join existing rooms.
 */
router.post(
  "/token",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { env } = await import("../../config/env.js");

      const { room_name, participant_name } = req.body;

      if (!room_name || !participant_name) {
        res.status(400).json({ error: "room_name and participant_name are required" });
        return;
      }

      if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
        res.json({
          token: "mock-token-simulation-mode",
          ws_url: "mock-ws-url",
          simulation: true,
        });
        return;
      }

      // Dynamic import — LiveKit SDK will be used when credentials are configured
      const { AccessToken } = await import("livekit-server-sdk");

      const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
        identity: req.user!.id,
        name: participant_name,
      });

      token.addGrant({
        room: room_name,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      });

      const jwt = await token.toJwt();

      res.json({
        token: jwt,
        ws_url: env.VITE_LIVEKIT_WS_URL,
      });
    } catch (err: any) {
      console.error("[POST /livekit/token] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Failed to generate token" });
    }
  }
);

export default router;
