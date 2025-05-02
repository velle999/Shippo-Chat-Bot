const express = require('express');
const fs = require('fs');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(express.static('.'));
app.use(bodyParser.json());

app.post('/start-bot', (req, res) => {
  const { username, oauth, channel, openai } = req.body;

  const envContent = `TWITCH_USERNAME=${username}
TWITCH_OAUTH=${oauth}
TWITCH_CHANNEL=${channel}
OPENAI_API_KEY=${openai || ''}`;

  fs.writeFileSync('.env', envContent);

  const botProcess = spawn('node', ['bot.js']);

  botProcess.stdout.on('data', data => res.write(data.toString()));
  botProcess.stderr.on('data', data => res.write('ERROR: ' + data.toString()));
  botProcess.on('close', code => res.end(`\nBot exited with code ${code}`));
});

app.listen(PORT, () => {
  console.log(`🚀 GUI running at http://localhost:${PORT}`);
});
