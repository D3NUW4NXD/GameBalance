
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  FileText,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Moon,
  Shield,
  ShieldAlert,
  User,
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useAuth } from "../context/AuthContext";
import api from "../api/api";

// New MySQL-backed notification bell
import NotificationBell from "../components/NotificationBell";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [gamingSummary, setGamingSummary] = useState(null);
  const [gamingTrend, setGamingTrend] = useState([]);

  const [stressSummary, setStressSummary] = useState(null);
  const [stressTrend, setStressTrend] = useState([]);

  const [sleepSummary, setSleepSummary] = useState(null);
  const [sleepTrend, setSleepTrend] = useState([]);

  const [alerts, setAlerts] = useState([]);
  const [riskReports, setRiskReports] = useState([]);

  // Load dashboard information from backend
  const loadDashboardData = async () => {
    try {
      const [
        gamingRes,
        stressSummaryRes,
        stressListRes,
        sleepRes,
        alertsRes,
        reportsRes,
      ] = await Promise.all([
        api.get("/gaming/summary"),
        api.get("/stress/summary"),
        api.get("/stress"),
        api.get("/sleep/summary"),
        api.get("/analysis/alerts"),
        api.get("/analysis/reports"),
      ]);

      setGamingSummary(gamingRes.data.summary);
      setGamingTrend(gamingRes.data.last_7_days || []);

      setStressSummary(stressSummaryRes.data.summary);
      setStressTrend(stressListRes.data.assessments || []);

      setSleepSummary(sleepRes.data.summary);
      setSleepTrend(sleepRes.data.last_7_days || []);

      setAlerts(alertsRes.data.alerts || []);
      setRiskReports(reportsRes.data.reports || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Logout
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  // Gaming chart
  const gamingChartData = gamingTrend
    .map((item) => ({
      date: new Date(item.session_date).toLocaleDateString(),
      minutes: Number(item.total_minutes),
      sessions: Number(item.session_count),
    }))
    .reverse();

  // Stress chart
  const stressChartData = stressTrend
    .slice(0, 7)
    .map((item) => ({
      date: new Date(
        item.assessment_date
      ).toLocaleDateString(),
      percentage: Number(item.stress_percentage),
      score: Number(item.average_score),
    }))
    .reverse();

  // Sleep chart
  const sleepChartData = sleepTrend
    .map((item) => ({
      date: new Date(
        item.sleep_date
      ).toLocaleDateString(),
      hours: Number(item.sleep_duration_hours),
    }))
    .reverse();

  // Latest risk analysis
  const latestRisk = riskReports[0];

  const riskPieData = latestRisk
    ? [
        {
          name: "Risk Score",
          value: Number(latestRisk.risk_score),
        },
        {
          name: "Remaining",
          value:
            100 - Number(latestRisk.risk_score),
        },
      ]
    : [
        {
          name: "No Risk Report",
          value: 100,
        },
      ];

  return (
    <div className="dashboard-page">
      {/* ==================================
          SIDEBAR NAVIGATION
          ================================== */}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <Gamepad2 size={24} />
          <span>GameBalance</span>
        </div>

        <nav>
          <Link
            to="/dashboard"
            className="active"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          <Link to="/gaming">
            <Gamepad2 size={16} />
            Gaming Tracker
          </Link>

          <Link to="/stress">
            <Brain size={16} />
            Stress Monitor
          </Link>

          <Link to="/sleep">
            <Moon size={16} />
            Sleep Tracker
          </Link>

          <Link to="/risk">
            <BarChart3 size={16} />
            Risk Reports
          </Link>

          <Link to="/weekly-report">
            <FileText size={16} />
            Weekly Report
          </Link>

          <Link to="/profile">
            <User size={16} />
            Profile
          </Link>

          {user?.role === "ADMIN" && (
            <Link to="/admin">
              <Shield size={16} />
              Admin Panel
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* ==================================
          DASHBOARD CONTENT
          ================================== */}

      <main className="dashboard-content">
        {/* HEADER WITH NOTIFICATION BELL */}

        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>

            <p>
              Welcome back, {user?.full_name}
            </p>
          </div>

          <div className="gb-header-actions">
            {/* MySQL Notification Center */}
            <NotificationBell />

            {/* Current user role */}
            <div className="user-pill">
              {user?.role}
            </div>
          </div>
        </header>

        {/* ==================================
            STATISTICS CARDS
            ================================== */}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon gaming">
              <Gamepad2 />
            </div>

            <div>
              <p>Total Gaming Minutes</p>

              <h2>
                {gamingSummary?.total_minutes || 0}
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stress">
              <Brain />
            </div>

            <div>
              <p>Average Stress</p>

              <h2>
                {stressSummary?.average_stress_percentage || 0}%
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon sleep">
              <Moon />
            </div>

            <div>
              <p>Average Sleep</p>

              <h2>
                {sleepSummary?.average_sleep_hours || 0}h
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon alerts">
              <AlertTriangle />
            </div>

            <div>
              <p>Alerts</p>

              <h2>{alerts.length}</h2>
            </div>
          </div>
        </section>

        {/* ==================================
            QUICK ACTIONS
            ================================== */}

        <section className="quick-actions">
          <Link to="/gaming">
            Add Gaming Session
          </Link>

          <Link to="/stress">
            Submit Stress Assessment
          </Link>

          <Link to="/sleep">
            Add Sleep Record
          </Link>

          <Link to="/risk">
            Generate Risk Report
          </Link>
        </section>

        {/* ==================================
            CHARTS
            ================================== */}

        <section className="charts-grid">
          {/* Gaming Trend Chart */}

          <div className="panel chart-panel">
            <div className="panel-title">
              <Gamepad2 />
              <h3>Gaming Trend</h3>
            </div>

            {gamingChartData.length === 0 ? (
              <p>No gaming data available.</p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <BarChart data={gamingChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="minutes"
                    fill="#ff1339"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stress Progress Chart */}

          <div className="panel chart-panel">
            <div className="panel-title">
              <Brain />
              <h3>Stress Progress</h3>
            </div>

            {stressChartData.length === 0 ? (
              <p>No stress data available.</p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <LineChart data={stressChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#ff1339"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sleep Pattern Chart */}

          <div className="panel chart-panel">
            <div className="panel-title">
              <Moon />
              <h3>Sleep Pattern</h3>
            </div>

            {sleepChartData.length === 0 ? (
              <p>No sleep data available.</p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <LineChart data={sleepChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#ff4d6a"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Latest Risk Score Chart */}

          <div className="panel chart-panel">
            <div className="panel-title">
              <ShieldAlert />
              <h3>Latest Risk Score</h3>
            </div>

            <div className="risk-chart-wrap">
              <ResponsiveContainer
                width="100%"
                height={220}
              >
                <PieChart>
                  <Pie
                    data={riskPieData}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {riskPieData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "#ff1339"
                              : "#3a3338"
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="risk-score-text">
                <h2>
                  {latestRisk?.risk_score || 0}
                </h2>

                <p>
                  {latestRisk?.risk_level ||
                    "No report"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================
            SYSTEM OVERVIEW AND ALERTS
            ================================== */}

        <section className="content-grid">
          {/* System Overview */}

          <div className="panel">
            <div className="panel-title">
              <Activity />
              <h3>System Overview</h3>
            </div>

            <p>
              This dashboard summarizes gaming
              behavior, stress assessments, sleep
              patterns, alerts, risk level, and
              personalized recommendations.
            </p>

            <div className="feature-list">
              <span>JWT Authentication</span>
              <span>Gaming Analytics</span>
              <span>Stress Scoring</span>
              <span>Sleep Tracking</span>
              <span>Risk Engine</span>
              <span>Charts</span>
            </div>
          </div>

          {/* Latest Alerts */}

          <div className="panel">
            <div className="panel-title">
              <AlertTriangle />
              <h3>Latest Alerts</h3>
            </div>

            {alerts.length === 0 ? (
              <p>
                No alerts generated yet.
              </p>
            ) : (
              <div className="alert-list">
                {alerts
                  .slice(0, 3)
                  .map((alert) => (
                    <div
                      className="alert-item"
                      key={alert.alert_id}
                    >
                      <strong>
                        {alert.severity}
                      </strong>

                      <p>
                        {alert.alert_message}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
