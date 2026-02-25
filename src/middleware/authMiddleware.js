function isAuthenticated(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }
  next();
}

function isRole(role) {
  return function (req, res, next) {
    if (!req.session || req.session.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires ${role} role.`,
      });
    }
    next();
  };
}

module.exports = {
  isAuthenticated,
  isRole,
};
