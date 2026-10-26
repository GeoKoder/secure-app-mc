import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile({ onAccountDeleted }) {
  const { changePassword, deleteAccount } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Change password
  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await changePassword(currentPassword, newPassword);

      setPasswordMessage(data.message || "Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage(
        error.response?.data?.message ||
          error.message ||
          "Password change failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Delete account
  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account?",
    );

    if (!confirmed) return;

    setDeleteMessage("");
    setLoading(true);

    try {
      await deleteAccount();

      // Optional: navigate away or reset the app's view
      if (onAccountDeleted) {
        onAccountDeleted();
      }
    } catch (error) {
      setDeleteMessage(
        error.response?.data?.message ||
          error.message ||
          "Account deletion failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="profile-page">
      <h2>My Profile</h2>

      <section className="profile-card">
        <h3>Change Password</h3>

        <form onSubmit={handleChangePassword}>
          <label htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Update Password"}
          </button>

          {passwordMessage && <p role="status">{passwordMessage}</p>}
        </form>
      </section>

      <section className="profile-card danger-zone">
        <h3>Delete Account</h3>

        <p>Permanently delete your account. This action cannot be undone.</p>

        <button type="button" disabled={loading} onClick={handleDeleteAccount}>
          {loading ? "Please wait..." : "Delete My Account"}
        </button>

        {deleteMessage && <p role="alert">{deleteMessage}</p>}
      </section>
    </main>
  );
}
