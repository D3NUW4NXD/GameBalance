
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Moon, PlusCircle } from "lucide-react";

import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getInitialFormData = () => ({
  sleep_date: getLocalDate(),
  bedtime: "",
  wake_time: "",
  sleep_duration_hours: "",
  sleep_quality: "FAIR",
  interruptions: 0,
  used_phone_before_sleep: false,
  notes: "",
});

const SleepTracker = () => {
  const { notify } = useNotifications();

  const [formData, setFormData] = useState(
    getInitialFormData
  );

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load records and sleep statistics.
  const loadSleepData = async () => {
    try {
      const [recordsResponse, summaryResponse] =
        await Promise.all([
          api.get("/sleep", { toast: false }),
          api.get("/sleep/summary", { toast: false }),
        ]);

      setRecords(recordsResponse.data.records || []);
      setSummary(summaryResponse.data.summary || null);
    } catch (error) {
      console.error(
        "Sleep data load failed:",
        error
      );

      notify({
        type: "danger",
        title: "Sleep Data Load Failed",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSleepData();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const duration = Number(
      formData.sleep_duration_hours
    );

    const interruptions = Number(
      formData.interruptions
    );

    // Frontend validation notifications.
    if (!formData.sleep_date) {
      notify({
        type: "warning",
        title: "Select Sleep Date",
        duration: 4000,
      });

      return;
    }

    if (
      formData.sleep_duration_hours === "" ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      duration > 24
    ) {
      notify({
        type: "warning",
        title: "Enter Valid Sleep Duration",
        duration: 4000,
      });

      return;
    }

    if (
      !Number.isInteger(interruptions) ||
      interruptions < 0
    ) {
      notify({
        type: "warning",
        title: "Invalid Interruption Count",
        duration: 4000,
      });

      return;
    }

    try {
      setSaving(true);

      await api.post("/sleep", {
        ...formData,
        sleep_duration_hours: duration,
        interruptions,
      });

      // Reset form after successful saving.
      setFormData(getInitialFormData());

      // Refresh recent records and statistics.
      await loadSleepData();

      // Global API notification:
      // "Sleep Record Saved"
    } catch (error) {
      console.error(
        "Sleep record save failed:",
        error
      );

      // Global API notification:
      // "Sleep Action Failed"
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Sleep Tracker</h1>

          <p>
            Track sleep duration, sleep quality,
            and bedtime habits.
          </p>
        </div>

        <Link to="/dashboard" className="back-link">
          Back to Dashboard
        </Link>
      </div>

      {/* Sleep Statistics */}

      <section className="stats-grid module-stats">
        <div className="stat-card">
          <div className="stat-icon sleep">
            <Moon />
          </div>

          <div>
            <p>Total Records</p>

            <h2>
              {summary?.total_records ?? 0}
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
              {summary?.average_sleep_hours ?? 0}h
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sleep">
            <Moon />
          </div>

          <div>
            <p>Shortest Sleep</p>

            <h2>
              {summary?.shortest_sleep ?? 0}h
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sleep">
            <Moon />
          </div>

          <div>
            <p>Longest Sleep</p>

            <h2>
              {summary?.longest_sleep ?? 0}h
            </h2>
          </div>
        </div>
      </section>

      <div className="module-grid">
        {/* Add Sleep Record */}

        <div className="panel">
          <div className="panel-title">
            <PlusCircle />

            <h3>Add Sleep Record</h3>
          </div>

          <form
            className="module-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="sleep-date">
              Sleep Date
            </label>

            <input
              id="sleep-date"
              type="date"
              name="sleep_date"
              value={formData.sleep_date}
              onChange={handleChange}
              required
            />

            <div className="form-row">
              <div>
                <label htmlFor="sleep-bedtime">
                  Bedtime
                </label>

                <input
                  id="sleep-bedtime"
                  type="time"
                  name="bedtime"
                  value={formData.bedtime}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="sleep-wake">
                  Wake Time
                </label>

                <input
                  id="sleep-wake"
                  type="time"
                  name="wake_time"
                  value={formData.wake_time}
                  onChange={handleChange}
                />
              </div>
            </div>

            <label htmlFor="sleep-duration">
              Sleep Duration Hours
            </label>

            <input
              id="sleep-duration"
              type="number"
              step="0.1"
              min="0.1"
              max="24"
              name="sleep_duration_hours"
              value={formData.sleep_duration_hours}
              onChange={handleChange}
              placeholder="6.5"
              required
            />

            <label htmlFor="sleep-quality">
              Sleep Quality
            </label>

            <select
              id="sleep-quality"
              name="sleep_quality"
              value={formData.sleep_quality}
              onChange={handleChange}
            >
              <option value="POOR">
                Poor
              </option>

              <option value="FAIR">
                Fair
              </option>

              <option value="GOOD">
                Good
              </option>

              <option value="EXCELLENT">
                Excellent
              </option>
            </select>

            <label htmlFor="sleep-interruptions">
              Interruptions
            </label>

            <input
              id="sleep-interruptions"
              type="number"
              name="interruptions"
              min="0"
              step="1"
              value={formData.interruptions}
              onChange={handleChange}
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="used_phone_before_sleep"
                checked={
                  formData.used_phone_before_sleep
                }
                onChange={handleChange}
              />

              Used phone before sleeping
            </label>

            <label htmlFor="sleep-notes">
              Notes
            </label>

            <textarea
              id="sleep-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Used phone before sleeping and woke up twice"
            />

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving Record..."
                : "Save Sleep Record"}
            </button>
          </form>
        </div>

        {/* Recent Sleep Records */}

        <div className="panel">
          <div className="panel-title">
            <Moon />

            <h3>Recent Sleep Records</h3>
          </div>

          {loading ? (
            <p>Loading sleep records...</p>
          ) : records.length === 0 ? (
            <p>No sleep records added yet.</p>
          ) : (
            <div className="record-list">
              {records.map((record) => (
                <div
                  className="record-item"
                  key={record.sleep_id}
                >
                  <strong>
                    {record.sleep_quality}
                  </strong>

                  <p>
                    {record.sleep_duration_hours} hours
                    {" | "}
                    Interruptions: {record.interruptions}
                  </p>

                  <small>
                    {new Date(
                      record.sleep_date
                    ).toLocaleDateString()}
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

export default SleepTracker;
