
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
import ManageAdmins from "./pages/ManageAdmins";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppLayout from "./components/AppLayout";
import SuperAdminRoute from "./components/SuperAdminRoute";

function App() {
  return (
    <Routes>

      {/* PUBLIC PAGES */}
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

      {/* Old reset-link URLs redirect to new code flow */}
      <Route
        path="/reset-password"
        element={
          <Navigate to="/forgot-password" replace />
        }
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* GAMING TRACKER */}
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

      {/* STRESS MONITOR */}
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

      {/* SLEEP TRACKER */}
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

      {/* RISK REPORTS */}
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

      {/* WEEKLY REPORT */}
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

      {/* PROFILE */}
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

      {/* ADMIN */}
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

      {/* SUPER ADMIN */}
      <Route
        path="/admin/staff"
        element={
          <SuperAdminRoute>
            <AppLayout>
              <ManageAdmins />
            </AppLayout>
          </SuperAdminRoute>
        }
      />

    </Routes>
  );
}

export default App;
