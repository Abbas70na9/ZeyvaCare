import { useState, useEffect } from "react";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { isAdminAuthenticated } from "../../data/storage";

interface Props {
  onBackToStore: () => void;
}

export default function AdminPage({ onBackToStore }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated());
  }, []);

  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={() => setIsAuthenticated(true)}
        onBackToStore={onBackToStore}
      />
    );
  }

  return (
    <AdminDashboard
      onBackToStore={onBackToStore}
      onLogout={() => setIsAuthenticated(false)}
    />
  );
}
