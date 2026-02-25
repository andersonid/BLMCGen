const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const canvasService = require('../services/canvas.service');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const data = await canvasService.listByUser(req.user.id, { page, limit, type });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get canvas error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch canvas' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const data = await canvasService.listPublic({ page, limit, type });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get public canvas error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch public canvas' });
  }
});

router.get('/syntax', (req, res) => {
  res.json({ success: true, data: canvasService.getSyntaxReference() });
});

router.get('/sections/:type', (req, res) => {
  const { type } = req.params;
  if (!['bmc', 'lmc'].includes(type)) {
    return res.status(400).json({ success: false, error: 'Type must be bmc or lmc' });
  }
  res.json({ success: true, data: canvasService.listSections(type) });
});

router.get('/template/:type', (req, res) => {
  const { type } = req.params;
  if (!['bmc', 'lmc'].includes(type)) {
    return res.status(400).json({ success: false, error: 'Type must be bmc or lmc' });
  }
  res.json({ success: true, data: { markdown: canvasService.getTemplate(type) } });
});

router.post('/parse', [
  body('markdown').isString().trim().isLength({ min: 1 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
  }
  const parsed = canvasService.parseMarkdown(req.body.markdown);
  res.json({ success: true, data: parsed });
});

router.post('/validate', [
  body('markdown').isString().trim().isLength({ min: 1 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
  }
  const result = canvasService.validateMarkdown(req.body.markdown);
  res.json({ success: true, data: result });
});

router.post('/format', [
  body('markdown').isString().trim().isLength({ min: 1 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
  }
  const formatted = canvasService.formatMarkdown(req.body.markdown);
  res.json({ success: true, data: { markdown: formatted } });
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const canvas = await canvasService.findById(req.params.id, req.user?.id);
    if (!canvas) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    res.json({ success: true, data: { canvas } });
  } catch (error) {
    console.error('Get canvas error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch canvas' });
  }
});

router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('content').isString(),
  body('canvasType').isIn(['bmc', 'lmc']),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { title, content, canvasType, isPublic } = req.body;
    const canvas = await canvasService.create(req.user.id, { title, content, canvasType, isPublic });
    res.status(201).json({ success: true, message: 'Canvas created successfully', data: { canvas } });
  } catch (error) {
    console.error('Create canvas error:', error);
    res.status(500).json({ success: false, error: 'Failed to create canvas' });
  }
});

router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('content').optional().isString(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { title, content, isPublic } = req.body;
    const canvas = await canvasService.update(req.params.id, req.user.id, { title, content, isPublic });

    if (!canvas) {
      return res.status(404).json({ success: false, error: 'Canvas not found or nothing to update' });
    }

    res.json({ success: true, message: 'Canvas updated successfully', data: { canvas } });
  } catch (error) {
    console.error('Update canvas error:', error);
    res.status(500).json({ success: false, error: 'Failed to update canvas' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await canvasService.remove(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    res.json({ success: true, message: 'Canvas deleted successfully' });
  } catch (error) {
    console.error('Delete canvas error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete canvas' });
  }
});

module.exports = router;
