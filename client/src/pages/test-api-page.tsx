import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Terminal, Play, Clock, AlertCircle } from "lucide-react";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ResponseData {
  status: number;
  statusText: string;
  time: number;
  data: any;
}

export default function TestApiPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [method, setMethod] = useState<RequestMethod>("GET");
  const [endpoint, setEndpoint] = useState("/posts");
  const [requestBody, setRequestBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);

  const handleSendRequest = async () => {
    // Validate endpoint
    if (!endpoint) {
      toast({
        title: "Missing endpoint",
        description: "Please enter an API endpoint",
        variant: "destructive"
      });
      return;
    }

    // Ensure endpoint starts with /
    const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    
    // Prepend /api if not already included
    const apiEndpoint = formattedEndpoint.startsWith("/api") 
      ? formattedEndpoint 
      : `/api${formattedEndpoint}`;
    
    // Parse request body if present
    let parsedBody;
    if (requestBody && (method === "POST" || method === "PUT" || method === "PATCH")) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please enter valid JSON in the request body",
          variant: "destructive"
        });
        return;
      }
    }
    
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      const res = await apiRequest(method, apiEndpoint, parsedBody);
      const endTime = performance.now();
      
      // Get response data
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: Math.round(endTime - startTime),
        data
      });
    } catch (error) {
      const endTime = performance.now();
      setResponse({
        status: 0,
        statusText: "Error",
        time: Math.round(endTime - startTime),
        data: {
          error: (error as Error).message || "Unknown error occurred"
        }
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Define example endpoints for quick selection
  const exampleEndpoints = [
    { name: "List Posts", value: "/posts", method: "GET", body: "" },
    { name: "Get Post", value: "/posts/1", method: "GET", body: "" },
    { 
      name: "Create Post", 
      value: "/posts",
      method: "POST", 
      body: JSON.stringify({
        title: "New Post",
        body: "This is a test post created via the API",
        tags: ["test", "api"]
      }, null, 2)
    },
    { 
      name: "Add Comment", 
      value: "/posts/1/comments", 
      method: "POST", 
      body: JSON.stringify({
        body: "This is a test comment"
      }, null, 2)
    },
    { name: "List Tags", value: "/tags", method: "GET", body: "" },
  ];
  
  const handleExampleSelect = (example: { name: string, value: string, method: string, body: string }) => {
    setEndpoint(example.value);
    setMethod(example.method as RequestMethod);
    setRequestBody(example.body);
  };
  
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800";
    if (status >= 300 && status < 400) return "bg-blue-100 text-blue-800";
    if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-800";
    if (status >= 500) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Terminal className="mr-2 h-8 w-8" />
          API Tester
        </h1>
        <p className="text-gray-600 mt-2">
          Test API endpoints directly from your browser
        </p>
      </div>
      
      {!user && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Some API endpoints require authentication. You may need to log in to test all endpoints.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Request Panel */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>HTTP Request</CardTitle>
              <CardDescription>Configure your API request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <Select value={method} onValueChange={(value) => setMethod(value as RequestMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /api
                  </span>
                  <Input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/posts"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              {(method === "POST" || method === "PUT" || method === "PATCH") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Body (JSON)</label>
                  <Textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{"title": "New Post", "body": "Content..."}'
                    className="font-mono h-40"
                  />
                </div>
              )}
              
              <Button 
                onClick={handleSendRequest} 
                className="w-full flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Example Endpoints</p>
                <div className="space-y-2">
                  {exampleEndpoints.map((example, index) => (
                    <div 
                      key={index} 
                      className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleExampleSelect(example)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{example.name}</span>
                        <Badge variant="outline">{example.method}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{example.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Response Panel */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Response</span>
                {response && (
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(response.status)}>
                      {response.status} {response.statusText}
                    </Badge>
                    <Badge variant="outline">{response.time}ms</Badge>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {response 
                  ? "Response data from the API endpoint" 
                  : "Send a request to see the response"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {response ? (
                <div className="bg-gray-900 text-gray-50 p-4 rounded-md overflow-auto max-h-[600px]">
                  <pre className="font-mono text-sm whitespace-pre-wrap">
                    {typeof response.data === 'string' 
                      ? response.data 
                      : JSON.stringify(response.data, null, 2)
                    }
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 text-gray-500 p-6 rounded-md text-center">
                  <Terminal className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>No response data yet. Send a request to see results.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
