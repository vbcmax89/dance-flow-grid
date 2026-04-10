import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Link } from "react-router-dom";

export default function Admin() {
  const { isAuthenticated, login, logout } = useAdminAuth();

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border">
        <Link to="/" className="font-heading font-bold text-lg text-primary hover:text-accent transition-colors">
          ← Back to Schedule
        </Link>
        <h1 className="font-heading text-xl font-bold text-foreground">Admin Panel</h1>
        <button onClick={logout} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
          Logout
        </button>
      </header>
      <AdminDashboard />
    </div>
  );
}
