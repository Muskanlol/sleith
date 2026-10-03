import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/auth.api";
import { getPermissionsForRole } from "../permissions/permissions";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
      return data;
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchUser().catch(() => {});
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

const login = useCallback(async (email, password) => {
  const { data } = await authApi.login({
    email: email.trim(),
    password,
  });

  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);

  const userData = await fetchUser();

  const portalRoles = ["ADMIN", "MANAGER", "TRAINER", "STAFF"];
  if (!portalRoles.includes(userData.role)) {
    clearSession();
    const error = new Error("Access denied. This portal is for authorized staff only.");
    error.isPortalAccessDenied = true;
    throw error;
  }

  return userData;  
}, [fetchUser, clearSession]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  }, [user]);

  const can = useCallback((permission) => {
    if (!user) return false;
    return getPermissionsForRole(user.role).includes(permission);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasRole,
        can,
        loading,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}