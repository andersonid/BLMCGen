-- RBAC Migration: roles, permissions, role_permissions, user_roles
-- Run this migration on an existing database that already has the users table.

BEGIN;

-- 1. Add is_active column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 1b. Widen token_hash to TEXT (JWT with roles exceeds 255 chars)
ALTER TABLE user_sessions ALTER COLUMN token_hash TYPE TEXT;

-- 2. Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_permission UNIQUE (resource, action)
);

-- 4. Role-Permission mapping (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. User-Role mapping (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 7. Seed default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Full system access — manage users, roles, and all content'),
    ('user',  'Standard user — create and manage own canvas')
ON CONFLICT (name) DO NOTHING;

-- 8. Seed permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('user',   'list',     'List all users'),
    ('user',   'view',     'View any user profile'),
    ('user',   'edit',     'Edit any user profile'),
    ('user',   'delete',   'Delete any user account'),
    ('user',   'ban',      'Activate or deactivate user accounts'),
    ('user',   'promote',  'Assign or remove roles from users'),
    ('canvas', 'list_all', 'List canvas from all users'),
    ('canvas', 'view_any', 'View any canvas regardless of ownership'),
    ('canvas', 'delete_any', 'Delete any canvas regardless of ownership'),
    ('role',   'list',     'List available roles and their permissions'),
    ('role',   'view',     'View role details'),
    ('role',   'assign',   'Assign roles to users'),
    ('admin',  'dashboard', 'Access admin dashboard and statistics')
ON CONFLICT (resource, action) DO NOTHING;

-- 9. Grant all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- 10. Assign 'user' role to all existing users who have no roles yet
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'user'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- 11. Assign 'admin' role to the seed admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@bmcgen.com'
  AND r.name = 'admin'
ON CONFLICT DO NOTHING;

COMMIT;
