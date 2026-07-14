/**
 * Vercel Serverless Function entry point.
 * Delegates all /api/* requests to the existing Express app.
 */
let appPromise: Promise<any> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = import("../server/src/app").then((m) => m.default ?? m);
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error("[Vercel API] Fatal error loading Express app:", err);
    res.status(500).json({
      error: "Server initialization failed",
      message: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
  }
}
