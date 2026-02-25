const fs = require('fs');
const path = require('path');

let geminiClient = null;
let openaiClient = null;

const SYSTEM_PROMPT_PATH = path.join(__dirname, '..', 'prompts', 'canvas-agent.md');
let cachedSystemPrompt = null;

function getSystemPrompt() {
  if (!cachedSystemPrompt) {
    cachedSystemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');
  }
  return cachedSystemPrompt;
}

function getProvider() {
  return process.env.LLM_PROVIDER || 'gemini';
}

async function getGeminiClient() {
  if (!geminiClient) {
    const { GoogleGenAI } = require('@google/genai');
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

async function getOpenAIClient() {
  if (!openaiClient) {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function buildMessages(systemPrompt, history, userMessage) {
  const messages = [{ role: 'system', content: systemPrompt }];

  for (const msg of history) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  messages.push({ role: 'user', content: userMessage });
  return messages;
}

async function* streamChatGemini(messages) {
  const client = await getGeminiClient();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const response = await client.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 4096
    }
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}

async function* streamChatOpenAI(messages) {
  const client = await getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const stream = await client.chat.completions.create({
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: 0.7,
    max_tokens: 4096,
    stream: true
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

async function* streamChat(history, userMessage, { canvasContext } = {}) {
  const systemPrompt = getSystemPrompt();
  let enrichedMessage = userMessage;

  if (canvasContext) {
    enrichedMessage = `[Current canvas state]\n\`\`\`canvas\n${canvasContext}\n\`\`\`\n\n${userMessage}`;
  }

  const messages = buildMessages(systemPrompt, history, enrichedMessage);
  const provider = getProvider();

  try {
    const streamer = provider === 'openai'
      ? streamChatOpenAI(messages)
      : streamChatGemini(messages);

    for await (const chunk of streamer) {
      yield chunk;
    }
  } catch (err) {
    if (provider === 'gemini' && process.env.OPENAI_API_KEY) {
      console.warn('Gemini failed, falling back to OpenAI:', err.message);
      for await (const chunk of streamChatOpenAI(messages)) {
        yield chunk;
      }
    } else {
      throw err;
    }
  }
}

function isConfigured() {
  const provider = getProvider();
  if (provider === 'gemini') return !!process.env.GEMINI_API_KEY;
  if (provider === 'openai') return !!process.env.OPENAI_API_KEY;
  return false;
}

module.exports = {
  streamChat,
  getSystemPrompt,
  getProvider,
  isConfigured,
  reloadSystemPrompt() { cachedSystemPrompt = null; }
};
