import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.SESSION_SECRET) {
  throw new Error("Environment variable SESSION_SECRET not provided");
}

export function getSession() {
  const sessionTtl = 30 * 60 * 1000; // 30 minutes
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset session expiry on each request
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Initialize predefined users
  await storage.initializeUsers();
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Add user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole = (requiredRole: string): RequestHandler => {
  return (req, res, next) => {
    const user = (req as any).user;
    if (!user || user.role !== requiredRole) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

// Extend session interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}