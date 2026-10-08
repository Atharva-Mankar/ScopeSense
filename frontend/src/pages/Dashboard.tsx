import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const DashboardPage = () => {
  const { user, logout, isLoading } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const roleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const statusDisplay = user.is_active
    ? user.is_verified
      ? "Active and Verified"
      : "Active"
    : "Inactive";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <a href="/dashboard"
                   className="text-xl font-semibold text-indigo-600">
                  Scope Sense
                </a>
              </div>
            </div>

            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-700">
                {user.first_name} {user.last_name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-white rounded-md p-2 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Scope Sense
          </h1>
          <p className="text-gray-600 mb-8">
            Your contract and scope governance dashboard.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Account Name
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Email Address
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {user.email}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Role
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {roleDisplay}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Account Status
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {statusDisplay}
              </dd>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Account Status Details
          </h2>
          <dl className="divide-y divide-gray-200">
            <div className="py-4 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Active</dt>
              <dd className="text-sm text-gray-900">
                {user.is_active ? "Yes" : "No"}
              </dd>
            </div>
            <div className="py-4 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Verified</dt>
              <dd className="text-sm text-gray-900">
                {user.is_verified ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-12 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-indigo-900 mb-2">
            Next Steps
          </h3>
          <p className="text-indigo-800">
            This dashboard is a placeholder. In the next phase, you will be
            able to create and manage projects, contracts, and scope items.
            Stay tuned for updates!
          </p>
        </div>
      </main>
    </div>
  );
};