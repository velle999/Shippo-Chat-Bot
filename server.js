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

// 🐾 POST /start-bot — Launch or restart ShippoBot with config
app.post('/start-bot', (req, res) => {
  const { username, oauth, channel, openai, saveCredentials } = req.body;
  console.log("📨 Received bot config:", req.body);

  if (!username || !oauth || !channel) {
    console.warn("⚠️ Missing required field(s)");
    return res.status(400).send("Missing required fields: username, oauth, or channel.");
  }

  const envContent = [
    `TWITCH_USERNAME=${username}`,
    `TWITCH_OAUTH=${oauth}`,
    `TWITCH_CHANNEL=${channel}`,
    `OPENAI_API_KEY=${openai || ''}`
  ].join('\n');

  // 💾 Write .env
  try {
    fs.writeFileSync(path.join(__dirname, '.env'), envContent, 'utf8');
    console.log("✅ .env saved.");
  } catch (err) {
    console.error("❌ Failed to write .env:", err);
    return res.status(500).send("Failed to write .env.");
  }

  const configPath = path.join(__dirname, 'config.json');

  if (!saveCredentials && fs.existsSync(configPath)) {
    try {
      fs.unlinkSync(configPath);
      console.log("🧹 Removed old config.json");
    } catch (err) {
      console.warn("⚠️ Failed to delete config.json:", err.message);
    }
  }

  if (saveCredentials) {
    const configData = {
      TWITCH_USERNAME: username,
      TWITCH_OAUTH: oauth,
      TWITCH_CHANNEL: channel,
      OPENAI_API_KEY: openai || ''
    };
    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
      console.log("📦 Saved credentials to config.json");
    } catch (err) {
      console.warn("⚠️ Failed to write config.json:", err.message);
    }
  }

  launchBot();

  res.send(`✅ ShippoBot launched for channel: ${channel}`);
});

// 📥 GET /load-config — Load saved credentials for UI autofill
app.get('/load-config', (req, res) => {
  const configPath = path.join(__dirname, 'config.json');

  if (!fs.existsSync(configPath)) {
    return res.status(404).send({ error: 'No saved config found.' });
  }

  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(configData);
    res.json(parsed);
  } catch (err) {
    console.error("❌ Failed to read config.json:", err);
    res.status(500).send({ error: 'Failed to load config.' });
  }
});

// 🧠 Launch Bot Helper
function launchBot() {
  if (botProcess) {
    console.log("♻️ Terminating previous ShippoBot instance...");
    botProcess.kill();
  }

  console.log("🚀 Launching new ShippoBot instance...");
  botProcess = spawn('node', ['bot.js'], { stdio: 'pipe' });

  botProcess.stdout.on('data', data => {
    process.stdout.write(`[ShippoBot STDOUT]: ${data}`);
  });

  botProcess.stderr.on('data', data => {
    process.stderr.write(`[ShippoBot STDERR]: ${data}`);
  });

  botProcess.on('close', code => {
    console.log(`⚰️ ShippoBot exited with code ${code}`);
  });
}

// 🔄 Auto-Boot on Server Start (if config.json exists)
function tryAutoBoot() {
  const configPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(configPath)) return;

  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const { TWITCH_USERNAME, TWITCH_OAUTH, TWITCH_CHANNEL, OPENAI_API_KEY } = configData;

    if (!TWITCH_USERNAME || !TWITCH_OAUTH || !TWITCH_CHANNEL) {
      console.warn("⚠️ config.json missing required fields — skipping auto-boot.");
      return;
    }

    const envContent = [
      `TWITCH_USERNAME=${TWITCH_USERNAME}`,
      `TWITCH_OAUTH=${TWITCH_OAUTH}`,
      `TWITCH_CHANNEL=${TWITCH_CHANNEL}`,
      `OPENAI_API_KEY=${OPENAI_API_KEY || ''}`
    ].join('\n');

    fs.writeFileSync(path.join(__dirname, '.env'), envContent, 'utf8');
    console.log("🔁 Auto-boot: .env regenerated from config.json");

    launchBot();
  } catch (err) {
    console.error("❌ Auto-boot failed:", err);
  }
}

// 🎧 Start the server
app.listen(PORT, () => {
  console.log(`🖥️ ShippoBot Control Panel running at: http://localhost:${PORT}`);
  tryAutoBoot();
});
