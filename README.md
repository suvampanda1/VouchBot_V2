# VouchBot App Design

VouchBot is an education-focused AI chat interface with custom robot, magic-ring, and thinking-particle animations.

## Local setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create `.env.local` from `.env.example` and add at least a Groq key:

   ```dotenv
   GROQ_API_KEY=your_groq_key
   DEEPSEEK_API_KEY=your_optional_deepseek_key
   GROQ_MODEL=openai/gpt-oss-120b
   DEEPSEEK_MODEL=deepseek-v4-flash
   ```

3. Start the app:

   ```powershell
   npm run dev
   ```

The browser calls `/api/chat`; provider keys are read only by the server. Groq is tried first and DeepSeek is used as a fallback when its key is configured.

DeepSeek API usage is metered and requires available granted or topped-up balance. Leave `DEEPSEEK_API_KEY` empty to run only on Groq.

## Deployment

Set `GROQ_API_KEY` and, optionally, `DEEPSEEK_API_KEY` as server environment variables. The `api/chat.mjs` route is ready for Vercel-style serverless deployment.

Original Figma design: https://www.figma.com/design/sylhasGJYmkuWav0is0frh/VouchBot-App-Design