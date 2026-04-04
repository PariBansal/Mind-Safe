function getRoot(_req, res) {
  res.json({ message: "MindSafe Backend Running" });
}

function getHealth(_req, res) {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      chatbot: process.env.CHATBOT_SERVICE_URL || "(not set)",
      emotion: process.env.EMOTION_DETECTION_URL || "(not set)",
      mood: process.env.MOOD_ANALYTICS_URL || "(not set)",
      crisis: process.env.CRISIS_DETECTION_URL || "(not set)",
    },
  });
}

module.exports = {
  getRoot,
  getHealth,
};
