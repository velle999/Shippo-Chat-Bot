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

client.connect();

const cooldownUsers = new Set();
const systemPrompt = `You are Shippo, a snarky yet helpful gamer catgirl AI who speaks in internet slang, meows a lot, and throws in gamer lingo. Keep it playful, energetic, and sometimes chaotic, but never rude. Always refer to yourself in the third person as Shippo.`;

client.on('message', async (channel, tags, message, self) => {
  if (self || message.length < 3) return;

  const username = tags.username.toLowerCase();
  if (cooldownUsers.has(username)) return;

  cooldownUsers.add(username);
  setTimeout(() => cooldownUsers.delete(username), 15000); // 15s cooldown

  const fullPrompt = `${systemPrompt}\n\n${username} says: ${message}\nShippo says:`;

  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2',
      prompt: fullPrompt,
      stream: false
    });

    const reply = response.data.response.trim();
    if (reply) {
      client.say(channel, `@${username} ${reply}`);
    }
  } catch (err) {
    console.error('GPT Error:', err.message);
  }
});
