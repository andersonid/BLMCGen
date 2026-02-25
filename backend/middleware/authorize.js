/**
 * RBAC authorization middlewares.
 *
 * Usage:
 *   router.get('/users', authenticateToken, requirePermission('user:list'), handler);
 *   router.put('/ban',   authenticateToken, requireRole('admin'),          handler);
 */

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({
        success: false,
        error: 'Access denied — no roles assigned'
      });
    }

    const hasRole = req.user.roles.some(r => roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Access denied — insufficient role'
      });
    }

    next();
  };
};

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({
        success: false,
        error: 'Access denied — no permissions'
      });
    }

    const hasPerm = req.user.permissions.some(p => permissions.includes(p));
    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        error: 'Access denied — insufficient permissions'
      });
    }

    next();
  };
};

module.exports = { requireRole, requirePermission };
