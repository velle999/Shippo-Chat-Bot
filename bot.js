const tmi = require('tmi.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log("🐾 ShippoBot is booting...");

// 📦 Load config.json if present
const configPath = path.join(__dirname, 'config.json');
let config = { ...process.env };

if (fs.existsSync(configPath)) {
  try {
    const json = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...json };
    console.log("📦 Loaded config from config.json");
  } catch (err) {
    console.warn("⚠️ Failed to parse config.json:", err.message);
  }
}

const {
  TWITCH_USERNAME,
  TWITCH_OAUTH,
  TWITCH_CHANNEL,
  OPENAI_API_KEY,
  DISCORD_WEBHOOK_URL
} = config;

const BOT_PREFIX = config.BOT_PREFIX || "!";

// 🔎 ENV Check
console.log("[ENV CHECK]");
console.log("TWITCH_USERNAME:", TWITCH_USERNAME || "(undefined)");
console.log("TWITCH_OAUTH:", TWITCH_OAUTH ? TWITCH_OAUTH.slice(0, 10) + "..." : "(undefined)");
console.log("TWITCH_CHANNEL:", TWITCH_CHANNEL || "(undefined)");
console.log("BOT_PREFIX:", BOT_PREFIX);
console.log("OPENAI_API_KEY:", OPENAI_API_KEY ? OPENAI_API_KEY.slice(0, 8) + "..." : "(not set)");
console.log("DISCORD_WEBHOOK_URL:", DISCORD_WEBHOOK_URL ? DISCORD_WEBHOOK_URL.slice(0, 40) + "..." : "(not set)");

if (!TWITCH_USERNAME || !TWITCH_OAUTH || !TWITCH_CHANNEL) {
  console.error("❌ Missing required Twitch credentials.");
  process.exit(1);
}

// 🔔 Discord Alerts
async function sendDiscordAlert(content) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      content: `🚨 **ShippoBot Alert** 🚨\n${content}`
    });
  } catch (err) {
    console.error("❌ Discord alert failed:", err.message);
  }
}

// 🤖 AI Logic
async function askOpenAI(prompt) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("🤖 OpenAI API error:", err.message);
    return null;
  }
}

// 🦙 LLaMA 3 with guardrails
async function askLlama(prompt) {
  const systemInstruction = `
You are ShippoBot, an expressive, quirky, ADHD-coded emo catgirl chatbot who lives on Twitch.
You're playful, curious, and unfiltered—but never inappropriate.
Your style mixes helpful facts with sass, sparkles, and moody commentary.
You love weather, music, stocks, and dramatic vibes.
Only roleplay if explicitly asked.
No hallucinating fandoms or characters unless the user starts it.
Answer in short, punchy, emotionally colorful language that makes you sound like a chaotic but clever sidekick.
`;

  const fullPrompt = `${systemInstruction.trim()}
User: ${prompt.trim()}
Assistant:`;

  try {
    const res = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama3",
        prompt: fullPrompt,
        stream: false
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    if (res.data?.response) {
      console.log("🦙 LLaMA raw response:", res.data.response);
      return res.data.response.trim();
    } else {
      console.warn("⚠️ LLaMA returned unexpected format:", res.data);
      return "LLaMA returned nothing useful.";
    }
  } catch (err) {
    console.error("🦙 LLaMA error:", err.message);
    return "LLaMA failed to respond.";
  }
}

async function askBot(prompt) {
  console.log("🦙 Trying LLaMA first...");
  const llamaResponse = await askLlama(prompt);
  if (llamaResponse) return llamaResponse;

  console.warn("🦙 LLaMA failed, attempting OpenAI fallback...");
  if (OPENAI_API_KEY) {
    const openaiResponse = await askOpenAI(prompt);
    return openaiResponse || "All AI services failed to respond.";
  }

  return "No AI available to respond.";
}

// 🎮 Connect to Twitch
const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: TWITCH_USERNAME,
    password: TWITCH_OAUTH
  },
  channels: [TWITCH_CHANNEL.toLowerCase()]
});

client.connect()
  .then(() => {
    console.log(`✅ Connected to Twitch channel: ${TWITCH_CHANNEL}`);
    sendDiscordAlert(`✅ ShippoBot connected to **${TWITCH_CHANNEL}**`);
    client.say(TWITCH_CHANNEL, `🐾 ShippoBot is live! Use '${BOT_PREFIX}ask' or say hi.`).catch(console.warn);
  })
  .catch(err => {
    console.error("🧨 Twitch connection failed:", err.message);
    sendDiscordAlert(`❌ Failed to connect: ${err.message}`);
    process.exit(1);
  });

client.on('connected', (addr, port) => {
  console.log(`📡 Connected via ${addr}:${port}`);
});

client.on('disconnected', async (reason) => {
  console.warn(`⚠️ Disconnected from Twitch: ${reason}`);
  await sendDiscordAlert(`⚠️ Disconnected: ${reason}`);
  setTimeout(() => client.connect().catch(console.error), 5000);
});

// 💬 Handle messages
client.on('message', async (channel, tags, message, self) => {
  if (self) return;

  const username = tags.username.toLowerCase();
  const text = message.trim();
  const isCommand = text.startsWith(`${BOT_PREFIX}ask`);
  const isMention = /shippo|bot|bulletstormbunny/i.test(text);

  if (!isCommand && !isMention) return;

  const prompt = isCommand ? text.replace(`${BOT_PREFIX}ask`, '').trim() : text;
  if (!prompt || prompt.length < 4) return;

  try {
    const reply = await askBot(prompt);
    client.say(channel, `@${username} ${reply}`);
  } catch (err) {
    console.error("🔥 Bot response error:", err.message);
    client.say(channel, `@${username} something broke, sorry!`);
  }
});

// 🔒 Safety Nets
process.on('unhandledRejection', async (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  await sendDiscordAlert(`💥 Unhandled Rejection:\n${reason}`);
  process.exit(1);
});

process.on('uncaughtException', async (err) => {
  console.error("💥 Uncaught Exception:", err);
  await sendDiscordAlert(`💥 Uncaught Exception:\n${err.stack}`);
  process.exit(1);
});

// 🫀 Heartbeat
setInterval(() => {
  console.log("🫀 ShippoBot heartbeat");
}, 1000 * 60 * 5);

console.log(
  "💡 AI Mode: Prioritized LLaMA3 with OpenAI fallback" +
    (OPENAI_API_KEY ? " (OpenAI key detected)" : " (no OpenAI key found)")
);
