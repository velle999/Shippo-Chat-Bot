# Shippo ChatBot

A Twitch chatbot powered by LLaMA (via Ollama) or OpenAI that responds to !ask prompts in chat as a chaotic gamer catgirl named Shippo.

## 🌐 Live on Render / Locally

### 🔧 Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOURNAME/ShippoChatBot
   cd ShippoChatBot
   ```

2. Create `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run it:
   ```bash
   node bot.js
   ```

Or deploy to [Render.com](https://render.com) using your GitHub repo with environment variables:
- TWITCH_USERNAME
- TWITCH_OAUTH
- TWITCH_CHANNEL
- (optional) OPENAI_API_KEY

Bot will auto-fallback to OpenAI if Ollama isn't running.

> Pro tip: run `ollama run llama2` in another terminal if using LLaMA.

## 🧠 One-Click Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

