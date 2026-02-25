const llmService = require('./llm.service');
const canvasService = require('./canvas.service');

// Match ```canvas, ```bmc, ```lmc, or bare ``` blocks whose content starts with bmc/lmc
const FENCED_BLOCK_RE = /```(?:canvas|bmc|lmc)?\s*\n([\s\S]*?)```/g;

function extractCanvasBlocks(text) {
  const blocks = [];
  let match;
  while ((match = FENCED_BLOCK_RE.exec(text)) !== null) {
    const markdown = match[1].trim();
    // Only accept blocks that actually start with bmc or lmc (our DSL)
    if (!/^(bmc|lmc)\b/.test(markdown)) continue;
    const validation = canvasService.validateMarkdown(markdown);
    blocks.push({ markdown, ...validation });
  }
  FENCED_BLOCK_RE.lastIndex = 0;
  return blocks;
}

async function* processMessage(userId, { message, history = [], canvasId }) {
  let canvasContext = null;

  if (canvasId) {
    const canvas = await canvasService.findById(canvasId, userId);
    if (canvas) canvasContext = canvas.content;
  }

  let fullResponse = '';

  for await (const chunk of llmService.streamChat(history, message, { canvasContext })) {
    fullResponse += chunk;
    yield { type: 'delta', content: chunk };
  }

  const canvasBlocks = extractCanvasBlocks(fullResponse);
  if (canvasBlocks.length > 0) {
    const latest = canvasBlocks[canvasBlocks.length - 1];
    yield {
      type: 'canvas_update',
      markdown: latest.markdown,
      valid: latest.valid,
      errors: latest.errors,
      parsed: latest.data
    };
  }

  yield { type: 'done', fullResponse };
}

module.exports = {
  processMessage,
  extractCanvasBlocks
};
