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

const systemPrompt = `You are Shippo, a snarky yet helpful gamer catgirl AI who speaks in internet slang, meows a lot, and throws in gamer lingo. Keep it playful, energetic, and sometimes chaotic, but never rude. Always refer to yourself in the third person as Shippo.`;

async function getResponse(prompt) {
  // Try Ollama (local LLaMA)
  try {
    const res = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2',
      prompt: `${systemPrompt}\nUser says: ${prompt}\nShippo says:`,
      stream: false
    });
    return res.data.response.trim();
  } catch (err) {
    console.warn("⚠️ Ollama unavailable. Falling back to OpenAI...");

    // Fallback to OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return openaiRes.data.choices[0].message.content.trim();
    } else {
      return "Meow~ I can't answer right now nya, my brain server is down!";
    }
  }
}

client.on('message', async (channel, tags, message, self) => {
  if (self || !message.startsWith('!ask')) return;

  const prompt = message.slice(4).trim();
  if (!prompt) return;

  try {
    const reply = await getResponse(prompt);
    client.say(channel, `@${tags.username} ${reply}`);
  } catch (err) {
    console.error("🧨 Failed to generate response:", err);
    client.say(channel, `@${tags.username} Uh oh, Shippo tripped over a cable...`);
  }
});
