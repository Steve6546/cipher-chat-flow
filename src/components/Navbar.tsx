import { MessageCircle, Settings, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user?: { username: string };
}

export default function Navbar({ currentPage, onNavigate, user }: NavbarProps) {
  return (
    <nav className="bg-gradient-card border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <MessageCircle className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-online rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SecureChat 2025
              </h1>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-online rounded-full"></div>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={currentPage === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate('chat')}
                  className="flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('login')}
                  className="flex items-center space-x-2 text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}