import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../server/src/app.js";

/**
 * Vercel Serverless Function entry point.
 * Delegates all /api/* requests to the existing Express app.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
