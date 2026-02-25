const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const canvasService = require('../services/canvas.service');
const chatService = require('../services/chat.service');
const llmService = require('../services/llm.service');

const mcpServer = new McpServer({
  name: 'blmcgen',
  version: '1.0.0'
});

// --- Tools ---

mcpServer.tool(
  'get_syntax_reference',
  'Get the complete BLMCGen DSL syntax reference, including all section names and examples for BMC and LMC',
  {},
  async () => ({
    content: [{ type: 'text', text: JSON.stringify(canvasService.getSyntaxReference(), null, 2) }]
  })
);

mcpServer.tool(
  'get_template',
  'Get a blank canvas template in BLMCGen DSL',
  { type: { type: 'string', description: 'Canvas type: "bmc" or "lmc"', enum: ['bmc', 'lmc'] } },
  async ({ type }) => ({
    content: [{ type: 'text', text: canvasService.getTemplate(type) }]
  })
);

mcpServer.tool(
  'list_sections',
  'List all valid sections for a given canvas type',
  { type: { type: 'string', description: 'Canvas type: "bmc" or "lmc"', enum: ['bmc', 'lmc'] } },
  async ({ type }) => ({
    content: [{ type: 'text', text: JSON.stringify(canvasService.listSections(type), null, 2) }]
  })
);

mcpServer.tool(
  'parse_markdown',
  'Parse BLMCGen DSL markdown into a structured object without saving',
  { markdown: { type: 'string', description: 'The BLMCGen DSL markdown to parse' } },
  async ({ markdown }) => {
    const parsed = canvasService.parseMarkdown(markdown);
    return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] };
  }
);

mcpServer.tool(
  'validate_markdown',
  'Validate BLMCGen DSL markdown and return any errors',
  { markdown: { type: 'string', description: 'The BLMCGen DSL markdown to validate' } },
  async ({ markdown }) => {
    const result = canvasService.validateMarkdown(markdown);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

mcpServer.tool(
  'format_markdown',
  'Format/indent BLMCGen DSL markdown with proper structure',
  { markdown: { type: 'string', description: 'The BLMCGen DSL markdown to format' } },
  async ({ markdown }) => {
    const formatted = canvasService.formatMarkdown(markdown);
    return { content: [{ type: 'text', text: formatted }] };
  }
);

mcpServer.tool(
  'create_canvas',
  'Create and save a new canvas from BLMCGen DSL markdown. Requires authentication.',
  {
    markdown: { type: 'string', description: 'The BLMCGen DSL markdown content' },
    title: { type: 'string', description: 'Canvas title (optional, extracted from markdown if not provided)' }
  },
  async ({ markdown, title }, { meta }) => {
    const userId = meta?.userId;
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: Authentication required to create canvas' }], isError: true };
    }

    const validation = canvasService.validateMarkdown(markdown);
    if (!validation.valid) {
      return { content: [{ type: 'text', text: `Validation errors: ${validation.errors.join(', ')}` }], isError: true };
    }

    const parsed = validation.data;
    const canvasTitle = title || parsed.title || 'Untitled Canvas';
    const canvas = await canvasService.create(userId, {
      title: canvasTitle,
      content: markdown,
      canvasType: parsed.canvasType
    });

    return { content: [{ type: 'text', text: JSON.stringify({ id: canvas.id, title: canvas.title, type: canvas.canvas_type }, null, 2) }] };
  }
);

mcpServer.tool(
  'update_canvas',
  'Update an existing canvas with new BLMCGen DSL markdown. Requires authentication.',
  {
    canvas_id: { type: 'string', description: 'The canvas ID to update' },
    markdown: { type: 'string', description: 'The new BLMCGen DSL markdown content' }
  },
  async ({ canvas_id, markdown }, { meta }) => {
    const userId = meta?.userId;
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: Authentication required' }], isError: true };
    }

    const validation = canvasService.validateMarkdown(markdown);
    if (!validation.valid) {
      return { content: [{ type: 'text', text: `Validation errors: ${validation.errors.join(', ')}` }], isError: true };
    }

    const canvas = await canvasService.update(canvas_id, userId, { content: markdown });
    if (!canvas) {
      return { content: [{ type: 'text', text: 'Error: Canvas not found or not owned by you' }], isError: true };
    }

    return { content: [{ type: 'text', text: `Canvas ${canvas_id} updated successfully` }] };
  }
);

mcpServer.tool(
  'update_section',
  'Update a specific section of an existing canvas. Requires authentication.',
  {
    canvas_id: { type: 'string', description: 'The canvas ID to update' },
    section: { type: 'string', description: 'Section key (e.g. "customer-segments", "problem")' },
    items: { type: 'string', description: 'JSON array of new items for this section, e.g. ["Item 1", "Item 2"]' }
  },
  async ({ canvas_id, section, items }, { meta }) => {
    const userId = meta?.userId;
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: Authentication required' }], isError: true };
    }

    if (!canvasService.ALL_SECTIONS.includes(section)) {
      return { content: [{ type: 'text', text: `Error: Unknown section "${section}". Valid: ${canvasService.ALL_SECTIONS.join(', ')}` }], isError: true };
    }

    let parsedItems;
    try { parsedItems = JSON.parse(items); } catch {
      return { content: [{ type: 'text', text: 'Error: items must be a valid JSON array of strings' }], isError: true };
    }

    const canvas = await canvasService.findById(canvas_id, userId);
    if (!canvas) {
      return { content: [{ type: 'text', text: 'Error: Canvas not found' }], isError: true };
    }

    const parsed = canvasService.parseMarkdown(canvas.content);
    parsed.sections[section] = parsedItems;
    const newMarkdown = canvasService.formatMarkdown(
      `${parsed.canvasType}\ntitle: ${parsed.title}\ndescription: ${parsed.description}\n` +
      Object.entries(parsed.sections)
        .filter(([, v]) => v.length > 0)
        .map(([k, v]) => `${k}:\n${v.map(i => `  - ${i}`).join('\n')}`)
        .join('\n\n')
    );

    await canvasService.update(canvas_id, userId, { content: newMarkdown });
    return { content: [{ type: 'text', text: newMarkdown }] };
  }
);

mcpServer.tool(
  'list_canvas',
  'List saved canvases for the authenticated user',
  {
    limit: { type: 'number', description: 'Max results (default 20)' },
    type: { type: 'string', description: 'Filter by type: "bmc" or "lmc" (optional)' }
  },
  async ({ limit, type }, { meta }) => {
    const userId = meta?.userId;
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: Authentication required' }], isError: true };
    }

    const data = await canvasService.listByUser(userId, { limit: limit || 20, type });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

mcpServer.tool(
  'chat_with_guide',
  'Send a message to the BLMCGen AI guide and get a response with methodology guidance and canvas updates. Requires LLM to be configured.',
  {
    message: { type: 'string', description: 'User message to the AI guide' },
    history: { type: 'string', description: 'JSON array of previous messages [{role, content}] (optional)' },
    canvas_context: { type: 'string', description: 'Current canvas DSL markdown for context (optional)' }
  },
  async ({ message, history, canvas_context }) => {
    if (!llmService.isConfigured()) {
      return { content: [{ type: 'text', text: 'Error: AI service not configured on server' }], isError: true };
    }

    let parsedHistory = [];
    if (history) {
      try { parsedHistory = JSON.parse(history); } catch {
        return { content: [{ type: 'text', text: 'Error: history must be valid JSON array' }], isError: true };
      }
    }

    let fullResponse = '';
    for await (const chunk of llmService.streamChat(parsedHistory, message, { canvasContext: canvas_context })) {
      fullResponse += chunk;
    }

    const canvasBlocks = chatService.extractCanvasBlocks(fullResponse);
    const result = { response: fullResponse };
    if (canvasBlocks.length > 0) {
      result.canvas_markdown = canvasBlocks[canvasBlocks.length - 1].markdown;
      result.canvas_valid = canvasBlocks[canvasBlocks.length - 1].valid;
    }

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// --- Resources ---

mcpServer.resource(
  'syntax-reference',
  'blmcgen://syntax/reference',
  { description: 'Complete BLMCGen DSL syntax reference', mimeType: 'application/json' },
  async () => ({
    contents: [{ uri: 'blmcgen://syntax/reference', text: JSON.stringify(canvasService.getSyntaxReference(), null, 2), mimeType: 'application/json' }]
  })
);

mcpServer.resource(
  'bmc-template',
  'blmcgen://templates/bmc',
  { description: 'BMC template in BLMCGen DSL', mimeType: 'text/plain' },
  async () => ({
    contents: [{ uri: 'blmcgen://templates/bmc', text: canvasService.getTemplate('bmc'), mimeType: 'text/plain' }]
  })
);

mcpServer.resource(
  'lmc-template',
  'blmcgen://templates/lmc',
  { description: 'LMC template in BLMCGen DSL', mimeType: 'text/plain' },
  async () => ({
    contents: [{ uri: 'blmcgen://templates/lmc', text: canvasService.getTemplate('lmc'), mimeType: 'text/plain' }]
  })
);

// --- Express mount ---

const transports = {};

function mountMcp(app) {
  app.get('/mcp/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const transport = new SSEServerTransport('/mcp/messages', res);
    const sessionId = transport.sessionId;
    transports[sessionId] = transport;

    console.log(`MCP session connected: ${sessionId}`);

    transport.onclose = () => {
      delete transports[sessionId];
      console.log(`MCP session closed: ${sessionId}`);
    };

    mcpServer.connect(transport);
  });

  app.post('/mcp/messages', (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];

    if (!transport) {
      return res.status(400).json({ error: `Unknown session: ${sessionId}` });
    }

    transport.handlePostMessage(req, res);
  });

  console.log('📡 MCP server mounted at /mcp/sse and /mcp/messages');
}

module.exports = { mcpServer, mountMcp };
