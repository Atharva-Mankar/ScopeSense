import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export const RegisterPage = () => {
  const [formValues, setFormValues] = useState<RegisterFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "freelancer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

    // Validate passwords match
    if (formValues.password !== formValues.confirmPassword) {
      setLoading(false);
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await api.post("/api/v1/auth/register", {
        email: formValues.email,
        password: formValues.password,
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        role: formValues.role,
      });

      // Store token in localStorage (will be replaced with HttpOnly cookie later)
      localStorage.setItem("access_token", response.data.access_token);

      // Store user info for quick access
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?
            <a href="#"
               className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first-name"
                     className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <input id="first-name"
                     name="firstName"
                     type="text"
                     autoComplete="given-name"
                     required
                     className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                     placeholder="First name"
                     value={formValues.firstName}
                     onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="last-name"
                     className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input id="last-name"
                     name="lastName"
                     type="text"
                     autoComplete="family-name"
                     required
                     className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                     placeholder="Last name"
                     value={formValues.lastName}
                     onChange={handleChange} />
            </div>
          </div>

          <div>
            <label htmlFor="email-address"
                   className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input id="email-address"
                   name="email"
                   type="email"
                   autoComplete="email"
                   required
                   className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                   placeholder="Email address"
                   value={formValues.email}
                   onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="password"
                   className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input id="password"
                     name="password"
                     type="password"
                     autoComplete="new-password"
                     required
                     className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                     placeholder="••••••••"
                     value={formValues.password}
                     onChange={handleChange} />
              <button type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-2"
                      onClick={(e) => {
                        e.preventDefault();
                        // In a real app, this would toggle password visibility
                      }}>
                <span className="sr-only">Show password</span>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000-4z" clip-rule="evenodd" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.524 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.066 7-9.542 7s-8.268-2.943-9.542-7z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="confirm-password"
                     className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input id="confirm-password"
                     name="confirmPassword"
                     type="password"
                     autoComplete="new-password"
                     required
                     className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                     placeholder="••••••••"
                     value={formValues.confirmPassword}
                     onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="role-select"
                     className="block text-sm font-medium text-gray-700 mb-1">
                Account type
              </label>
              <select id="role-select"
                      name="role"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="freelancer">Freelancer</option>
                <option value="client">Client</option>
              </select>
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
              Create account
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          By clicking Create account, you agree to our
          <a href="#"
             className="font-medium text-indigo-600 hover:text-indigo-500">
            Terms of Service
          </a>
          and
          <a href="#"
             className="font-medium text-indigo-600 hover:text-indigo-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};