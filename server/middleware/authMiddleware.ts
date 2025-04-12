import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../auth";
import { storage } from "../storage";

interface JwtPayload {
  id: number;
  email: string;
  name: string;
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        error: {
          message: "Authentication required"
        }
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        error: {
          message: "Authentication token required"
        }
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      
      // Fetch the user
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return res.status(401).json({
          status: "error",
          error: {
            message: "User not found"
          }
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        status: "error",
        error: {
          message: "Invalid or expired token"
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to check if the user is the author
export const isAuthor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resourceId = parseInt(req.params.id);
    const resourceType = req.baseUrl.includes('posts') ? 'post' : 'comment';

    if (!req.user) {
      return res.status(401).json({
        status: "error",
        error: {
          message: "Not authenticated"
        }
      });
    }

    let isOwner = false;

    if (resourceType === 'post') {
      const post = await storage.getPost(resourceId);
      if (!post) {
        return res.status(404).json({
          status: "error",
          error: {
            message: "Post not found"
          }
        });
      }
      isOwner = post.author.id === req.user.id;
    } else {
      const comment = await storage.getComment(resourceId);
      if (!comment) {
        return res.status(404).json({
          status: "error",
          error: {
            message: "Comment not found"
          }
        });
      }
      isOwner = comment.authorId === req.user.id;
    }

    if (!isOwner) {
      return res.status(403).json({
        status: "error",
        error: {
          message: `You are not authorized to modify this ${resourceType}`
        }
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
