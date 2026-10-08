import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post("/api/v1/auth/login", {
        email: formValues.email,
        password: formValues.password,
      });

      // Store token in localStorage (will be replaced with HttpOnly cookie later)
      localStorage.setItem("access_token", response.data.access_token);

      // Store user info for quick access
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or
            <a href="#"
               className="font-medium text-indigo-600 hover:text-indigo-500">
              register a new account
            </a>
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address"
                     className="sr-only">
                Email address
              </label>
              <input id="email-address"
                     name="email"
                     type="email"
                     autoComplete="email"
                     required
                     className="relative block w-full appearance-none rounded-w-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                     placeholder="Email address"
                     value={formValues.email}
                     onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="password"
                     className="sr-only">
                Password
              </label>
              <input id="password"
                     name="password"
                     type="password"
                     autoComplete="current-password"
                     required
                     className="relative block w-full appearance-none rounded-w-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                     placeholder="Password"
                     value={formValues.password}
                     onChange={handleChange} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me"
                     type="checkbox"
                     className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              <span className="ml-2 block text-sm text-gray-900">
                Remember me
              </span>
            </div>

            <div className="text-sm">
              <a href="#"
                 className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              _variant="primary"
              loading={loading}
              disabled={loading}
            >
              Sign in
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <a href="#"
             className="font-medium text-indigo-600 hover:text-indigo-500">
            Need help?
          </a>
        </p>
      </div>
    </div>
  );
};