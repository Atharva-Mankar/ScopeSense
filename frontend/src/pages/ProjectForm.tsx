import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";

interface ProjectFormData {
  name: string;
  description: string | null;
  project_type: string | null;
  budget_amount: string | null;
  currency: string | null;
  start_date: string | null;
  target_end_date: string | null;
}

interface ProjectFormProps {
  onSuccess?: (projectId: string) => void;
}

export const ProjectForm = ({ onSuccess }: ProjectFormProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: null,
    project_type: null,
    budget_amount: null,
    currency: "USD",
    start_date: null,
    target_end_date: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing project data if editing
  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/v1/projects/${id}`);
      const project = response.data;

      setFormData({
        name: project.name,
        description: project.description ?? null,
        project_type: project.project_type ?? null,
        budget_amount: project.budget_amount?.toString() ?? null,
        currency: project.currency ?? "USD",
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : null,
        target_end_date: project.target_end_date ? new Date(project.target_end_date).toISOString().split('T')[0] : null,
      });
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
      setError(err.response?.data?.detail || "Failed to load project data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Project name is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        project_type: formData.project_type,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : undefined,
        currency: formData.currency,
        start_date: formData.start_date ? new Date(formData.start_date) : undefined,
        target_end_date: formData.target_end_date ? new Date(formData.target_end_date) : undefined,
      };

      let response;
      if (id) {
        // Update existing project
        response = await api.patch(`/api/v1/projects/${id}`, projectData);
      } else {
        // Create new project
        response = await api.post("/api/v1/projects", projectData);
      }

      const projectId = response.data.id;
      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess(projectId.toString());
      } else {
        navigate(`/projects/${projectId}`);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err.response?.status === 422) {
        setError(err.response?.data?.detail || "Validation failed");
        return;
      }
      if (err.response?.status === 403 || err.response?.status === 404) {
        setError("Access denied or project not found");
        navigate("/projects");
        return;
      }
      setError(err.response?.data?.detail || "Failed to save project");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  const formTitle = id ? "Edit Project" : "New Project";
  const submitText = id ? "Update Project" : "Create Project";
  const backLink = id ? `/projects/${id}` : "/projects";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{formTitle}</h2>
        <Button
          variant="secondary"
          onClick={() => navigate(backLink)}
        >
          Back to Projects
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <svg
            className="flex-shrink-0 w-5 h-5 text-red-400"
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
          <span className="ml-3">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Project Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name ?? ""}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter project name"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description ?? ""}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="4"
            placeholder="Enter project description (optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="project_type" className="block text-sm font-medium text-gray-700 mb-1">
              Project Type
            </label>
            <select
              id="project_type"
              value={formData.project_type ?? ""}
              onChange={(e) => handleChange("project_type", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select project type (optional)</option>
              <option value="freelance">Freelance</option>
              <option value="client">Client</option>
              <option value="internal">Internal</option>
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency ?? "USD"}
              onChange={(e) => handleChange("currency", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
              <option value="CAD">CAD (Canadian Dollar)</option>
              <option value="AUD">AUD (Australian Dollar)</option>
              <option value="JPY">JPY (Japanese Yen)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget_amount" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Amount
            </label>
            <input
              type="number"
              id="budget_amount"
              min="0"
              step="0.01"
              value={formData.budget_amount ?? ""}
              onChange={(e) => handleChange("budget_amount", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter budget amount (optional)"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date ?? ""}
              onChange={(e) => handleChange("start_date", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="target_end_date" className="block text-sm font-medium text-gray-700 mb-1">
            Target End Date
          </label>
          <input
            type="date"
            id="target_end_date"
            value={formData.target_end_date ?? ""}
            onChange={(e) => handleChange("target_end_date", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Target end date must be on or after start date
          </p>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            isLoading={isSubmitting}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </div>
  );
};