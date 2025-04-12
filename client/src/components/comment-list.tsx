import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, MessageSquare } from "lucide-react";
import CommentForm from "./comment-form";
import { CommentWithAuthor } from "@shared/schema";

interface CommentListProps {
  postId: number;
}

export default function CommentList({ postId }: CommentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  
  const { data, isLoading, error } = useQuery<{ status: string; data: { comments: CommentWithAuthor[] } }>({
    queryKey: [`/api/posts/${postId}/comments`],
  });
  
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest("DELETE", `/api/comments/${commentId}`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        toast({
          title: "Comment deleted",
          description: "Your comment has been deleted successfully."
        });
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      } else {
        throw new Error(data.error?.message || "Failed to delete comment");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleDelete = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">Failed to load comments: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const comments = data?.data.comments || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-medium">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h3>
      </div>
      
      {/* Add new comment */}
      <div className="mb-6">
        <CommentForm 
          postId={postId}
          onSuccess={() => setEditingCommentId(null)}
        />
      </div>
      
      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <Card key={comment.id} className="overflow-hidden">
              {editingCommentId === comment.id ? (
                <CardContent className="pt-6">
                  <CommentForm 
                    postId={postId}
                    commentId={comment.id}
                    initialValue={comment.body}
                    onSuccess={() => setEditingCommentId(null)}
                    onCancel={() => setEditingCommentId(null)}
                  />
                </CardContent>
              ) : (
                <>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>
                            {comment.author.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{comment.author.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      
                      {user && user.id === comment.author.id && (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCommentId(comment.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
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
                                  This will permanently delete your comment. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(comment.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                  disabled={deleteCommentMutation.isPending}
                                >
                                  {deleteCommentMutation.isPending ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-gray-700">
                      {comment.body.split("\n").map((paragraph, i) => (
                        <p key={i} className="mb-2">{paragraph}</p>
                      ))}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
