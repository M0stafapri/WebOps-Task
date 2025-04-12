import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { authenticateJWT, isAuthor } from "./middleware/authMiddleware";
import { setupScheduler } from "./scheduler";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Start scheduler for post deletion
  setupScheduler();

  // API routes
  // ===== POSTS =====
  // Get all posts
  app.get("/api/posts", async (req, res, next) => {
    try {
      const tagQuery = req.query.tag as string | undefined;
      const authorIdQuery = req.query.author_id ? 
        parseInt(req.query.author_id as string) : undefined;
      
      let posts;
      if (tagQuery) {
        posts = await storage.getPostsByTag(tagQuery);
      } else if (authorIdQuery) {
        posts = await storage.getPostsByAuthor(authorIdQuery);
      } else {
        posts = await storage.getAllPosts();
      }
      
      // Basic pagination
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const perPage = Math.min(
        Math.max(parseInt(req.query.per_page as string) || 20, 1), 
        100
      );
      
      const start = (page - 1) * perPage;
      const paginatedPosts = posts.slice(start, start + perPage);
      
      res.json({
        status: "success",
        data: {
          posts: paginatedPosts,
          meta: {
            current_page: page,
            total_pages: Math.ceil(posts.length / perPage),
            total_count: posts.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Create a post
  app.post("/api/posts", authenticateJWT, async (req, res, next) => {
    try {
      const result = insertPostSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(422).json({
          status: "error",
          error: {
            message: "Validation failed",
            details: result.error.format()
          }
        });
      }
      
      if (!req.user) {
        return res.status(401).json({
          status: "error",
          error: {
            message: "Authentication required"
          }
        });
      }
      
      const post = await storage.createPost(result.data, req.user.id);
      const postWithDetails = await storage.getPost(post.id);
      
      if (!postWithDetails) {
        return res.status(500).json({
          status: "error",
          error: {
            message: "Failed to retrieve created post"
          }
        });
      }
      
      res.status(201).json({
        status: "success",
        data: {
          post: postWithDetails
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get a specific post
  app.get("/api/posts/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);
      
      if (!post) {
        return res.status(404).json({
          status: "error",
          error: {
            message: "Post not found"
          }
        });
      }
      
      res.json({
        status: "success",
        data: {
          post
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Update a post
  app.put("/api/posts/:id", authenticateJWT, isAuthor, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      const result = insertPostSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(422).json({
          status: "error",
          error: {
            message: "Validation failed",
            details: result.error.format()
          }
        });
      }
      
      await storage.updatePost(id, result.data);
      const updatedPost = await storage.getPost(id);
      
      if (!updatedPost) {
        return res.status(404).json({
          status: "error",
          error: {
            message: "Post not found"
          }
        });
      }
      
      res.json({
        status: "success",
        data: {
          post: updatedPost
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Delete a post
  app.delete("/api/posts/:id", authenticateJWT, isAuthor, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePost(id);
      
      if (!deleted) {
        return res.status(404).json({
          status: "error",
          error: {
            message: "Post not found"
          }
        });
      }
      
      res.json({
        status: "success",
        data: null
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== COMMENTS =====
  // Get comments for a post
  app.get("/api/posts/:postId/comments", async (req, res, next) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommentsByPostId(postId);
      
      res.json({
        status: "success",
        data: {
          comments
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Create a comment
  app.post("/api/posts/:postId/comments", authenticateJWT, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.postId);
      
      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({
          status: "error",
          error: {
            message: "Post not found"
          }
        });
      }
      
      // Validate comment data
      const commentData = { ...req.body, postId };
      const result = insertCommentSchema.safeParse(commentData);
      if (!result.success) {
        return res.status(422).json({
          status: "error",
          error: {
            message: "Validation failed",
            details: result.error.format()
          }
        });
      }
      
      if (!req.user) {
        return res.status(401).json({
          status: "error",
          error: {
            message: "Authentication required"
          }
        });
      }
      
      const comment = await storage.createComment(result.data, req.user.id);
      const comments = await storage.getCommentsByPostId(postId);
      const authoredComment = comments.find(c => c.id === comment.id);
      
      res.status(201).json({
        status: "success",
        data: {
          comment: authoredComment
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Update a comment
  app.put("/api/comments/:id", authenticateJWT, isAuthor, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      const result = z.object({
        body: z.string().min(1)
      }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({
          status: "error",
          error: {
            message: "Validation failed",
            details: result.error.format()
          }
        });
      }
      
      const comment = await storage.updateComment(id, result.data);
      
      if (!comment) {
        return res.status(404).json({
          status: "error",
          error: {
            message: "Comment not found"
          }
        });
      }
      
      const comments = await storage.getCommentsByPostId(comment.postId);
      const authoredComment = comments.find(c => c.id === comment.id);
      
      res.json({
        status: "success",
        data: {
          comment: authoredComment
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Delete a comment
  app.delete("/api/comments/:id", authenticateJWT, isAuthor, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteComment(id);
      
      if (!deleted) {
        return res.status(404).json({
          status: "error",
          error: {
            message: "Comment not found"
          }
        });
      }
      
      res.json({
        status: "success",
        data: null
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== TAGS =====
  // Get all tags
  app.get("/api/tags", async (_req, res, next) => {
    try {
      const tags = await storage.getAllTags();
      
      res.json({
        status: "success",
        data: {
          tags
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Update tags for a post
  app.put("/api/posts/:id/tags", authenticateJWT, isAuthor, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      const result = z.object({
        tags: z.array(z.string()).min(1)
      }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(422).json({
          status: "error",
          error: {
            message: "Validation failed",
            details: result.error.format()
          }
        });
      }
      
      const updatedTags = await storage.updatePostTags(id, result.data.tags);
      
      res.json({
        status: "success",
        data: {
          tags: updatedTags
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
