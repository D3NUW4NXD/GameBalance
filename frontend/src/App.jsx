
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import Dashboard from "./pages/Dashboard";
import GamingTracker from "./pages/GamingTracker";
import StressMonitor from "./pages/StressMonitor";
import SleepTracker from "./pages/SleepTracker";
import RiskReports from "./pages/RiskReports";
import WeeklyWellnessReport from "./pages/WeeklyWellnessReport";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <Routes>

      {/* Public Pages */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* User Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Gaming Tracker */}
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

      {/* Stress Monitor */}
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

      {/* Sleep Tracker */}
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

      {/* Risk Reports */}
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

      {/* Weekly Report */}
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

      {/* User Profile */}
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

      {/* Admin Dashboard */}
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
