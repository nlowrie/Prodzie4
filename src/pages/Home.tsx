import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center py-12 text-center md:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">Welcome to</span>
          <span className="block text-indigo-600">Auth App</span>
        </h1>
        
        <p className="mt-6 max-w-lg text-xl text-gray-500">
          A secure and modern authentication system with user profiles and protected routes.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/signup"
            className="group inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/login"
            className="text-base font-medium text-gray-900 hover:text-indigo-600"
          >
            Sign In <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Features section */}
      <div className="py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Secure Authentication</h3>
            <p className="mt-2 text-gray-500">
              Industry-standard authentication with email and password.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">User Profiles</h3>
            <p className="mt-2 text-gray-500">
              Manage your profile information and personalize your experience.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Protected Routes</h3>
            <p className="mt-2 text-gray-500">
              Secure access to sensitive information and features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}