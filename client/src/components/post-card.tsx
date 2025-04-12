import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, Clock, Pencil, Trash2, UserCircle } from "lucide-react";
import { PostWithDetails } from "@shared/schema";

interface PostCardProps {
  post: PostWithDetails;
  isDetailed?: boolean;
  onEdit?: () => void;
}

export default function PostCard({ post, isDetailed = false, onEdit }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isAuthor = user && user.id === post.author.id;
  
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/posts/${post.id}`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        toast({
          title: "Post deleted",
          description: "Your post has been deleted successfully."
        });
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      } else {
        throw new Error(data.error?.message || "Failed to delete post");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete post",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleDelete = () => {
    setIsDeleting(true);
    deletePostMutation.mutate();
  };
  
  // Calculate expiry time (24 hours from creation)
  const expiryTime = new Date(post.createdAt);
  expiryTime.setHours(expiryTime.getHours() + 24);
  const timeLeft = formatDistanceToNow(expiryTime, { addSuffix: true });
  const formattedCreatedAt = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  
  // Check if post is expiring soon (less than 2 hours left)
  const now = new Date();
  const isExpiringSoon = ((expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60)) < 2;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl mr-2">
            {isDetailed ? (
              post.title
            ) : (
              <Link href={`/post/${post.id}`}>
                <a className="text-xl font-bold hover:text-primary-600 transition-colors">
                  {post.title}
                </a>
              </Link>
            )}
          </CardTitle>
          
          {isAuthor && (
            <div className="flex space-x-2">
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your post. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600"
                      disabled={deletePostMutation.isPending}
                    >
                      {deletePostMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="flex items-center mr-4">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback className="text-xs">
                  {post.author.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {post.author.name}
            </div>
            
            <div className="flex items-center mr-4">
              <Clock className="h-4 w-4 mr-1" />
              <span className={isExpiringSoon ? "text-red-500 font-medium" : ""}>
                Expires {timeLeft}
              </span>
            </div>
            
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isDetailed ? (
          <div className="prose max-w-none">
            {post.body.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="text-gray-700 line-clamp-3">{post.body}</p>
        )}
      </CardContent>
      
      {!isDetailed && (
        <CardFooter className="border-t pt-3 flex justify-between">
          <div className="text-xs text-muted-foreground">
            Posted {formattedCreatedAt}
          </div>
          <Link href={`/post/${post.id}`}>
            <Button variant="outline" size="sm">
              Read More
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
