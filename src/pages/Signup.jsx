
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from "sonner";
import { Printer } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !rollNumber || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!email.endsWith('@kgkite.ac.in')) {
      toast.error("Please use your college email address (ending with @kgkite.ac.in)");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      await signup(name, rollNumber, email, password);
      toast.success("Please check your email to verify your account");
      navigate('/login');
    } catch (error) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Printer className="text-primary h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold mt-4">Create Student Account</h1>
          <p className="text-gray-600 mt-2">Student Print Management System</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
                placeholder="Full Name"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number (e.g., 22CSB43)
              </label>
              <input
                id="rollNumber"
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
                placeholder="Roll Number (e.g., 22CSB43)"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
                placeholder="Email address"
              />
              <p className="text-xs text-gray-500 mt-1">Please use your college email (@kgkite.ac.in)</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
                placeholder="Password (min 6 characters)"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-150 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <div className="text-sm text-gray-500 mt-3">
            <p>Note: Only students can create new accounts.</p>
            <p>Admin and Staff accounts are pre-configured.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
