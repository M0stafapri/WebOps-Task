import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

type PostFormProps = {
  initialData?: z.infer<typeof insertPostSchema>;
  postId?: number;
  onSuccess?: () => void;
};

export default function PostForm({ initialData, postId, onSuccess }: PostFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const defaultValues = initialData || {
    title: "",
    body: "",
    tags: [""] // At least one empty tag field
  };
  
  const form = useForm<z.infer<typeof insertPostSchema>>({
    resolver: zodResolver(insertPostSchema),
    defaultValues
  });
  
  const isEditing = !!postId;
  const tags = form.watch("tags");
  
  const createPostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertPostSchema>) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        toast({
          title: "Post created successfully",
          description: "Your post has been published."
        });
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        form.reset(defaultValues);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.error?.message || "Failed to create post");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const updatePostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertPostSchema>) => {
      const res = await apiRequest("PUT", `/api/posts/${postId}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        toast({
          title: "Post updated successfully",
          description: "Your changes have been saved."
        });
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/posts", postId?.toString()] });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.error?.message || "Failed to update post");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update post",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const onSubmit = (data: z.infer<typeof insertPostSchema>) => {
    // Filter out empty tags
    const filteredData = {
      ...data,
      tags: data.tags.filter(tag => tag.trim() !== "")
    };
    
    if (isEditing) {
      updatePostMutation.mutate(filteredData);
    } else {
      createPostMutation.mutate(filteredData);
    }
  };
  
  const addTagField = () => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", [...currentTags, ""]);
  };
  
  const removeTagField = (index: number) => {
    const currentTags = form.getValues("tags");
    if (currentTags.length > 1) {
      currentTags.splice(index, 1);
      form.setValue("tags", currentTags);
    }
  };
  
  const isSubmitting = createPostMutation.isPending || updatePostMutation.isPending;
  
  if (!user) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              You need to be logged in to create or edit posts.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Post title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Write your post content here..." 
                  className="min-h-[200px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <FormLabel>Tags</FormLabel>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addTagField}
            >
              Add Tag
            </Button>
          </div>
          
          {form.formState.errors.tags?.message && (
            <p className="text-sm font-medium text-destructive mb-2">
              {form.formState.errors.tags.message}
            </p>
          )}
          
          <div className="space-y-2">
            {tags.map((_, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`tags.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Tag name" 
                          {...field} 
                          className="flex-1"
                        />
                        {tags.length > 1 && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => removeTagField(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            At least one tag is required. Separate multiple tags by adding new fields.
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Posting...") 
              : (isEditing ? "Update Post" : "Create Post")
            }
          </Button>
        </div>
        
        {!isEditing && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Note: All posts will be automatically deleted after 24 hours.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
