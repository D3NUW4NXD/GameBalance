
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gamepad2,
  MapPin,
  Moon,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Users,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api/api";
import NotificationBell from "../components/NotificationBell";

const RECORDS_PER_PAGE = 6;

const formatDate = (value, includeTime = false) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return includeTime
    ? date.toLocaleString()
    : date.toLocaleDateString();
};

const numberValue = (value) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [highRiskUsers, setHighRiskUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // New risk record search and filter states
  const [riskSearch, setRiskSearch] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("ALL");
  const [riskTrendFilter, setRiskTrendFilter] = useState("ALL");
  const [riskSort, setRiskSort] = useState("newest");
  const [riskPage, setRiskPage] = useState(1);

  const chartColors = [
    "#ff1339",
    "#f59e0b",
    "#22c55e",
    "#8f0f22",
    "#ff4d6a",
  ];

  // Load existing admin information from backend.
  const loadAdminData = async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const [
        summaryRes,
        usersRes,
        highRiskRes,
        alertsRes,
        analyticsRes,
      ] = await Promise.all([
        api.get("/admin/summary"),
        api.get("/admin/users"),
        api.get("/admin/high-risk-users"),
        api.get("/admin/alerts"),
        api.get("/admin/analytics"),
      ]);

      setSummary(summaryRes.data.summary || null);
      setUsers(usersRes.data.users || []);
      setHighRiskUsers(highRiskRes.data.users || []);
      setAlerts(alertsRes.data.alerts || []);
      setAnalytics(analyticsRes.data.analytics || null);
    } catch (error) {
      console.error("Admin data load failed:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Existing analytics chart data.
  const riskDistribution =
    analytics?.risk_distribution?.map((item) => ({
      name: item.name,
      value: numberValue(item.value),
    })) || [];

  const cityDistribution =
    analytics?.city_distribution?.map((item) => ({
      city: item.city,
      users: numberValue(item.users),
    })) || [];

  const weeklyRiskTrend =
    analytics?.weekly_risk_trend?.map((item) => ({
      report_date: item.report_date,
      average_risk_score: numberValue(
        item.average_risk_score
      ),
      total_reports: numberValue(item.total_reports),
    })) || [];

  const averages = analytics?.averages || {};

  const getLevelClass = (level) =>
    String(level || "LOW").toLowerCase();

  // Get actual risk levels available in the API data.
  const availableRiskLevels = useMemo(() => {
    return [
      ...new Set(
        highRiskUsers
          .map((item) =>
            String(item.risk_level || "")
              .trim()
              .toUpperCase()
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [highRiskUsers]);

  // Get actual risk trends available in the API data.
  const availableRiskTrends = useMemo(() => {
    return [
      ...new Set(
        highRiskUsers
          .map((item) =>
            String(item.risk_trend || "")
              .trim()
              .toUpperCase()
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [highRiskUsers]);

  // Search, filter and sort risk records in the browser.
  const filteredRiskUsers = useMemo(() => {
    const query = riskSearch.trim().toLowerCase();

    const filtered = highRiskUsers.filter((item) => {
      const searchableText = [
        item.full_name,
        item.email,
        item.recommendation_reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const riskLevel = String(
        item.risk_level || ""
      ).toUpperCase();

      const riskTrend = String(
        item.risk_trend || ""
      ).toUpperCase();

      const matchesSearch =
        query === "" || searchableText.includes(query);

      const matchesLevel =
        riskLevelFilter === "ALL" ||
        riskLevel === riskLevelFilter;

      const matchesTrend =
        riskTrendFilter === "ALL" ||
        riskTrend === riskTrendFilter;

      return (
        matchesSearch &&
        matchesLevel &&
        matchesTrend
      );
    });

    filtered.sort((a, b) => {
      const scoreA = numberValue(a.risk_score);
      const scoreB = numberValue(b.risk_score);

      const dateA =
        new Date(a.report_date).getTime() || 0;
      const dateB =
        new Date(b.report_date).getTime() || 0;

      if (riskSort === "highest") {
        return scoreB - scoreA || dateB - dateA;
      }

      if (riskSort === "lowest") {
        return scoreA - scoreB || dateB - dateA;
      }

      if (riskSort === "name") {
        return String(a.full_name || "").localeCompare(
          String(b.full_name || "")
        );
      }

      return dateB - dateA || scoreB - scoreA;
    });

    return filtered;
  }, [
    highRiskUsers,
    riskSearch,
    riskLevelFilter,
    riskTrendFilter,
    riskSort,
  ]);

  // Pagination prevents the page from getting too long.
  const totalRiskPages = Math.max(
    1,
    Math.ceil(filteredRiskUsers.length / RECORDS_PER_PAGE)
  );

  const currentRiskPage = Math.min(
    riskPage,
    totalRiskPages
  );

  const firstRiskIndex =
    (currentRiskPage - 1) * RECORDS_PER_PAGE;

  const displayedRiskUsers = filteredRiskUsers.slice(
    firstRiskIndex,
    firstRiskIndex + RECORDS_PER_PAGE
  );

  const firstShown =
    filteredRiskUsers.length === 0
      ? 0
      : firstRiskIndex + 1;

  const lastShown = Math.min(
    firstRiskIndex + RECORDS_PER_PAGE,
    filteredRiskUsers.length
  );

  const resetRiskFilters = () => {
    setRiskSearch("");
    setRiskLevelFilter("ALL");
    setRiskTrendFilter("ALL");
    setRiskSort("newest");
    setRiskPage(1);
  };

  const hasActiveRiskFilters =
    riskSearch !== "" ||
    riskLevelFilter !== "ALL" ||
    riskTrendFilter !== "ALL" ||
    riskSort !== "newest";

  return (
    <div className="module-page admin-command-page">
      {/* ADMIN HEADER */}

      <div className="module-header admin-command-header">
        <div>
          <span className="admin-eyebrow">
            SYSTEM CONTROL CENTER
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor users, risk levels, system activity,
            alerts, and analytics.
          </p>
        </div>

        <div className="admin-header-actions">
          <NotificationBell />

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={loadAdminData}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "admin-spin" : ""}
            />

            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            to="/dashboard"
            className="back-link"
          >
            User Dashboard
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="admin-load-status" role="status">
          Some admin data could not be loaded.
          Use Refresh to try again.
        </div>
      )}

      {/* PLATFORM ACTIVITY */}

      <div className="admin-section-heading">
        <h2>Platform Activity</h2>
        <span>System-wide totals</span>
      </div>

      <section className="stats-grid module-stats admin-activity-grid">
        <div className="stat-card">
          <div className="stat-icon gaming">
            <Users />
          </div>

          <div>
            <p>Total Users</p>
            <h2>{summary?.total_users || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon gaming">
            <Gamepad2 />
          </div>

          <div>
            <p>Gaming Sessions</p>
            <h2>
              {summary?.total_gaming_sessions || 0}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stress">
            <Brain />
          </div>

          <div>
            <p>Stress Assessments</p>
            <h2>
              {summary?.total_stress_assessments || 0}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sleep">
            <Moon />
          </div>

          <div>
            <p>Sleep Records</p>
            <h2>
              {summary?.total_sleep_records || 0}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon alerts">
            <FileText />
          </div>

          <div>
            <p>Risk Reports</p>
            <h2>{summary?.total_risk_reports || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon alerts">
            <AlertTriangle />
          </div>

          <div>
            <p>Total Alerts</p>
            <h2>{summary?.total_alerts || 0}</h2>
          </div>
        </div>
      </section>

      {/* WELLNESS AVERAGES */}

      <div className="admin-section-heading">
        <h2>Wellness Averages</h2>
        <span>Across recorded user data</span>
      </div>

      <section className="stats-grid module-stats admin-average-grid">
        <div className="stat-card">
          <div className="stat-icon gaming">
            <Gamepad2 />
          </div>

          <div>
            <p>Average Gaming</p>
            <h2>
              {averages.average_gaming_hours || 0}h
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
              {averages.average_stress_percentage || 0}%
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
              {averages.average_sleep_hours || 0}h
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon alerts">
            <BarChart3 />
          </div>

          <div>
            <p>Average Risk</p>
            <h2>
              {averages.average_risk_score || 0}
            </h2>
          </div>
        </div>
      </section>

      {/* PLATFORM ANALYTICS */}

      <div className="admin-section-heading">
        <h2>Platform Analytics</h2>
        <span>Risk distribution and locations</span>
      </div>

      <div className="admin-chart-grid">
        <div className="panel chart-panel">
          <div className="panel-title">
            <Shield />
            <h3>Risk Level Distribution</h3>
          </div>

          {riskDistribution.length === 0 ? (
            <p>No risk data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        chartColors[
                          index % chartColors.length
                        ]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel chart-panel">
          <div className="panel-title">
            <MapPin />
            <h3>Users by City</h3>
          </div>

          {cityDistribution.length === 0 ? (
            <p>No city data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar
                  dataKey="users"
                  fill="#ff1339"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* WEEKLY RISK TREND */}

      <div className="panel chart-panel reports-panel admin-trend-panel">
        <div className="panel-title">
          <BarChart3 />
          <h3>Weekly Average Risk Score Trend</h3>
        </div>

        {weeklyRiskTrend.length === 0 ? (
          <p>No weekly risk trend data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyRiskTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="report_date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="average_risk_score"
                stroke="#ff1339"
                strokeWidth={3}
                dot={{ fill: "#ff1339", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* REGISTERED USERS */}

      <div className="admin-section-heading admin-section-spaced">
        <h2>User Management Overview</h2>
        <span>Read-only registered account details</span>
      </div>

      <div className="panel reports-panel">
        <div className="panel-title">
          <Users />
          <h3>Registered Users</h3>
        </div>

        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>City</th>
                  <th>Created At</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`level ${
                          user.role === "ADMIN"
                            ? "high"
                            : "low"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>{user.age || "-"}</td>
                    <td>{user.gender || "-"}</td>
                    <td>{user.city || "-"}</td>
                    <td>
                      {formatDate(user.created_at, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RISK RECORDS + SYSTEM ALERTS */}

      <div className="module-grid reports-panel admin-record-grid">
        {/* FILTERABLE MODERATE/HIGH RISK RECORDS */}

        <div className="panel admin-risk-panel">
          <div className="panel-title admin-risk-title">
            <Shield />
            <h3>Moderate and High Risk Records</h3>
          </div>

          {/* Search field */}

          <div className="admin-risk-search">
            <Search size={17} />

            <input
              type="search"
              value={riskSearch}
              placeholder="Search name, email, or risk reason..."
              aria-label="Search risk records"
              onChange={(event) => {
                setRiskSearch(event.target.value);
                setRiskPage(1);
              }}
            />
          </div>

          {/* Risk filters and sorting */}

          <div className="admin-risk-filters">
            <label>
              <span>Risk Level</span>

              <select
                value={riskLevelFilter}
                onChange={(event) => {
                  setRiskLevelFilter(event.target.value);
                  setRiskPage(1);
                }}
              >
                <option value="ALL">All Levels</option>

                {availableRiskLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Risk Trend</span>

              <select
                value={riskTrendFilter}
                onChange={(event) => {
                  setRiskTrendFilter(event.target.value);
                  setRiskPage(1);
                }}
              >
                <option value="ALL">All Trends</option>

                {availableRiskTrends.map((trend) => (
                  <option key={trend} value={trend}>
                    {trend.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Sort By</span>

              <select
                value={riskSort}
                onChange={(event) => {
                  setRiskSort(event.target.value);
                  setRiskPage(1);
                }}
              >
                <option value="newest">
                  Newest First
                </option>

                <option value="highest">
                  Highest Risk Score
                </option>

                <option value="lowest">
                  Lowest Risk Score
                </option>

                <option value="name">
                  Name A–Z
                </option>
              </select>
            </label>
          </div>

          {/* Results count and filter reset */}

          <div className="admin-risk-results-bar">
            <span>
              {filteredRiskUsers.length} matching records
              <small>
                {" "}of {highRiskUsers.length} total
              </small>
            </span>

            {hasActiveRiskFilters && (
              <button
                type="button"
                className="admin-risk-reset"
                onClick={resetRiskFilters}
              >
                <RotateCcw size={13} />
                Clear Filters
              </button>
            )}
          </div>

          {/* Paginated results */}

          {displayedRiskUsers.length === 0 ? (
            <div className="admin-risk-empty">
              <Search size={25} />

              <strong>No matching risk records</strong>

              <p>
                Try another name, level, or trend.
              </p>

              {hasActiveRiskFilters && (
                <button
                  type="button"
                  className="admin-risk-reset"
                  onClick={resetRiskFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="record-list admin-risk-record-list">
              {displayedRiskUsers.map((item) => (
                <div
                  className="record-item admin-risk-record"
                  key={item.risk_id}
                >
                  <div className="admin-risk-record-heading">
                    <strong>
                      {item.full_name}
                    </strong>

                    <span
                      className={`level ${getLevelClass(
                        item.risk_level
                      )}`}
                    >
                      {item.risk_level}
                    </span>
                  </div>

                  <p className="admin-risk-email">
                    {item.email}
                  </p>

                  <div className="admin-risk-record-metrics">
                    <span>
                      Score: <b>{item.risk_score}</b>
                    </span>

                    <span>
                      Trend:{" "}
                      <b>{item.risk_trend || "N/A"}</b>
                    </span>
                  </div>

                  <p>
                    Stress:{" "}
                    {item.latest_stress_percentage ?? "-"}%
                    {" | "}
                    Sleep:{" "}
                    {item.average_sleep_hours ?? "-"}h
                    {" | "}
                    Gaming:{" "}
                    {item.gaming_average_hours ?? "-"}h
                  </p>

                  <p>
                    <strong>Reason:</strong>{" "}
                    {item.recommendation_reason || "-"}
                  </p>

                  <small>
                    {formatDate(item.report_date)}
                  </small>
                </div>
              ))}
            </div>
          )}

          {/* Pagination controls */}

          {filteredRiskUsers.length > 0 && (
            <div className="admin-risk-pagination">
              <span className="admin-risk-page-info">
                Showing {firstShown}–{lastShown} of{" "}
                {filteredRiskUsers.length}
              </span>

              <div className="admin-risk-page-controls">
                <button
                  type="button"
                  aria-label="Previous risk records page"
                  disabled={currentRiskPage <= 1}
                  onClick={() =>
                    setRiskPage(currentRiskPage - 1)
                  }
                >
                  <ChevronLeft size={17} />
                </button>

                <span>
                  {currentRiskPage} / {totalRiskPages}
                </span>

                <button
                  type="button"
                  aria-label="Next risk records page"
                  disabled={
                    currentRiskPage >= totalRiskPages
                  }
                  onClick={() =>
                    setRiskPage(currentRiskPage + 1)
                  }
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SYSTEM ALERTS */}

        <div className="panel">
          <div className="panel-title">
            <AlertTriangle />
            <h3>System Alerts</h3>
          </div>

          {alerts.length === 0 ? (
            <p>No alerts found.</p>
          ) : (
            <div className="record-list">
              {alerts.slice(0, 8).map((alert) => (
                <div
                  className="record-item"
                  key={alert.alert_id}
                >
                  <strong>
                    <span
                      className={`level ${getLevelClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </strong>

                  <p>{alert.alert_message}</p>

                  <small>
                    {alert.full_name}
                    {" | "}
                    {formatDate(alert.created_at, true)}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
