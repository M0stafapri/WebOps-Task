import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, BookOpenCheck, FileText, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import PostList from "@/components/post-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-8 bg-white p-8 rounded-lg shadow">
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="mx-auto h-16 w-16 text-primary-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog API Platform</h1>
          <p className="text-xl text-gray-600 mb-6">
            A RESTful API for creating and managing blog posts with authentication, tagging, and commenting features.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className={user ? "hidden" : ""}>
                Get Started
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className={!user ? "hidden" : ""}>
                Dashboard
              </Button>
            </Link>
            <Link href="/test-api">
              <Button size="lg" variant="outline">
                Test API
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Sidebar - API Features */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Key Features
            </CardTitle>
            <CardDescription>
              Explore the capabilities of our Blog API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 p-1">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-sm text-gray-600">User authentication with JWT tokens</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 p-1">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-sm text-gray-600">Create, read, update, and delete blog posts</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 p-1">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-sm text-gray-600">Add comments to posts with full CRUD operations</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 p-1">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-sm text-gray-600">Tag posts for better organization</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 p-1">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-sm text-gray-600">Automatic post deletion after 24 hours</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 p-1">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-sm text-gray-600">Proper authorization for all endpoints</p>
              </li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Note: All posts are automatically deleted after 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content - Posts */}
        <div className="md:col-span-2">
          <Tabs defaultValue="all" className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <FileText className="mr-2 h-6 w-6" />
                Recent Posts
              </h2>
              <TabsList>
                <TabsTrigger value="all">All Posts</TabsTrigger>
                {user && (
                  <TabsTrigger value="mine">My Posts</TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <PostList limit={6} />
            </TabsContent>
            
            {user && (
              <TabsContent value="mine" className="mt-0">
                <PostList authorId={user.id} limit={6} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
