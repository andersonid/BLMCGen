const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await query(
      'SELECT id, email, name, is_verified, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user: userResult.rows[0] }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail()
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

    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }

    // Build update query
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
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.user.id);

    const userResult = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, is_verified, created_at, last_login`,
      params
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResult.rows[0] }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
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

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Update email marketing consent
router.put('/email-consent', authenticateToken, [
  body('consent').isBoolean()
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

    const { consent } = req.body;

    // Update user consent
    await query(
      'UPDATE users SET email_marketing_consent = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [consent, req.user.id]
    );

    // Update email marketing table
    if (consent) {
      await query(
        'INSERT INTO email_marketing (email, name, source) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET is_active = TRUE, subscribed_at = CURRENT_TIMESTAMP',
        [req.user.email, req.user.name, 'profile_update']
      );
    } else {
      await query(
        'UPDATE email_marketing SET is_active = FALSE, unsubscribed_at = CURRENT_TIMESTAMP WHERE email = $1',
        [req.user.email]
      );
    }

    res.json({
      success: true,
      message: 'Email marketing consent updated successfully'
    });

  } catch (error) {
    console.error('Update email consent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email consent'
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get canvas count by type
    const canvasStats = await query(
      'SELECT canvas_type, COUNT(*) as count FROM canvas WHERE user_id = $1 GROUP BY canvas_type',
      [req.user.id]
    );

    // Get total canvas count
    const totalCanvas = await query(
      'SELECT COUNT(*) as count FROM canvas WHERE user_id = $1',
      [req.user.id]
    );

    // Get public canvas count
    const publicCanvas = await query(
      'SELECT COUNT(*) as count FROM canvas WHERE user_id = $1 AND is_public = TRUE',
      [req.user.id]
    );

    // Get recent activity (last 30 days)
    const recentActivity = await query(
      'SELECT COUNT(*) as count FROM canvas WHERE user_id = $1 AND updated_at > NOW() - INTERVAL \'30 days\'',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        totalCanvas: parseInt(totalCanvas.rows[0].count),
        publicCanvas: parseInt(publicCanvas.rows[0].count),
        recentActivity: parseInt(recentActivity.rows[0].count),
        byType: canvasStats.rows.reduce((acc, row) => {
          acc[row.canvas_type] = parseInt(row.count);
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
});

// Delete user account
router.delete('/account', authenticateToken, [
  body('password').notEmpty()
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

    const { password } = req.body;

    // Verify password
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const isValidPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Delete user (cascade will delete canvas and sessions)
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

module.exports = router;
