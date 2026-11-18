
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// PUBLIC PAGES
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// USER PAGES
import Dashboard from "./pages/Dashboard";
import GamingTracker from "./pages/GamingTracker";
import StressMonitor from "./pages/StressMonitor";
import SleepTracker from "./pages/SleepTracker";
import RiskReports from "./pages/RiskReports";
import WeeklyWellnessReport from "./pages/WeeklyWellnessReport";
import Profile from "./pages/Profile";

// ADMIN PAGES
import AdminDashboard from "./pages/AdminDashboard";
import ManageAdmins from "./pages/ManageAdmins";
import ManageUsers from "./pages/ManageUsers";

// ROUTE PROTECTION
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";

// LAYOUT
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <Routes>
      {/* ====================================
          PUBLIC ROUTES
      ==================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
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

      <Route
        path="/reset-password"
        element={
          <Navigate
            to="/forgot-password"
            replace
          />
        }
      />

      {/* ====================================
          USER DASHBOARD
      ==================================== */}

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

      {/* ====================================
          GAMING TRACKER
      ==================================== */}

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

      {/* ====================================
          STRESS MONITOR
      ==================================== */}

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

      {/* ====================================
          SLEEP TRACKER
      ==================================== */}

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

      {/* ====================================
          RISK REPORTS
      ==================================== */}

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

      {/* ====================================
          WEEKLY WELLNESS REPORT
      ==================================== */}

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

      {/* ====================================
          USER PROFILE
      ==================================== */}

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

      {/* ====================================
          ADMIN DASHBOARD
      ==================================== */}

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

      {/* ====================================
          SUPER ADMIN - MANAGE ADMINS
      ==================================== */}

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

      {/* ====================================
          SUPER ADMIN - MANAGE USERS
      ==================================== */}

      <Route
        path="/admin/users/manage"
        element={
          <SuperAdminRoute>
            <AppLayout>
              <ManageUsers />
            </AppLayout>
          </SuperAdminRoute>
        }
      />
    </Routes>
  );
}

export default App;
