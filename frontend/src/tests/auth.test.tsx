import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { LoginPage } from "../pages/Login";
import { RegisterPage } from "../pages/Register";

// Mock the AuthContext - mock useAuth only, keep AuthProvider real
const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock("../context/AuthContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: mockUseAuth,
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("Authentication Pages", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Login Page", () => {
    test("renders login form with email and password fields", () => {
      render(<LoginPage />, { wrapper });

      screen.getByLabelText(/email address/i);
      screen.getByLabelText(/password/i);
      screen.getByRole("button", { name: /sign in/i });
    });
  });

  describe("Register Page", () => {
    test("renders registration form with name, email, password, and role fields", () => {
      render(<RegisterPage />, { wrapper });

      screen.getByLabelText(/first name/i);
      screen.getByLabelText(/last name/i);
      screen.getByLabelText(/email address/i);
      screen.getByLabelText(/^password$/i);
      screen.getByLabelText(/^confirm password$/i);
      screen.getByRole("button", { name: /create account/i });
    });

    test("allows selecting freelancer and client account types", () => {
      render(<RegisterPage />, { wrapper });

      const roleSelect = screen.getByLabelText(/account type/i);
      const options = roleSelect.querySelectorAll("option");
      const optionValues = Array.from(options).map((opt) => opt.getAttribute("value"));

      expect(optionValues).toContain("freelancer");
      expect(optionValues).toContain("client");
    });

    test("does not offer admin account type in registration form", () => {
      render(<RegisterPage />, { wrapper });

      const roleSelect = screen.getByLabelText(/account type/i);
      const options = roleSelect.querySelectorAll("option");
      const optionValues = Array.from(options).map((opt) => opt.getAttribute("value"));

      expect(optionValues).not.toContain("admin");
    });
  });
});