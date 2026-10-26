// client/src/components/AuthCallback.jsx
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { login } = useAuth();

  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Store the token
      localStorage.setItem('token', token);

      // Fetch the user's profile and update auth state
      fetch('http://localhost:4000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem('user', JSON.stringify(data.user));
          // Redirect to dashboard
          window.location.href = '/';
        })
        .catch(() => {
          // Token was invalid
          localStorage.removeItem('token');
          window.location.href = '/?error=auth-failed';
        });
    } else {
      window.location.href = '/?error=no-token';
    }
  }, []);

  return (
    <div className="loading">
      <p>Completing sign-in...</p>
    </div>
  );
}