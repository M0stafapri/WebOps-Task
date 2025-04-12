import schedule from "node-schedule";
import { storage } from "./storage";

export function setupScheduler() {
  // Schedule posts deletion job to run every hour
  const job = schedule.scheduleJob("0 * * * *", async () => {
    try {
      console.log("Running scheduled post deletion job...");
      
      // Get posts older than 24 hours
      const oldPosts = await storage.getPostsOlderThan(24);
      
      if (oldPosts.length > 0) {
        console.log(`Found ${oldPosts.length} posts to delete`);
        
        // Delete each post
        for (const post of oldPosts) {
          await storage.deletePost(post.id);
          console.log(`Deleted post with id: ${post.id}`);
        }
        
        console.log("Post deletion job completed successfully");
      } else {
        console.log("No posts to delete");
      }
    } catch (error) {
      console.error("Error in post deletion job:", error);
    }
  });
  
  return job;
}
