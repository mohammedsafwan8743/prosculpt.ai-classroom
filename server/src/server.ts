import app from "./app.js";
import { env } from "./config/env.js";

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║  🎓 Prosculpt.ai Server                 ║
  ║  Running on http://localhost:${PORT}       ║
  ║  Environment: ${env.NODE_ENV.padEnd(24)}║
  ╚══════════════════════════════════════════╝
  `);
});
