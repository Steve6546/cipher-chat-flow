import { useState } from "react";
import Navbar from "./Navbar";
import Login from "../pages/Login";
import Chat from "../pages/Chat";

export default function MessagingApp() {
  const [currentPage, setCurrentPage] = useState("login");
  const [user, setUser] = useState<{ username: string } | null>(null);

  const handleLogin = (userData: { username: string }) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("login");
  };

  const handleNavigate = (page: string) => {
    if (page === "login") {
      handleLogout();
      return;
    }
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-background">
      {user && (
        <Navbar 
          currentPage={currentPage}
          onNavigate={handleNavigate}
          user={user}
        />
      )}
      
      {currentPage === "login" && (
        <Login onLogin={handleLogin} onNavigate={handleNavigate} />
      )}
      
      {currentPage === "chat" && user && (
        <Chat user={user} />
      )}
    </div>
  );
}