
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";

import Navbar from "./components/Navbar.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DocumentUpload from "./pages/DocumentUpload.jsx";
import Documents from "./pages/Documents.jsx";
import DocumentDetails from "./pages/DocumentDetails.jsx";
import ReviewerQueue from "./pages/ReviewerQueue.jsx";
import AuditTrail from "./pages/AuditTrail.jsx";
import AnalysisResults from "./pages/AnalysisResults.jsx";
import ReviewerDecision from "./pages/ReviewerDecision.jsx";
import ApplicationDecision from "./pages/ApplicationDecision.jsx";
import ApplicationStatus from "./pages/ApplicationStatus.jsx";

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#20392D]">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },

      { path: "/dashboard", element: <Dashboard /> },

      { path: "/documents", element: <Documents /> },
      { path: "/documents/upload", element: <DocumentUpload /> },
      
      {
        path: "/documents/:id",
        element: <DocumentDetails />,
      },
      {
        path: "/documents/:id/analysis",
        element: <AnalysisResults />,
      },

      { path: "/reviews/queue", element: <ReviewerQueue /> },
      {
        path: "/reviews/:documentId",
        element: <ReviewerDecision />,
      },

      {
        path: "/applications/:documentId/decision",
        element: <ApplicationDecision />,
      },
      {
        path: "/applications/status/:documentId",
        element: <ApplicationStatus />,
      },

      { path: "/audit", element: <AuditTrail /> },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
