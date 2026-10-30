
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  FileText,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";

const RiskReports = () => {
  const { notify } = useNotifications();

  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [latestReport, setLatestReport] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingReports, setLoadingReports] = useState(true);

  // Load saved reports and alerts from MySQL.
  const loadReports = useCallback(async () => {
    try {
      const [reportsRes, alertsRes] = await Promise.all([
        api.get("/analysis/reports", { toast: false }),
        api.get("/analysis/alerts", { toast: false }),
      ]);

      if (
        reportsRes.data?.success === false ||
        alertsRes.data?.success === false
      ) {
        throw new Error("Unable to load risk reports");
      }

      const reportData = reportsRes.data?.reports || [];
      const alertData = alertsRes.data?.alerts || [];

      setReports(reportData);
      setAlerts(alertData);

      setLatestReport(
        reportData.length > 0 ? reportData[0] : null
      );
    } catch (error) {
      console.error("Risk reports load failed:", error);

      notify({
        type: "danger",
        title: "Risk Data Load Failed",
        duration: 4000,
      });
    } finally {
      setLoadingReports(false);
    }
  }, [notify]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Generate a fresh report using existing backend rules.
  const generateRiskReport = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await api.post("/analysis/generate");

      // Global notification:
      // Risk Analysis Generated

      await loadReports();
    } catch (error) {
      console.error(
        "Risk report generation failed:",
        error
      );

      // Global API notification:
      // Risk Analysis Failed
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === "INCREASING") {
      return <TrendingUp />;
    }

    if (trend === "IMPROVING") {
      return <TrendingDown />;
    }

    return <RefreshCcw />;
  };

  const getLevelClass = (level) => {
    return String(level || "LOW").toLowerCase();
  };

  const getTrendLevelClass = (trend) => {
    if (trend === "INCREASING") return "high";
    if (trend === "IMPROVING") return "low";
    return "moderate";
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Risk Reports</h1>
          <p>
            Generate advanced wellness reports using gaming,
            stress, and sleep data.
          </p>
        </div>

        <Link to="/dashboard" className="back-link">
          Back to Dashboard
        </Link>
      </div>

      {/* Risk Statistics */}

      <section className="stats-grid module-stats">
        <div className="stat-card">
          <div className="stat-icon gaming">
            <FileText />
          </div>

          <div>
            <p>Total Reports</p>
            <h2>{reports.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stress">
            <Brain />
          </div>

          <div>
            <p>Latest Risk Score</p>
            <h2>{latestReport?.risk_score ?? 0}</h2>
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

        <div className="stat-card">
          <div className="stat-icon sleep">
            <BarChart3 />
          </div>

          <div>
            <p>Risk Trend</p>
            <h2>{latestReport?.risk_trend || "N/A"}</h2>
          </div>
        </div>
      </section>

      {/* Generate Risk Analysis */}

      <div className="panel">
        <div className="panel-title">
          <BarChart3 />
          <h3>Generate Advanced Risk Analysis</h3>
        </div>

        <p>
          The risk engine analyses seven-day gaming duration,
          latest stress percentage, average sleep duration,
          and previous risk score to calculate a wellness risk
          trend with personalized recommendations.
        </p>

        <button
          type="button"
          className="risk-generate-btn"
          onClick={generateRiskReport}
          disabled={loading}
        >
          {loading
            ? "Generating..."
            : "Generate New Risk Report"}
        </button>
      </div>

      {/* Latest Report */}

      {latestReport && (
        <div className="module-grid reports-panel">
          <div className="panel">
            <div className="panel-title">
              {getTrendIcon(latestReport.risk_trend)}
              <h3>Latest Risk Summary</h3>
            </div>

            <div className="record-item">
              <strong>
                Risk Level:{" "}
                <span
                  className={`level ${getLevelClass(
                    latestReport.risk_level
                  )}`}
                >
                  {latestReport.risk_level}
                </span>
              </strong>

              <p>
                Risk Score: {latestReport.risk_score}
              </p>

              <p>
                Gaming Average:{" "}
                {latestReport.gaming_average_hours} hours
              </p>

              <p>
                Stress Percentage:{" "}
                {latestReport.latest_stress_percentage}%
              </p>

              <p>
                Average Sleep:{" "}
                {latestReport.average_sleep_hours} hours
              </p>

              <p>
                Risk Trend:{" "}
                <span
                  className={`level ${getTrendLevelClass(
                    latestReport.risk_trend
                  )}`}
                >
                  {latestReport.risk_trend || "N/A"}
                </span>
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <Brain />
              <h3>Personalized Recommendation</h3>
            </div>

            <div className="result-box">
              <h3>Reason</h3>
              <p>
                {latestReport.recommendation_reason ||
                  "No specific risk reason found."}
              </p>

              <h3>Trend Message</h3>
              <p>
                {latestReport.trend_message ||
                  "Trend message is not available."}
              </p>

              <h3>Recommendation</h3>
              <p>
                {latestReport.recommendation ||
                  "No recommendation available."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Previous Reports */}

      <div className="panel reports-panel">
        <div className="panel-title">
          <FileText />
          <h3>Previous Risk Reports</h3>
        </div>

        {loadingReports ? (
          <p>Loading risk reports...</p>
        ) : reports.length === 0 ? (
          <p>
            No risk reports found. Generate a report first.
          </p>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Gaming Avg</th>
                  <th>Stress</th>
                  <th>Sleep Avg</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Trend</th>
                  <th>Reason</th>
                  <th>Recommendation</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => (
                  <tr key={report.risk_id}>
                    <td>
                      {new Date(
                        report.report_date
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {report.gaming_average_hours}h
                    </td>

                    <td>
                      {report.latest_stress_percentage}%
                    </td>

                    <td>
                      {report.average_sleep_hours}h
                    </td>

                    <td>{report.risk_score}</td>

                    <td>
                      <span
                        className={`level ${getLevelClass(
                          report.risk_level
                        )}`}
                      >
                        {report.risk_level}
                      </span>
                    </td>

                    <td>
                      {report.risk_trend || "N/A"}
                    </td>

                    <td>
                      {report.recommendation_reason || "-"}
                    </td>

                    <td>
                      {report.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert History */}

      <div className="panel reports-panel">
        <div className="panel-title">
          <AlertTriangle />
          <h3>Latest Alerts</h3>
        </div>

        {alerts.length === 0 ? (
          <p>No alerts found.</p>
        ) : (
          <div className="record-list">
            {alerts.map((alert) => (
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

                <p>
                  {alert.alert_message}
                </p>

                <small>
                  {new Date(
                    alert.created_at
                  ).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskReports;
