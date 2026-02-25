const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is still active
    const userResult = await query(
      'SELECT id, email, name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account deactivated — contact an administrator'
      });
    }

    // Load roles and permissions via RBAC tables
    const rolesResult = await query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const permsResult = await query(
      `SELECT DISTINCT p.resource || ':' || p.action AS perm
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: rolesResult.rows.map(r => r.name),
      permissions: permsResult.rows.map(r => r.perm)
    };

    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userResult = await query(
      'SELECT id, email, name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      req.user = null;
      return next();
    }

    const user = userResult.rows[0];

    const rolesResult = await query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1`,
      [user.id]
    );

    const permsResult = await query(
      `SELECT DISTINCT p.resource || ':' || p.action AS perm
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: rolesResult.rows.map(r => r.name),
      permissions: permsResult.rows.map(r => r.perm)
    };
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
