// client/src/components/Dashboard.jsx
import { useAuth } from "../context/AuthContext";

export default function Dashboard({ onOpenProfile }) {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={logout} className="logout-button">
            Log Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="card">
          <h2>Your Profile</h2>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Member since:</strong>{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        <button onClick={onOpenProfile}>My Profile</button>

        <div className="card">
          <h2>Getting Started</h2>
          <p>
            You are now authenticated. This page is only visible to logged-in
            users.
          </p>
          <p>
            Your JWT token is stored in localStorage and sent with every API
            request.
          </p>
        </div>
      </main>
    </div>
  );
}
