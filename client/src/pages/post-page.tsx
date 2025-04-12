import { useQuery } from "@tanstack/react-query";
import { Redirect, useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, Loader2, Pencil } from "lucide-react";
import PostCard from "@/components/post-card";
import CommentList from "@/components/comment-list";
import PostForm from "@/components/post-form";
import { PostWithDetails } from "@shared/schema";

export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data, isLoading, error } = useQuery<{ status: string; data: { post: PostWithDetails } }>({
    queryKey: ["/api/posts", id],
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
          <p className="text-lg text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.data || !data.data.post) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back to posts
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">
              The post you're looking for doesn't exist, has been deleted, or has expired.
            </p>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const post = data.data.post;
  const isAuthor = user && user.id === post.author.id;

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to posts
          </Button>
        </Link>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">Edit Post</h1>
          </CardHeader>
          <CardContent>
            <PostForm
              initialData={{
                title: post.title,
                body: post.body,
                tags: post.tags
              }}
              postId={post.id}
              onSuccess={() => setIsEditing(false)}
            />
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="mb-8">
            <PostCard 
              post={post} 
              isDetailed={true} 
              onEdit={() => setIsEditing(true)} 
            />
          </div>

          <Separator className="my-8" />

          <div className="mt-8">
            <CommentList postId={post.id} />
          </div>
        </>
      )}
    </div>
  );
}
