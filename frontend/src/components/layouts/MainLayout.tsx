import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return location.pathname === path
      ? "text-indigo-600 bg-indigo-50"
      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/dashboard" className="text-xl font-semibold text-indigo-600">
                  Scope Sense
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActiveRoute("/dashboard")}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/projects"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActiveRoute("/projects")}`}
                  >
                    Projects
                  </Link>
                  <Link
                    to="/contracts"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActiveRoute("/contracts")}`}
                  >
                    Contracts
                  </Link>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <button
                  type="button"
                  className="bg-white rounded-md p-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">View notifications</span>
                  <svg
                    className="h-5 w-5"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </button>

                {isAuthenticated && user && (
                  <div className="ml-3 relative">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        type="button"
                        className="bg-white rounded-full p-1 text-sm font-medium text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center space-x-1 rtl:space-x-reverse"
                      >
                        <span className="sr-only">Open user menu</span>
                        <svg
                          className="h-6 w-6"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 8a6 6 0 00-6 6 6 6 0 016-6 6 6 0 016-6zM8 6a4 4 0 014-4 4 4 0 004 4 4 4 0 00-4-4z"
                          />
                        </svg>
                        <span className="text-sm ml-1">{user.first_name}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};