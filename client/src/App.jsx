import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import "./App.css";
import { useEffect } from "react";

function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token");

    if (token && window.location.pathname === "/auth/callback") {
      localStorage.setItem("token", token);

      fetch("http://localhost:4000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}`},
      })
        .then((res) => res.join())
        .then((data) => {
          localStorage.setItem("user", JSON.stringify(data.user));
          window.history.replaceState({}, "", "/");
          window.location.reload();
        })
        .catch(() => {
          localStorage.removeItem("token");
          window.history.replaceState({}, "", "/");
        });
    }
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (user) {
    return showProfile ? (
      <div>
        <button onClick={() => setShowProfile(false)}>Back to Dashboard</button>

        <Profile onAccountDeleted={() => window.location.reload()} />
      </div>
    ) : (
      <Dashboard onOpenProfile={() => setShowProfile(true)} />
    );
  }

  return (
    <div className="auth-container">
      <h1 className="app-title">Secure App</h1>
      {showRegister ? (
        <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
