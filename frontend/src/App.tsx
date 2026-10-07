import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layouts/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
    </BrowserRouter>
  );
}

export default App;
