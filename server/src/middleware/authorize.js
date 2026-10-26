// Role hierarchy: ADMIN > EDITOR > USER
const roleHierarchy = {
    USER: 1,
    EDITOR: 2, 
    ADMIN: 3,
}

/**
 * Middleware that checks if the user has the required role.
 * Must be used AFTER the authenticate middleware.
 *
 * Usage:
 *   app.get('/admin', authenticate, requireRole('ADMIN'), handler)
 *   app.get('/editor', authenticate, requireRole('EDITOR'), handler)
 */

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        // req.user is set by the authenticate middleware
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const userRole = req.user.role;

        // Check if the user's role is in the allowed roles
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: "Access denied. You do not have the permission to perfrom this action.",
                required: allowedRoles,
                your_role: userRole,
            });
        }

        next();
    };
}

/**
 * Middleware that checks if the user has AT LEAST the minimum role level.
 * Uses the role hierarchy so ADMIN can access EDITOR routes, etc.
 *
 * Usage:
 *   app.get('/editor-area', authenticate, requireMinRole('EDITOR'), handler)
 *   // Both EDITOR and ADMIN can access this
 */

function requireMinRole(minimumRole) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" })
        }

        const userLevel = roleHierarchy[req.user.role] || 0;
        const requiredLevel = roleHierarchy[minimumRole] || 0;

        if (userLevel < requiredLevel) {
            return res.status(403).json({
                error: "Access denied. Insufficient permissions.",
                required: minimumRole,
                your_role: req.user.role
            });
        }

        next();
    }
}

module.exports = { requireRole, requireMinRole}