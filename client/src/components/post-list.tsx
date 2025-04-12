import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PostCard from "./post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { X, Search, Filter } from "lucide-react";
import { PostWithDetails } from "@shared/schema";

interface PostListProps {
  authorId?: number;
  limit?: number;
}

export default function PostList({ authorId, limit }: PostListProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const perPage = limit || 10;
  
  const { data, isLoading, error } = useQuery<{ status: string; data: { posts: PostWithDetails[]; meta: any } }>({
    queryKey: ["/api/posts", authorId ? `?author_id=${authorId}` : ""],
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <p className="text-sm text-red-700">Failed to load posts: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!data || !data.data || !data.data.posts || data.data.posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {authorId ? "You haven't created any posts yet." : "There are no posts available."}
        </p>
      </div>
    );
  }
  
  // Extract all unique tags from posts
  const allTags = Array.from(
    new Set(
      data.data.posts.flatMap(post => post.tags)
    )
  ).sort();
  
  // Filter posts by search term and selected tag
  let filteredPosts = [...data.data.posts];
  
  if (searchTerm) {
    filteredPosts = filteredPosts.filter(
      post => post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             post.body.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (selectedTag) {
    filteredPosts = filteredPosts.filter(
      post => post.tags.includes(selectedTag)
    );
  }
  
  // Sort posts
  filteredPosts.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });
  
  // Apply pagination
  const totalPages = Math.ceil(filteredPosts.length / perPage);
  const paginatedPosts = filteredPosts.slice((page - 1) * perPage, page * perPage);
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by tag:</span>
          <div className="flex flex-wrap gap-1">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
                {selectedTag === tag && (
                  <X className="ml-1 h-3 w-3" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTag(null);
                  }} />
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Active filters display */}
      {(searchTerm || selectedTag) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchTerm}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
            </Badge>
          )}
          {selectedTag && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tag: {selectedTag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTag(null)} />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              setSearchTerm("");
              setSelectedTag(null);
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredPosts.length === 0 
          ? "No posts match your filters" 
          : `Showing ${paginatedPosts.length} of ${filteredPosts.length} posts`
        }
      </div>
      
      {/* Post list */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-6">
          {paginatedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(page - 1)}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  
                  // Logic to show pages around current page
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (page <= 3) {
                    pageNumber = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = page - 2 + i;
                  }
                  
                  if (pageNumber === 1 || pageNumber === totalPages || 
                      (pageNumber >= page - 1 && pageNumber <= page + 1)) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={page === pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (pageNumber === 2 || pageNumber === totalPages - 1) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(page + 1)}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
