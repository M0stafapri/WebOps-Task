import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  image: text("image"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Post model
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorId: integer("author_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  authorId: true,
  createdAt: true,
}).extend({
  tags: z.array(z.string()).min(1, "At least one tag is required"),
});

// Tag model
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

// PostTag junction table
export const postTags = pgTable("post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const insertPostTagSchema = createInsertSchema(postTags).omit({
  id: true,
});

// Comment model
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  body: text("body").notNull(),
  authorId: integer("author_id").notNull(),
  postId: integer("post_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  authorId: true,
  createdAt: true,
});

// Schema types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type PostTag = typeof postTags.$inferSelect;
export type InsertPostTag = z.infer<typeof insertPostTagSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  postTags: many(postTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

// Extended types for frontend
export type PostWithDetails = Post & {
  author: {
    id: number;
    name: string;
  };
  tags: string[];
  commentCount: number;
};

export type CommentWithAuthor = Comment & {
  author: {
    id: number;
    name: string;
  };
};
