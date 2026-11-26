import jwt from "jsonwebtoken";

export function getAuthUser(req) {
  const token = req.cookies?.quizhub_token;
  if (!token) return null;

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || "quizhub-development-secret"
    );
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  req.user = user;
  next();
}
