const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
let botProcess = null;

// 🔧 Middleware
app.use(express.static('.'));
app.use(express.json());

// 🐾 POST route to configure and launch ShippoBot
app.post('/start-bot', (req, res) => {
  const { username, oauth, channel, openai } = req.body;

  console.log("📨 Received bot config:", req.body);

  // 🧱 Validate fields
  if (!username || !oauth || !channel) {
    console.warn("⚠️ Missing required field(s)");
    return res.status(400).send("Missing required fields: username, oauth, or channel.");
  }

  // 📜 Generate .env content
  const envContent = [
    `TWITCH_USERNAME=${username}`,
    `TWITCH_OAUTH=${oauth}`,
    `TWITCH_CHANNEL=${channel}`,
    `OPENAI_API_KEY=${openai || ''}`
  ].join('\n');

  // 💾 Write .env
  try {
    fs.writeFileSync(path.join(__dirname, '.env'), envContent, { encoding: 'utf8' });
    console.log("✅ .env saved.");
  } catch (err) {
    console.error("❌ Failed to write .env:", err);
    return res.status(500).send("Failed to write .env.");
  }

  // 🧼 Remove config.json if it exists
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      fs.unlinkSync(configPath);
      console.log("🧹 Removed old config.json");
    } catch (err) {
      console.warn("⚠️ Failed to delete config.json:", err.message);
    }
  }

  // 💀 Kill any existing bot process
  if (botProcess) {
    console.log("♻️ Terminating previous ShippoBot instance...");
    botProcess.kill();
  }

  // 🚀 Launch bot.js
  console.log("🚀 Launching new ShippoBot instance...");
  botProcess = spawn('node', ['bot.js'], { stdio: 'pipe' });

  // 🪵 Pipe logs
  botProcess.stdout.on('data', (data) => {
    process.stdout.write(`[ShippoBot STDOUT]: ${data}`);
  });

  botProcess.stderr.on('data', (data) => {
    process.stderr.write(`[ShippoBot STDERR]: ${data}`);
  });

  botProcess.on('close', (code) => {
    console.log(`⚰️ ShippoBot exited with code ${code}`);
  });

  res.send(`✅ ShippoBot launched for channel: ${channel}`);
});

// 🎧 Start the server
app.listen(PORT, () => {
  console.log(`🖥️ ShippoBot Control Panel running at: http://localhost:${PORT}`);
});
