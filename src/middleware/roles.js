
export function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin only' });
}
export function isUser(req, res, next) {
  if (req.user?.role === 'user' || req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'User only' });
}
