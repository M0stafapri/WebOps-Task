import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentFormProps = {
  postId: number;
  commentId?: number;
  initialValue?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export default function CommentForm({
  postId,
  commentId,
  initialValue = "",
  onSuccess,
  onCancel
}: CommentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!commentId;
  
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      body: initialValue
    }
  });
  
  const createCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        toast({
          title: "Comment posted",
          description: "Your comment has been added."
        });
        form.reset({ body: "" });
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.error?.message || "Failed to post comment");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const updateCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const res = await apiRequest("PUT", `/api/comments/${commentId}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        toast({
          title: "Comment updated",
          description: "Your comment has been updated."
        });
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.error?.message || "Failed to update comment");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const onSubmit = (data: CommentFormValues) => {
    if (isEditing) {
      updateCommentMutation.mutate(data);
    } else {
      createCommentMutation.mutate(data);
    }
  };
  
  const isSubmitting = createCommentMutation.isPending || updateCommentMutation.isPending;
  
  if (!user) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-sm text-gray-600">
          You need to be logged in to post a comment.
        </p>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea 
                  placeholder="Write your comment here..." 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          {isEditing && onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Posting...") 
              : (isEditing ? "Update Comment" : "Post Comment")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
