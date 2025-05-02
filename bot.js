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

client.on('message', async (channel, tags, message, self) => {
  if (self || !message.startsWith('!ask')) return;

  const prompt = message.slice(4).trim();

  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'llama2',
    prompt,
    stream: false
  });

  const reply = response.data.response.trim();
  client.say(channel, `@${tags.username} ${reply}`);
});
