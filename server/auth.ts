import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser, insertUserSchema } from "@shared/schema";

// Make TypeScript recognize user in the session
declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.JWT_SECRET || "blog-api-secret-key";

// Hash password with scrypt and salt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare password with stored hash
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate JWT token for a user
function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export function setupAuth(app: Express): void {
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "blog-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for passport
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize/deserialize user
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register route handler
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          status: "error",
          error: {
            message: "Validation failed",
            details: result.error.format()
          }
        });
      }

      const { email, password, name, image } = result.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          status: "error",
          error: {
            message: "Email already in use"
          }
        });
      }

      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        image
      });

      // Generate JWT token
      const token = generateToken(user);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        res.status(201).json({
          status: "success",
          data: {
            user: userWithoutPassword,
            token
          }
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Login route handler
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({
          status: "error",
          error: {
            message: info?.message || "Invalid email or password"
          }
        });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Generate JWT token
        const token = generateToken(user);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        res.json({
          status: "success",
          data: {
            user: userWithoutPassword,
            token
          }
        });
      });
    })(req, res, next);
  });

  // Logout route handler
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ status: "success" });
    });
  });

  // Current user route handler
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() && !req.headers.authorization) {
      return res.status(401).json({
        status: "error",
        error: {
          message: "Not authenticated"
        }
      });
    }

    // JWT authentication
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number, email: string, name: string };
        return res.json(decoded);
      } catch (error) {
        return res.status(401).json({
          status: "error",
          error: {
            message: "Invalid token"
          }
        });
      }
    }

    // Session authentication
    if (req.user) {
      const { password, ...userWithoutPassword } = req.user;
      return res.json(userWithoutPassword);
    }
  });
}

// Export utility functions for other modules
export {
  generateToken,
  hashPassword,
  comparePasswords,
  JWT_SECRET
};
