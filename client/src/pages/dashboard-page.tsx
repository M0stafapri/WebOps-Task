import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, FileText, MessageSquare, Tag, Edit3, PlusCircle } from "lucide-react";
import PostList from "@/components/post-list";
import PostForm from "@/components/post-form";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  
  const { data: postsData } = useQuery<{ status: string; data: { posts: any[] } }>({
    queryKey: ["/api/posts", `?author_id=${user?.id}`],
  });
  
  const { data: commentsData } = useQuery<{ status: string; data: { comments: any[] } }>({
    queryKey: [`/api/posts/comments`],
  });
  
  const { data: tagsData } = useQuery<{ status: string; data: { tags: any[] } }>({
    queryKey: ["/api/tags"],
  });
  
  // Calculate stats
  const postCount = postsData?.data?.posts?.length || 0;
  const commentCount = commentsData?.data?.comments?.length || 0;
  const tagCount = tagsData?.data?.tags?.length || 0;
  
  // Find expiring posts (posts created more than 22 hours ago)
  const expiringPosts = postsData?.data?.posts?.filter(post => {
    const createdAt = new Date(post.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation > 22 && hoursSinceCreation < 24;
  }) || [];

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your posts, comments, and activity
        </p>
      </div>
      
      {/* User Profile & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* User Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="text-2xl">
                  {user?.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
              <Button variant="outline" size="sm" className="mb-4 w-full">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card className="md:col-span-1 bg-primary-50 border-primary-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 text-primary-500" />
              <span className="text-3xl font-bold text-primary-700">{postCount}</span>
            </div>
            <h3 className="text-lg font-medium text-primary-900">Posts</h3>
            <p className="text-sm text-primary-700 mt-1">
              You have created {postCount} blog posts
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 bg-green-50 border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold text-green-700">{commentCount}</span>
            </div>
            <h3 className="text-lg font-medium text-green-900">Comments</h3>
            <p className="text-sm text-green-700 mt-1">
              Across all your posts
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 bg-yellow-50 border-yellow-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-yellow-500" />
              <span className="text-3xl font-bold text-yellow-700">{expiringPosts.length}</span>
            </div>
            <h3 className="text-lg font-medium text-yellow-900">Posts Expiring Soon</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Will be deleted in the next 2 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Content</CardTitle>
                  <CardDescription>Manage your posts and comments</CardDescription>
                </div>
                <Button 
                  onClick={() => setIsCreatingPost(!isCreatingPost)}
                  className="flex items-center gap-1"
                >
                  {isCreatingPost ? (
                    <>Cancel</>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 mr-1" /> 
                      New Post
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <Separator />
            
            <CardContent className="pt-6">
              {isCreatingPost ? (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">Create New Post</h2>
                  <PostForm 
                    onSuccess={() => setIsCreatingPost(false)}
                  />
                </div>
              ) : (
                <Tabs defaultValue="posts">
                  <TabsList className="mb-4">
                    <TabsTrigger value="posts" className="flex items-center gap-1">
                      <FileText className="h-4 w-4" /> 
                      Posts
                    </TabsTrigger>
                    <TabsTrigger value="expiring" className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> 
                      Expiring Soon
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="posts" className="mt-0">
                    <PostList 
                      authorId={user?.id} 
                    />
                  </TabsContent>
                  
                  <TabsContent value="expiring" className="mt-0">
                    {expiringPosts.length > 0 ? (
                      <div className="space-y-6">
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-yellow-700">
                                These posts will be automatically deleted within the next 2 hours.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {expiringPosts.map(post => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-6 text-center">
                        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No posts expiring soon</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          None of your posts are scheduled for deletion in the next 2 hours.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
