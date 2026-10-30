// Ensure the mobile navigation stylesheet is bundled with the application.
import "./mobile.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GamingTracker from "./pages/GamingTracker";
import StressMonitor from "./pages/StressMonitor";
import SleepTracker from "./pages/SleepTracker";
import RiskReports from "./pages/RiskReports";
import AdminDashboard from "./pages/AdminDashboard";
import WeeklyWellnessReport from "./pages/WeeklyWellnessReport";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppLayout from "./components/AppLayout";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/gaming"
        element={
          <ProtectedRoute>
            <AppLayout>
              <GamingTracker />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/stress"
        element={
          <ProtectedRoute>
            <AppLayout>
              <StressMonitor />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sleep"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SleepTracker />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risk"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RiskReports />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/weekly-report"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WeeklyWellnessReport />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Profile />
      </AppLayout>
    </ProtectedRoute>
  }
/>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;