import { useState, useCallback } from "react";

const ADMIN_PASSWORD = "heels2026admin";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("admin_auth") === "true"
  );

  const login = useCallback((password: string) => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
