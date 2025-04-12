import { users, posts, tags, postTags, comments } from "@shared/schema";
import type {
  User,
  InsertUser,
  Post,
  InsertPost,
  Tag,
  InsertTag,
  PostTag,
  InsertPostTag,
  Comment,
  InsertComment,
  PostWithDetails,
  CommentWithAuthor
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, lt, and, count, sql, desc } from "drizzle-orm";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Define the session store type
type SessionStore = session.Store;

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Post operations
  createPost(post: InsertPost, authorId: number): Promise<Post>;
  getPost(id: number): Promise<PostWithDetails | undefined>;
  getAllPosts(): Promise<PostWithDetails[]>;
  getPostsByAuthor(authorId: number): Promise<PostWithDetails[]>;
  getPostsByTag(tagName: string): Promise<PostWithDetails[]>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  // Tag operations
  createTag(tag: InsertTag): Promise<Tag>;
  getTagByName(name: string): Promise<Tag | undefined>;
  getAllTags(): Promise<Tag[]>;
  
  // PostTag operations
  addTagToPost(postId: number, tagId: number): Promise<PostTag>;
  removeTagFromPost(postId: number, tagId: number): Promise<boolean>;
  getTagsByPostId(postId: number): Promise<Tag[]>;
  updatePostTags(postId: number, tagNames: string[]): Promise<string[]>;
  
  // Comment operations
  createComment(comment: InsertComment, authorId: number): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<CommentWithAuthor[]>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  getComment(id: number): Promise<Comment | undefined>;
  
  // Scheduled operations
  getPostsOlderThan(hours: number): Promise<Post[]>;
  
  // Session store
  sessionStore: SessionStore;
}

// Memory Storage Implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private tags: Map<number, Tag>;
  private postTags: Map<number, PostTag>;
  private comments: Map<number, Comment>;
  
  private userId: number;
  private postId: number;
  private tagId: number;
  private postTagId: number;
  private commentId: number;
  
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.tags = new Map();
    this.postTags = new Map();
    this.comments = new Map();
    
    this.userId = 1;
    this.postId = 1;
    this.tagId = 1;
    this.postTagId = 1;
    this.commentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }
  
  // Post methods
  async createPost(postData: InsertPost, authorId: number): Promise<Post> {
    const id = this.postId++;
    const post: Post = {
      id,
      title: postData.title,
      body: postData.body,
      authorId,
      createdAt: new Date()
    };
    this.posts.set(id, post);
    
    // Create tags and post-tag relationships
    if (postData.tags && postData.tags.length > 0) {
      await this.updatePostTags(id, postData.tags);
    }
    
    return post;
  }
  
  async getPost(id: number): Promise<PostWithDetails | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const author = this.users.get(post.authorId);
    if (!author) return undefined;
    
    const tags = await this.getTagsByPostId(id);
    const comments = await this.getCommentsByPostId(id);
    
    return {
      ...post,
      author: {
        id: author.id,
        name: author.name
      },
      tags: tags.map(tag => tag.name),
      commentCount: comments.length
    };
  }
  
  async getAllPosts(): Promise<PostWithDetails[]> {
    const posts: PostWithDetails[] = [];
    
    for (const post of this.posts.values()) {
      const postWithDetails = await this.getPost(post.id);
      if (postWithDetails) {
        posts.push(postWithDetails);
      }
    }
    
    return posts;
  }
  
  async getPostsByAuthor(authorId: number): Promise<PostWithDetails[]> {
    const posts: PostWithDetails[] = [];
    
    for (const post of this.posts.values()) {
      if (post.authorId === authorId) {
        const postWithDetails = await this.getPost(post.id);
        if (postWithDetails) {
          posts.push(postWithDetails);
        }
      }
    }
    
    return posts;
  }
  
  async getPostsByTag(tagName: string): Promise<PostWithDetails[]> {
    const tag = await this.getTagByName(tagName);
    if (!tag) return [];
    
    const relevantPostTags = Array.from(this.postTags.values())
      .filter(pt => pt.tagId === tag.id);
    
    const posts: PostWithDetails[] = [];
    
    for (const pt of relevantPostTags) {
      const postWithDetails = await this.getPost(pt.postId);
      if (postWithDetails) {
        posts.push(postWithDetails);
      }
    }
    
    return posts;
  }
  
  async updatePost(id: number, postData: Partial<InsertPost>): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const updatedPost: Post = {
      ...post,
      ...(postData.title ? { title: postData.title } : {}),
      ...(postData.body ? { body: postData.body } : {})
    };
    
    this.posts.set(id, updatedPost);
    
    // Update tags if provided
    if (postData.tags && postData.tags.length > 0) {
      await this.updatePostTags(id, postData.tags);
    }
    
    return updatedPost;
  }
  
  async deletePost(id: number): Promise<boolean> {
    if (!this.posts.has(id)) return false;
    
    // Delete related comments
    for (const [commentId, comment] of this.comments.entries()) {
      if (comment.postId === id) {
        this.comments.delete(commentId);
      }
    }
    
    // Delete related post tags
    for (const [postTagId, postTag] of this.postTags.entries()) {
      if (postTag.postId === id) {
        this.postTags.delete(postTagId);
      }
    }
    
    return this.posts.delete(id);
  }
  
  // Tag methods
  async createTag(tagData: InsertTag): Promise<Tag> {
    const id = this.tagId++;
    const tag: Tag = { ...tagData, id };
    this.tags.set(id, tag);
    return tag;
  }
  
  async getTagByName(name: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values()).find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }
  
  // PostTag methods
  async addTagToPost(postId: number, tagId: number): Promise<PostTag> {
    const id = this.postTagId++;
    const postTag: PostTag = { id, postId, tagId };
    this.postTags.set(id, postTag);
    return postTag;
  }
  
  async removeTagFromPost(postId: number, tagId: number): Promise<boolean> {
    for (const [id, postTag] of this.postTags.entries()) {
      if (postTag.postId === postId && postTag.tagId === tagId) {
        return this.postTags.delete(id);
      }
    }
    return false;
  }
  
  async getTagsByPostId(postId: number): Promise<Tag[]> {
    const postTagEntries = Array.from(this.postTags.values())
      .filter(pt => pt.postId === postId);
    
    const tags: Tag[] = [];
    
    for (const pt of postTagEntries) {
      const tag = this.tags.get(pt.tagId);
      if (tag) tags.push(tag);
    }
    
    return tags;
  }
  
  async updatePostTags(postId: number, tagNames: string[]): Promise<string[]> {
    // First get existing tags for this post
    const existingTags = await this.getTagsByPostId(postId);
    const existingTagNames = existingTags.map(t => t.name.toLowerCase());
    
    // Process each tag name
    const normalizedTags = tagNames.map(t => t.toLowerCase().trim());
    const uniqueTags = [...new Set(normalizedTags)];
    
    // Add new tags
    for (const tagName of uniqueTags) {
      if (tagName === '') continue;
      
      // Skip if tag already exists for this post
      if (existingTagNames.includes(tagName)) continue;
      
      // Get or create the tag
      let tag = await this.getTagByName(tagName);
      if (!tag) {
        tag = await this.createTag({ name: tagName });
      }
      
      // Create the post-tag relationship
      await this.addTagToPost(postId, tag.id);
    }
    
    // Remove tags that are no longer associated
    for (const existingTag of existingTags) {
      if (!uniqueTags.includes(existingTag.name.toLowerCase())) {
        await this.removeTagFromPost(postId, existingTag.id);
      }
    }
    
    // Return updated tags
    const updatedTags = await this.getTagsByPostId(postId);
    return updatedTags.map(t => t.name);
  }
  
  // Comment methods
  async createComment(commentData: InsertComment, authorId: number): Promise<Comment> {
    const id = this.commentId++;
    const comment: Comment = {
      id,
      body: commentData.body,
      authorId,
      postId: commentData.postId,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }
  
  async getCommentsByPostId(postId: number): Promise<CommentWithAuthor[]> {
    const commentsWithAuthor: CommentWithAuthor[] = [];
    
    for (const comment of this.comments.values()) {
      if (comment.postId === postId) {
        const author = this.users.get(comment.authorId);
        if (author) {
          commentsWithAuthor.push({
            ...comment,
            author: {
              id: author.id,
              name: author.name
            }
          });
        }
      }
    }
    
    return commentsWithAuthor;
  }
  
  async updateComment(id: number, commentData: Partial<InsertComment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updatedComment: Comment = {
      ...comment,
      ...(commentData.body ? { body: commentData.body } : {})
    };
    
    this.comments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  // Scheduled operations
  async getPostsOlderThan(hours: number): Promise<Post[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return Array.from(this.posts.values()).filter(
      post => post.createdAt < cutoffTime
    );
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  // Post methods
  async createPost(postData: InsertPost, authorId: number): Promise<Post> {
    const [post] = await db.insert(posts).values({
      title: postData.title,
      body: postData.body,
      authorId
    }).returning();
    
    // Create tags and post-tag relationships
    if (postData.tags && postData.tags.length > 0) {
      await this.updatePostTags(post.id, postData.tags);
    }
    
    return post;
  }
  
  async getPost(id: number): Promise<PostWithDetails | undefined> {
    // Get the post
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return undefined;
    
    // Get the author details
    const [author] = await db.select({
      id: users.id,
      name: users.name
    }).from(users).where(eq(users.id, post.authorId));
    
    if (!author) return undefined;
    
    // Get tags for the post
    const tags = await this.getTagsByPostId(id);
    
    // Get comment count
    const [commentCountResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.postId, id));
    
    return {
      ...post,
      author,
      tags: tags.map(tag => tag.name),
      commentCount: Number(commentCountResult.count)
    };
  }
  
  async getAllPosts(): Promise<PostWithDetails[]> {
    const allPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        authorName: users.name
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));
    
    const postsWithDetails: PostWithDetails[] = [];
    
    for (const post of allPosts) {
      const postWithDetails = await this.getPost(post.id);
      if (postWithDetails) {
        postsWithDetails.push(postWithDetails);
      }
    }
    
    return postsWithDetails;
  }
  
  async getPostsByAuthor(authorId: number): Promise<PostWithDetails[]> {
    const authorPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        authorId: posts.authorId,
        createdAt: posts.createdAt
      })
      .from(posts)
      .where(eq(posts.authorId, authorId))
      .orderBy(desc(posts.createdAt));
    
    const postsWithDetails: PostWithDetails[] = [];
    
    for (const post of authorPosts) {
      const postWithDetails = await this.getPost(post.id);
      if (postWithDetails) {
        postsWithDetails.push(postWithDetails);
      }
    }
    
    return postsWithDetails;
  }
  
  async getPostsByTag(tagName: string): Promise<PostWithDetails[]> {
    // Get the tag
    const [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, tagName));
    
    if (!tag) return [];
    
    // Get post IDs with this tag
    const postIdsWithTag = await db
      .select({
        postId: postTags.postId
      })
      .from(postTags)
      .where(eq(postTags.tagId, tag.id));
    
    const postIds = postIdsWithTag.map(pt => pt.postId);
    
    // Get posts with details
    const postsWithDetails: PostWithDetails[] = [];
    
    for (const postId of postIds) {
      const postWithDetails = await this.getPost(postId);
      if (postWithDetails) {
        postsWithDetails.push(postWithDetails);
      }
    }
    
    return postsWithDetails;
  }
  
  async updatePost(id: number, postData: Partial<InsertPost>): Promise<Post | undefined> {
    // Update post data
    const updateData: Record<string, any> = {};
    if (postData.title) updateData.title = postData.title;
    if (postData.body) updateData.body = postData.body;
    
    if (Object.keys(updateData).length === 0) {
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      return post;
    }
    
    const [updatedPost] = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, id))
      .returning();
    
    if (!updatedPost) return undefined;
    
    // Update tags if provided
    if (postData.tags && postData.tags.length > 0) {
      await this.updatePostTags(id, postData.tags);
    }
    
    return updatedPost;
  }
  
  async deletePost(id: number): Promise<boolean> {
    // Delete related comments
    await db.delete(comments).where(eq(comments.postId, id));
    
    // Delete post-tag relationships
    await db.delete(postTags).where(eq(postTags.postId, id));
    
    // Delete the post
    const [deletedPost] = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning();
    
    return !!deletedPost;
  }
  
  // Tag methods
  async createTag(tagData: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(tagData).returning();
    return tag;
  }
  
  async getTagByName(name: string): Promise<Tag | undefined> {
    const [tag] = await db
      .select()
      .from(tags)
      .where(sql`LOWER(${tags.name}) = LOWER(${name})`);
    
    return tag;
  }
  
  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }
  
  // PostTag methods
  async addTagToPost(postId: number, tagId: number): Promise<PostTag> {
    const [existingPostTag] = await db
      .select()
      .from(postTags)
      .where(
        and(
          eq(postTags.postId, postId),
          eq(postTags.tagId, tagId)
        )
      );
    
    if (existingPostTag) return existingPostTag;
    
    const [postTag] = await db
      .insert(postTags)
      .values({ postId, tagId })
      .returning();
    
    return postTag;
  }
  
  async removeTagFromPost(postId: number, tagId: number): Promise<boolean> {
    const [deletedPostTag] = await db
      .delete(postTags)
      .where(
        and(
          eq(postTags.postId, postId),
          eq(postTags.tagId, tagId)
        )
      )
      .returning();
    
    return !!deletedPostTag;
  }
  
  async getTagsByPostId(postId: number): Promise<Tag[]> {
    const result = await db
      .select({
        id: tags.id,
        name: tags.name
      })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, postId));
    
    return result;
  }
  
  async updatePostTags(postId: number, tagNames: string[]): Promise<string[]> {
    // First get existing tags for this post
    const existingTags = await this.getTagsByPostId(postId);
    const existingTagNames = existingTags.map(t => t.name.toLowerCase());
    
    // Process each tag name
    const normalizedTags = tagNames.map(t => t.toLowerCase().trim());
    const uniqueTags = [...new Set(normalizedTags)].filter(t => t !== '');
    
    // Add new tags
    for (const tagName of uniqueTags) {
      // Skip if tag already exists for this post
      if (existingTagNames.includes(tagName)) continue;
      
      // Get or create the tag
      let tag = await this.getTagByName(tagName);
      if (!tag) {
        tag = await this.createTag({ name: tagName });
      }
      
      // Create the post-tag relationship
      await this.addTagToPost(postId, tag.id);
    }
    
    // Remove tags that are no longer associated
    for (const existingTag of existingTags) {
      if (!uniqueTags.includes(existingTag.name.toLowerCase())) {
        await this.removeTagFromPost(postId, existingTag.id);
      }
    }
    
    // Return updated tags
    const updatedTags = await this.getTagsByPostId(postId);
    return updatedTags.map(t => t.name);
  }
  
  // Comment methods
  async createComment(commentData: InsertComment, authorId: number): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        body: commentData.body,
        authorId,
        postId: commentData.postId
      })
      .returning();
    
    return comment;
  }
  
  async getCommentsByPostId(postId: number): Promise<CommentWithAuthor[]> {
    const commentsData = await db
      .select({
        id: comments.id,
        body: comments.body,
        authorId: comments.authorId,
        postId: comments.postId,
        createdAt: comments.createdAt,
        authorName: users.name
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
    
    return commentsData.map(comment => ({
      id: comment.id,
      body: comment.body,
      authorId: comment.authorId,
      postId: comment.postId,
      createdAt: comment.createdAt,
      author: {
        id: comment.authorId,
        name: comment.authorName
      }
    }));
  }
  
  async updateComment(id: number, commentData: Partial<InsertComment>): Promise<Comment | undefined> {
    if (!commentData.body) {
      const [comment] = await db.select().from(comments).where(eq(comments.id, id));
      return comment;
    }
    
    const [updatedComment] = await db
      .update(comments)
      .set({ body: commentData.body })
      .where(eq(comments.id, id))
      .returning();
    
    return updatedComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    const [deletedComment] = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();
    
    return !!deletedComment;
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }
  
  // Scheduled operations
  async getPostsOlderThan(hours: number): Promise<Post[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return await db
      .select()
      .from(posts)
      .where(lt(posts.createdAt, cutoffTime));
  }
}

// Export the Database Storage instance
export const storage = new DatabaseStorage();
