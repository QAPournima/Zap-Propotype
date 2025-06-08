import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email && !password) {
      setError('Please fill in any text to login.');
      return;
    }
    setError('');
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/dashboard');
  };

  const handleResendVerification = async () => {
    try {
      await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      alert('Verification email sent. Please check your inbox.');
    } catch (err) {
      alert('Failed to send verification email. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1A1E1D]">
      <div className="p-8 bg-white dark:bg-neutral-800 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Zap⚡️</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">Email</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">Login</button>
        </form>
        {error && (
          <button onClick={handleResendVerification} className="mt-4 w-full p-2 bg-green-500 text-white rounded hover:bg-green-600">
            Resend Verification Email
          </button>
        )}
      </div>
    </div>
  );
};

export default Login; 
