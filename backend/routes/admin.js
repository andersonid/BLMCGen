const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
router.get('/stats', requirePermission('admin:dashboard'), async (req, res) => {
  try {
    const [usersTotal, usersVerified, usersActive, canvasTotal, canvasPublic, recentUsers] =
      await Promise.all([
        query('SELECT COUNT(*) AS count FROM users'),
        query('SELECT COUNT(*) AS count FROM users WHERE is_verified = TRUE'),
        query('SELECT COUNT(*) AS count FROM users WHERE is_active = TRUE'),
        query('SELECT COUNT(*) AS count FROM canvas'),
        query('SELECT COUNT(*) AS count FROM canvas WHERE is_public = TRUE'),
        query(
          `SELECT COUNT(*) AS count FROM users
           WHERE created_at > NOW() - INTERVAL '30 days'`
        ),
      ]);

    const canvasByType = await query(
      'SELECT canvas_type, COUNT(*) AS count FROM canvas GROUP BY canvas_type'
    );

    res.json({
      success: true,
      data: {
        users: {
          total: parseInt(usersTotal.rows[0].count),
          verified: parseInt(usersVerified.rows[0].count),
          active: parseInt(usersActive.rows[0].count),
          recentSignups: parseInt(recentUsers.rows[0].count),
        },
        canvas: {
          total: parseInt(canvasTotal.rows[0].count),
          public: parseInt(canvasPublic.rows[0].count),
          byType: canvasByType.rows.reduce((acc, r) => {
            acc[r.canvas_type] = parseInt(r.count);
            return acc;
          }, {}),
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ---------------------------------------------------------------------------
// Users — list
// ---------------------------------------------------------------------------
router.get('/users', requirePermission('user:list'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, is_active } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (u.email ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (is_active !== undefined) {
      paramCount++;
      whereClause += ` AND u.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    const usersResult = await query(
      `SELECT u.id, u.email, u.name, u.is_verified, u.is_active,
              u.created_at, u.last_login,
              COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

// ---------------------------------------------------------------------------
// Users — view single
// ---------------------------------------------------------------------------
router.get('/users/:id', requirePermission('user:view'), [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const { id } = req.params;

    const userResult = await query(
      `SELECT u.id, u.email, u.name, u.is_verified, u.is_active,
              u.created_at, u.updated_at, u.last_login,
              COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const canvasCount = await query(
      'SELECT COUNT(*) AS count FROM canvas WHERE user_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        user: {
          ...userResult.rows[0],
          canvasCount: parseInt(canvasCount.rows[0].count),
        },
      },
    });
  } catch (error) {
    console.error('Admin view user error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// ---------------------------------------------------------------------------
// Users — edit
// ---------------------------------------------------------------------------
router.put('/users/:id', requirePermission('user:edit'), [
  param('id').isUUID(),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const { name, email } = req.body;

    if (email) {
      const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, error: 'Email already in use' });
      }
    }

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    paramCount++;
    params.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, email, name, is_verified, is_active, created_at, last_login`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User updated', data: { user: result.rows[0] } });
  } catch (error) {
    console.error('Admin edit user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// ---------------------------------------------------------------------------
// Users — activate / deactivate
// ---------------------------------------------------------------------------
router.put('/users/:id/status', requirePermission('user:ban'), [
  param('id').isUUID(),
  body('is_active').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    // Prevent self-deactivation
    if (id === req.user.id && !is_active) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
    }

    const result = await query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, name, is_active`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      message: is_active ? 'User activated' : 'User deactivated',
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('Admin status change error:', error);
    res.status(500).json({ success: false, error: 'Failed to change user status' });
  }
});

// ---------------------------------------------------------------------------
// Users — delete
// ---------------------------------------------------------------------------
router.delete('/users/:id', requirePermission('user:delete'), [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account from admin panel' });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted', data: { user: result.rows[0] } });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// ---------------------------------------------------------------------------
// Users — manage roles
// ---------------------------------------------------------------------------
router.put('/users/:id/roles', requirePermission('user:promote'), [
  param('id').isUUID(),
  body('roles').isArray({ min: 1 }),
  body('roles.*').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const { roles: roleNames } = req.body;

    // Verify user exists
    const userExists = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify all role names are valid
    const validRoles = await query(
      'SELECT id, name FROM roles WHERE name = ANY($1)',
      [roleNames]
    );

    if (validRoles.rows.length !== roleNames.length) {
      const validNames = validRoles.rows.map(r => r.name);
      const invalid = roleNames.filter(n => !validNames.includes(n));
      return res.status(400).json({ success: false, error: `Invalid roles: ${invalid.join(', ')}` });
    }

    // Replace all user roles atomically
    await query('DELETE FROM user_roles WHERE user_id = $1', [id]);

    for (const role of validRoles.rows) {
      await query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, role.id]
      );
    }

    res.json({
      success: true,
      message: 'Roles updated',
      data: { roles: roleNames },
    });
  } catch (error) {
    console.error('Admin manage roles error:', error);
    res.status(500).json({ success: false, error: 'Failed to update roles' });
  }
});

// ---------------------------------------------------------------------------
// Canvas — list all (any user)
// ---------------------------------------------------------------------------
router.get('/canvas', requirePermission('canvas:list_all'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (type && ['bmc', 'lmc'].includes(type)) {
      paramCount++;
      whereClause += ` AND c.canvas_type = $${paramCount}`;
      params.push(type);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (c.title ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const canvasResult = await query(
      `SELECT c.id, c.title, c.canvas_type, c.is_public, c.created_at, c.updated_at,
              u.name AS author_name, u.email AS author_email
       FROM canvas c
       JOIN users u ON u.id = c.user_id
       ${whereClause}
       ORDER BY c.updated_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM canvas c JOIN users u ON u.id = c.user_id ${whereClause}`,
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
          pages: Math.ceil(countResult.rows[0].count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin list canvas error:', error);
    res.status(500).json({ success: false, error: 'Failed to list canvas' });
  }
});

// ---------------------------------------------------------------------------
// Canvas — delete any
// ---------------------------------------------------------------------------
router.delete('/canvas/:id', requirePermission('canvas:delete_any'), [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Invalid canvas ID' });
    }

    const result = await query(
      'DELETE FROM canvas WHERE id = $1 RETURNING id, title',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }

    res.json({ success: true, message: 'Canvas deleted', data: { canvas: result.rows[0] } });
  } catch (error) {
    console.error('Admin delete canvas error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete canvas' });
  }
});

// ---------------------------------------------------------------------------
// Roles — list with permissions
// ---------------------------------------------------------------------------
router.get('/roles', requirePermission('role:list'), async (req, res) => {
  try {
    const rolesResult = await query(
      `SELECT r.id, r.name, r.description,
              COALESCE(
                json_agg(
                  json_build_object('resource', p.resource, 'action', p.action, 'description', p.description)
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
              ) AS permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       GROUP BY r.id
       ORDER BY r.name`
    );

    res.json({ success: true, data: { roles: rolesResult.rows } });
  } catch (error) {
    console.error('Admin list roles error:', error);
    res.status(500).json({ success: false, error: 'Failed to list roles' });
  }
});

module.exports = router;
