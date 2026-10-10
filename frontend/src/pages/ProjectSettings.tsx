import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  project_type: string | null;
  budget_amount: string | null;
  currency: string | null;
  start_date: string | null;
  target_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const ProjectSettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<Project>(`/api/v1/projects/${id}`);
      setProject(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err.response?.status === 403 || err.response?.status === 404) {
        setError("Project not found or access denied");
        navigate("/projects");
        return;
      }
      setError(err.response?.data?.detail || "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      archived: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status] || statusClasses.draft}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleBackToDetail = () => {
    navigate(`/projects/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading project settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading project settings</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Button onClick={handleBackToDetail} className="mt-4">
          Back to Project
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
        <Button onClick={handleBackToDetail} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <Button onClick={handleBackToDetail} _variant="secondary">
          Back to Project
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Settings</h2>

        <div className="space-y-4">
          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Project ID</div>
            <div className="w-2/3 text-sm text-gray-900 font-mono">{project.id}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Name</div>
            <div className="w-2/3 text-sm text-gray-900">{project.name}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Description</div>
            <div className="w-2/3 text-sm text-gray-900">{project.description || "No description provided"}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Status</div>
            <div className="w-2/3 text-sm">{getStatusBadge(project.status)}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Project Type</div>
            <div className="w-2/3 text-sm text-gray-900">{project.project_type || "Not specified"}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Currency</div>
            <div className="w-2/3 text-sm text-gray-900">{project.currency || "USD"}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Budget Amount</div>
            <div className="w-2/3 text-sm text-gray-900">
              {project.budget_amount ?
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: project.currency || "USD",
                }).format(parseFloat(project.budget_amount)) : "Not set"}
            </div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Start Date</div>
            <div className="w-2/3 text-sm text-gray-900">{formatDate(project.start_date)}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Target End Date</div>
            <div className="w-2/3 text-sm text-gray-900">{formatDate(project.target_end_date)}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Created At</div>
            <div className="w-2/3 text-sm text-gray-900">{formatDate(project.created_at)}</div>
          </div>

          <div className="flex">
            <div className="w-1/3 text-sm font-medium text-gray-500">Updated At</div>
            <div className="w-2/3 text-sm text-gray-900">{formatDate(project.updated_at)}</div>
          </div>
        </div>
      </div>

      {/* Future Features Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-full lg:col-span-1">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M5 18h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Scope Items</h3>
            <p className="text-sm text-gray-500">
              Coming in Phase 3
            </p>
          </div>
        </div>

        <div className="col-span-full lg:col-span-1">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4-1.79-4-4-4zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Management</h3>
            <p className="text-sm text-gray-500">
              Coming in Phase 4
            </p>
          </div>
        </div>

        <div className="col-span-full lg:col-span-1">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17l6-6M13 9l-6 6M9 9l6 6M13 13l-6 6"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Change Request Tracking</h3>
            <p className="text-sm text-gray-500">
              Coming in Phase 5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};