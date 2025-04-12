import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Home,
  FilePlus,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Tag,
  Terminal,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const mainNavItems = [
    {
      title: "Home",
      icon: Home,
      href: "/",
      variant: "default",
    },
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      variant: "default",
      requiresAuth: true
    },
    {
      title: "Test API",
      icon: Terminal,
      href: "/test-api",
      variant: "default",
    },
  ];

  // Only show these if user is logged in
  const userNavItems = [
    {
      title: "My Posts",
      icon: FilePlus,
      href: "/dashboard",
      variant: "ghost",
      requiresAuth: true
    },
    {
      title: "My Comments",
      icon: MessageSquare,
      href: "/dashboard",
      variant: "ghost",
      requiresAuth: true
    },
    {
      title: "Tags",
      icon: Tag,
      href: "/dashboard",
      variant: "ghost",
      requiresAuth: true
    },
  ];

  return (
    <div className={cn("py-2 h-full flex flex-col border-r bg-slate-50", className)}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <a className="flex items-center">
              <BookOpen className={cn("h-6 w-6 text-primary-600", collapsed ? "mx-auto" : "mr-2")} />
              {!collapsed && <span className="text-xl font-bold text-gray-900">Blog API</span>}
            </a>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-2"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            // Skip if it requires auth and user is not logged in
            if (item.requiresAuth && !user) return null;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.variant}
                  className={cn(
                    "w-full justify-start",
                    location === item.href ? "bg-primary-50 text-primary-700" : "text-gray-700",
                    collapsed ? "px-2" : "px-3"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", 
                      location === item.href ? "text-primary-700" : "text-gray-500",
                      collapsed ? "mx-auto" : "mr-2"
                    )}
                  />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {user && (
        <>
          <div className="px-3 py-2 mt-2">
            <h2 className={cn(
              "mb-2 text-xs font-semibold tracking-tight text-gray-500",
              collapsed ? "sr-only" : ""
            )}>
              My Content
            </h2>
            <div className="space-y-1">
              {userNavItems.map((item) => (
                <Link key={item.title} href={item.href}>
                  <Button
                    variant={item.variant}
                    className={cn(
                      "w-full justify-start",
                      collapsed ? "px-2" : "px-3"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 text-gray-500", collapsed ? "mx-auto" : "mr-2")} />
                    {!collapsed && <span>{item.title}</span>}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-auto px-3 py-3 border-t">
            {collapsed ? (
              <div className="flex justify-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[140px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-red-500"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {!user && !collapsed && (
        <div className="mt-auto px-3 py-3 border-t">
          <Link href="/auth">
            <Button className="w-full">
              Sign In
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
