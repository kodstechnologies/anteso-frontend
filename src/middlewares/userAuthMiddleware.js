import jwt from "jsonwebtoken";
const JWT_USER_SECRET = process.env.JWT_USER_SECRET;

export const verifyUserJWT = (allowedRoles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    try {
      const decoded = jwt.verify(token, JWT_USER_SECRET);
      console.log("🚀 ~ return ~ decoded:", decoded)
      req.user = decoded;

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};