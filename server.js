const express = require('express');
const fs = require('fs');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(express.static('.'));
app.use(bodyParser.json());

let botProcess = null;

app.post('/start-bot', (req, res) => {
  const { username, oauth, channel, openai } = req.body;

  if (!username || !oauth || !channel) {
    return res.status(400).send('Missing required fields: username, oauth, or channel.');
  }

  const envContent = `TWITCH_USERNAME=${username}
TWITCH_OAUTH=${oauth}
TWITCH_CHANNEL=${channel}
OPENAI_API_KEY=${openai || ''}`;

  fs.writeFileSync('.env', envContent);

  // Stop old bot if running
  if (botProcess) {
    botProcess.kill();
  }

  // Start new bot
  botProcess = spawn('node', ['bot.js']);

  botProcess.stdout.on('data', data => res.write(data.toString()));
  botProcess.stderr.on('data', data => res.write('ERROR: ' + data.toString()));

  botProcess.on('close', code => {
    res.end(`\nBot exited with code ${code}`);
    botProcess = null;
  });

  botProcess.on('error', err => {
    res.end(`\nFailed to start bot: ${err.message}`);
    botProcess = null;
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Shippo ChatBot GUI server running at http://localhost:${PORT}`);
});
