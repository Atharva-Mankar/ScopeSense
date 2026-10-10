import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layouts/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage } from "./pages/Dashboard";
import { ProjectList } from "./pages/ProjectList";
import { ProjectDetail } from "./pages/ProjectDetail";
import { ProjectForm } from "./pages/ProjectForm";
import { ProjectSettings } from "./pages/ProjectSettings";
import { ProtectedRoute } from "./components/layouts/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <MainLayout>
                <LoginPage />
              </MainLayout>
            }
          />
          <Route
            path="/register"
            element={
              <MainLayout>
                <RegisterPage />
              </MainLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectSettings />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/edit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <MainLayout>
                <div className="text-center py-12">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">
                    Welcome to Scope Sense
                  </h1>
                  <p className="text-lg text-gray-600 mb-8">
                    Contract and scope governance platform for freelance and
                    service projects
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                      Get Started
                    </button>
                    <button className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              </MainLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
