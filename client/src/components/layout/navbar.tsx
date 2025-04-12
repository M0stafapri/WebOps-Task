import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Menu, X, FileText, Home, LayoutDashboard, Terminal } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, protected: true },
    { name: "API Tester", href: "/test-api", icon: Terminal, protected: true },
  ];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center">
                <BookOpen className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Blog API</span>
              </a>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden ml-10 space-x-8 md:flex">
              {navItems.map((item) => {
                // Skip protected routes if user is not logged in
                if (item.protected && !user) return null;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={`flex items-center text-sm font-medium ${
                        location === item.href
                          ? "text-primary-600"
                          : "text-gray-700 hover:text-primary-500"
                      }`}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Desktop right section */}
          <div className="hidden md:flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {user.name.split(" ").map(name => name[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <a className="w-full cursor-pointer">Dashboard</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navItems.map((item) => {
                // Skip protected routes if user is not logged in
                if (item.protected && !user) return null;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                        location === item.href
                          ? "bg-primary-50 text-primary-600"
                          : "text-gray-900 hover:bg-gray-50 hover:text-primary-600"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
              
              {user ? (
                <>
                  <div className="border-t border-gray-200 my-3"></div>
                  <div className="px-3 py-2">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {user.name.split(" ").map(name => name[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">{user.name}</div>
                        <div className="text-sm font-medium text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign out
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 my-3"></div>
                  <div className="px-3 py-2">
                    <Link href="/auth">
                      <Button
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
