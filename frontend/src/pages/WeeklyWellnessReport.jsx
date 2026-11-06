
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarDays,
  FileText,
  Gamepad2,
  Moon,
  RefreshCcw,
} from "lucide-react";

import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";
import EmailWeeklyReportButton from "../components/EmailWeeklyReportButton";

const WeeklyWellnessReport = () => {
  const { notify } = useNotifications();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Load the last seven days of wellness information.
  const loadWeeklyReport = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);

      const response = await api.get(
        "/analysis/weekly-report",
        { toast: false }
      );

      if (
        response.data?.success === false ||
        !response.data?.report
      ) {
        throw new Error("Weekly report is unavailable");
      }

      setReport(response.data.report);
    } catch (error) {
      console.error("Weekly report load failed:", error);

      setLoadFailed(true);

      notify({
        type: "danger",
        title: "Weekly Report Load Failed",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadWeeklyReport();
  }, [loadWeeklyReport]);

  const getLevelClass = (level) => {
    const value = String(level || "").toUpperCase();

    if (
      value === "HIGH" ||
      value === "NEEDS ATTENTION"
    ) {
      return "high";
    }

    if (
      value === "MODERATE" ||
      value === "STABLE"
    ) {
      return "moderate";
    }

    return "low";
  };

  return (
    <div className="module-page">
      {/* HEADER */}
      <div className="module-header weekly-report-header">
        <div>
          <h1>Weekly Wellness Report</h1>

          <p>
            Review the last 7 days of gaming behavior,
            stress level, sleep pattern, and risk trend.
          </p>
        </div>

        {/* EMAIL + DASHBOARD BUTTONS */}
        <div className="weekly-report-header-actions">
          <div className="weekly-report-email">
            <EmailWeeklyReportButton
              disabled={loading || loadFailed || !report}
            />
          </div>

          <Link to="/dashboard" className="back-link">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* REPORT CONTENT */}
      {loading ? (
        <div className="loading-screen">
          Loading weekly report...
        </div>
      ) : loadFailed ? (
        <div className="panel">
          <div className="panel-title">
            <AlertTriangle />
            <h3>Report Unavailable</h3>
          </div>

          <p>
            Your weekly wellness report could not
            be loaded.
          </p>

          <button
            type="button"
            className="risk-generate-btn"
            onClick={loadWeeklyReport}
          >
            Try Again
          </button>
        </div>
      ) : report ? (
        <>
          {/* MAIN WEEKLY STATISTICS */}
          <section className="stats-grid module-stats">
            <div className="stat-card">
              <div className="stat-icon gaming">
                <CalendarDays />
              </div>

              <div>
                <p>Period</p>
                <h2>{report.period}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon gaming">
                <Gamepad2 />
              </div>

              <div>
                <p>Total Gaming</p>
                <h2>{report.total_gaming_hours}h</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stress">
                <Brain />
              </div>

              <div>
                <p>Average Stress</p>
                <h2>{report.average_stress_percentage}%</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon sleep">
                <Moon />
              </div>

              <div>
                <p>Average Sleep</p>
                <h2>{report.average_sleep_hours}h</h2>
              </div>
            </div>
          </section>

          {/* ADDITIONAL WEEKLY STATISTICS */}
          <section className="stats-grid module-stats">
            <div className="stat-card">
              <div className="stat-icon gaming">
                <FileText />
              </div>

              <div>
                <p>Gaming Sessions</p>
                <h2>{report.total_sessions}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stress">
                <Activity />
              </div>

              <div>
                <p>Latest Risk Score</p>
                <h2>{report.latest_risk_score}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon alerts">
                <RefreshCcw />
              </div>

              <div>
                <p>Risk Trend</p>
                <h2>{report.latest_risk_trend}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon alerts">
                <AlertTriangle />
              </div>

              <div>
                <p>Weekly Status</p>
                <h2>{report.weekly_status}</h2>
              </div>
            </div>
          </section>

          {/* DETAILED WEEKLY SUMMARY */}
          <div className="module-grid reports-panel">
            <div className="panel">
              <div className="panel-title">
                <FileText />
                <h3>Weekly Summary</h3>
              </div>

              <div className="record-list">
                <div className="record-item">
                  <strong>Gaming Activity</strong>

                  <p>
                    Total Sessions:{" "}
                    {report.total_sessions}
                  </p>

                  <p>
                    Total Gaming Hours:{" "}
                    {report.total_gaming_hours}h
                  </p>

                  <p>
                    Average Gaming Session:{" "}
                    {report.average_gaming_hours}h
                  </p>
                </div>

                <div className="record-item">
                  <strong>Stress Monitoring</strong>

                  <p>
                    Average Stress Percentage:{" "}
                    {report.average_stress_percentage}%
                  </p>

                  <p>
                    Highest Stress Percentage:{" "}
                    {report.highest_stress_percentage}%
                  </p>

                  <p>
                    Total Stress Assessments:{" "}
                    {report.total_stress_assessments}
                  </p>
                </div>

                <div className="record-item">
                  <strong>Sleep Tracking</strong>

                  <p>
                    Average Sleep Hours:{" "}
                    {report.average_sleep_hours}h
                  </p>

                  <p>
                    Total Sleep Records:{" "}
                    {report.total_sleep_records}
                  </p>
                </div>
              </div>
            </div>

            {/* RISK AND RECOMMENDATION */}
            <div className="panel">
              <div className="panel-title">
                <AlertTriangle />
                <h3>Risk and Recommendation</h3>
              </div>

              <div className="result-box">
                <h3>Latest Risk Level</h3>

                <p>
                  <span
                    className={`level ${getLevelClass(
                      report.latest_risk_level
                    )}`}
                  >
                    {report.latest_risk_level}
                  </span>
                </p>

                <h3>Weekly Status</h3>

                <p>
                  <span
                    className={`level ${getLevelClass(
                      report.weekly_status
                    )}`}
                  >
                    {report.weekly_status}
                  </span>
                </p>

                <h3>Reason</h3>
                <p>{report.recommendation_reason}</p>

                <h3>Trend Message</h3>
                <p>{report.trend_message}</p>

                <h3>Weekly Message</h3>
                <p>{report.weekly_message}</p>

                <h3>Personalized Recommendation</h3>
                <p>{report.recommendation}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="panel">
          <p>No weekly report available.</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyWellnessReport;
