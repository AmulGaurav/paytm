const jwt = require("jsonwebtoken");

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(411).json();
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(411).json({ message: "authentication failed" });
  }
};

module.exports = authMiddleware;
