const {
  CHATBOT_SERVICE_URL,
  MOOD_ANALYTICS_URL,
  RECOMMENDATION_SERVICE_URL,
} = require("../config/env");

function getRoot(_req, res) {
  res.json({ message: "MindSafe Backend Running" });
}

function getHealth(_req, res) {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Fire-and-forget health pings to all Render-hosted microservices.
 * Responds immediately; services wake up in the background.
 */
function warmup(_req, res) {
  const services = [
    { name: "chatbot", url: `${CHATBOT_SERVICE_URL}/health` },
    { name: "mood", url: `${MOOD_ANALYTICS_URL}/health` },
    { name: "recommendation", url: `${RECOMMENDATION_SERVICE_URL}/health` },
  ];

  // Fire all pings — don't await, just kick-start the cold starts
  services.forEach(({ url }) => {
    fetch(url, { signal: AbortSignal.timeout(60_000) }).catch(() => {});
  });

  res.json({
    status: "warming up",
    services: services.map((s) => s.name),
  });
}

module.exports = {
  getRoot,
  getHealth,
  warmup,
};
