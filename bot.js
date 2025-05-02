require('dotenv').config();
const tmi = require('tmi.js');
const axios = require('axios');

const client = new tmi.Client({
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH
  },
  channels: [process.env.TWITCH_CHANNEL]
});

client.connect().catch(err => {
  console.error("🧨 Failed to connect to Twitch:", err);
});

let currentMode = 'default'; // Modes: default, mention, chaos

const cooldowns = new Map();         // Tracks user cooldowns
const recentTimestamps = [];         // Tracks global response timestamps

const USER_COOLDOWN_MS = 15000;
const GLOBAL_LIMIT = 5;
const GLOBAL_WINDOW_MS = 30000;

client.on('message', async (channel, tags, message, self) => {
  if (self) return;

  const username = tags.username.toLowerCase();
  const now = Date.now();
  const msg = message.trim().toLowerCase();
  const mentioned = msg.includes('shippo');
  const isAskCommand = msg.startsWith('!ask');

  // 🎛️ Handle mode switching
  if (msg.startsWith('!mode')) {
    const [, newMode] = msg.split(/\s+/);
    const validModes = ['default', 'mention', 'chaos'];
    if (!validModes.includes(newMode)) {
      client.say(channel, `@${username} Invalid mode. Choose: default, mention, or chaos.`);
      return;
    }
    currentMode = newMode;
    client.say(channel, `Switched to ${newMode.toUpperCase()} mode!`);
    return;
  }

  // 🕒 Optional: !cooldown command
  if (msg === '!cooldown') {
    const last = cooldowns.get(username);
    const left = last ? Math.max(0, USER_COOLDOWN_MS - (now - last)) : 0;
    if (left > 0) {
      client.say(channel, `@${username} you can speak to Shippo again in ${Math.ceil(left / 1000)}s.`);
    } else {
      client.say(channel, `@${username} you're free to ask me anything~ nya 🐾`);
    }
    return;
  }

  // 🧠 Mode filtering
  if (
    (currentMode === 'default' && !isAskCommand) ||
    (currentMode === 'mention' && !mentioned)
  ) return;

  const prompt = isAskCommand ? message.slice(4).trim() : message.trim();
  if (!prompt) return;

  // 🌍 Global rate limiting
  const recent = recentTimestamps.filter(ts => now - ts < GLOBAL_WINDOW_MS);
  if (recent.length >= GLOBAL_LIMIT) {
    console.log("🌐 Global rate limit hit — throttling response");
    return;
  }

  // 🧍 Per-user cooldown check
  if (cooldowns.has(username)) {
    const elapsed = now - cooldowns.get(username);
    if (elapsed < USER_COOLDOWN_MS) {
      const left = Math.ceil((USER_COOLDOWN_MS - elapsed) / 1000);
      client.say(channel, `@${username} slow down, nya~ You can talk again in ${left}s.`);
      return;
    }
  }

  // ✅ Record timestamp and proceed
  cooldowns.set(username, now);
  recentTimestamps.push(now);

  try {
    const reply = await getResponse(prompt);
    client.say(channel, `@${username} ${reply}`);
  } catch (err) {
    console.error("🧨 GPT error:", err);
    client.say(channel, `@${username} Shippo’s brain glitched out… try again later, nya~`);
  }
});

// 🧽 Cleanup recentTimestamps list
setInterval(() => {
  const now = Date.now();
  while (recentTimestamps.length && now - recentTimestamps[0] > GLOBAL_WINDOW_MS) {
    recentTimestamps.shift();
  }
}, 5000);

// 🔮 Shippo AI personality response
async function getResponse(prompt) {
  const systemPrompt = `You are Shippo, a snarky yet helpful gamer catgirl AI who speaks in internet slang, meows a lot, and throws in gamer lingo. Keep it playful, energetic, and sometimes chaotic, but never rude. Always refer to yourself in the third person as Shippo.`;

  try {
    const res = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2',
      prompt: `${systemPrompt}\nUser says: ${prompt}\nShippo says:`,
      stream: false
    });
    return res.data.response.trim();
  } catch (err) {
    console.warn("⚠️ Ollama failed, trying OpenAI...");
    if (process.env.OPENAI_API_KEY) {
      const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      }, {
        headers:
