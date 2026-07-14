import app from "../server/src/app";

/**
 * Vercel Serverless Function entry point.
 * Delegates all /api/* requests to the existing Express app.
 *
 * Vercel's bundler (esbuild/nft) will trace imports from this file
 * and bundle the entire Express app + dependencies automatically.
 */
export default function handler(req: any, res: any) {
  return app(req, res);
}
