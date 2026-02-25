const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const chatService = require('../services/chat.service');
const llmService = require('../services/llm.service');

const router = express.Router();

router.post('/',
  authenticateToken,
  [
    body('message').isString().trim().isLength({ min: 1, max: 100000 }),
    body('history').optional().isArray({ max: 40 }),
    body('history.*.role').optional().isIn(['user', 'assistant']),
    body('history.*.content').optional().isString(),
    body('canvasId').optional({ values: 'null' }).isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    if (!llmService.isConfigured()) {
      return res.status(503).json({ success: false, error: 'AI service not configured' });
    }

    const { message, history = [], canvasId } = req.body;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    let closed = false;
    req.on('close', () => { closed = true; });

    const send = (event, data) => {
      if (closed) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      for await (const event of chatService.processMessage(req.user.id, { message, history, canvasId })) {
        if (closed) break;
        send(event.type, event);
      }
    } catch (err) {
      console.error('Chat stream error:', err);
      send('error', { message: err.message || 'Internal error' });
    } finally {
      if (!closed) res.end();
    }
  }
);

router.get('/status', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      configured: llmService.isConfigured(),
      provider: llmService.getProvider()
    }
  });
});

module.exports = router;
