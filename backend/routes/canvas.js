const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all canvas for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = $1';
    let params = [req.user.id];
    let paramCount = 1;

    if (type && ['bmc', 'lmc'].includes(type)) {
      paramCount++;
      whereClause += ` AND canvas_type = $${paramCount}`;
      params.push(type);
    }

    const canvasResult = await query(
      `SELECT id, title, canvas_type, is_public, created_at, updated_at, last_accessed 
       FROM canvas ${whereClause} 
       ORDER BY updated_at DESC 
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM canvas ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        canvas: canvasResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get canvas error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch canvas'
    });
  }
});

// Get public canvas
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_public = TRUE';
    let params = [];
    let paramCount = 0;

    if (type && ['bmc', 'lmc'].includes(type)) {
      paramCount++;
      whereClause += ` AND canvas_type = $${paramCount}`;
      params.push(type);
    }

    const canvasResult = await query(
      `SELECT c.id, c.title, c.canvas_type, c.created_at, u.name as author_name
       FROM canvas c 
       JOIN users u ON c.user_id = u.id 
       ${whereClause} 
       ORDER BY c.created_at DESC 
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM canvas ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        canvas: canvasResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get public canvas error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public canvas'
    });
  }
});

// Get single canvas
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    let whereClause = 'WHERE c.id = $1';
    let params = [id];

    // If not authenticated, only allow public canvas
    if (!req.user) {
      whereClause += ' AND c.is_public = TRUE';
    } else {
      whereClause += ' AND (c.user_id = $2 OR c.is_public = TRUE)';
      params.push(req.user.id);
    }

    const canvasResult = await query(
      `SELECT c.*, u.name as author_name 
       FROM canvas c 
       LEFT JOIN users u ON c.user_id = u.id 
       ${whereClause}`,
      params
    );

    if (canvasResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Canvas not found'
      });
    }

    const canvas = canvasResult.rows[0];

    // Update last accessed if user owns the canvas
    if (req.user && canvas.user_id === req.user.id) {
      await query(
        'UPDATE canvas SET last_accessed = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    }

    res.json({
      success: true,
      data: { canvas }
    });

  } catch (error) {
    console.error('Get canvas error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch canvas'
    });
  }
});

// Create new canvas
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('content').isString(),
  body('canvasType').isIn(['bmc', 'lmc']),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, content, canvasType, isPublic = false } = req.body;

    const canvasResult = await query(
      'INSERT INTO canvas (user_id, title, content, canvas_type, is_public) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, title, content, canvasType, isPublic]
    );

    res.status(201).json({
      success: true,
      message: 'Canvas created successfully',
      data: { canvas: canvasResult.rows[0] }
    });

  } catch (error) {
    console.error('Create canvas error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create canvas'
    });
  }
});

// Update canvas
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('content').optional().isString(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { title, content, isPublic } = req.body;

    // Check if canvas exists and belongs to user
    const existingCanvas = await query(
      'SELECT id FROM canvas WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingCanvas.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Canvas not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      params.push(title);
    }

    if (content !== undefined) {
      paramCount++;
      updates.push(`content = $${paramCount}`);
      params.push(content);
    }

    if (isPublic !== undefined) {
      paramCount++;
      updates.push(`is_public = $${paramCount}`);
      params.push(isPublic);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const canvasResult = await query(
      `UPDATE canvas SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    res.json({
      success: true,
      message: 'Canvas updated successfully',
      data: { canvas: canvasResult.rows[0] }
    });

  } catch (error) {
    console.error('Update canvas error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update canvas'
    });
  }
});

// Delete canvas
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const canvasResult = await query(
      'DELETE FROM canvas WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (canvasResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Canvas not found'
      });
    }

    res.json({
      success: true,
      message: 'Canvas deleted successfully'
    });

  } catch (error) {
    console.error('Delete canvas error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete canvas'
    });
  }
});

module.exports = router;
