
import { useEffect, useState } from "react";
import { Gamepad2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api";

// Get today's date using the user's local time.
const getLocalDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialFormData = () => ({
  game_title: "",
  platform: "Mobile",
  session_date: getLocalDate(),
  start_time: "",
  end_time: "",
  duration_minutes: "",
  mood_after: "Normal",
  notes: "",
});

const GamingTracker = () => {
  const [formData, setFormData] = useState(initialFormData);

  const [sessions, setSessions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load the current user's gaming sessions.
  const loadSessions = async () => {
    try {
      const response = await api.get("/gaming");

      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error(
        "Failed to load gaming sessions:",
        error
      );

      // Global notification system handles this error.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Handle changes to gaming session fields.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save gaming session to MySQL through the backend.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    try {
      setSaving(true);

      await api.post("/gaming", {
        ...formData,
        duration_minutes: Number(formData.duration_minutes),
      });

      // Clear the form after successful saving.
      setFormData(initialFormData());

      // Refresh recent gaming sessions.
      await loadSessions();

      // The global NotificationContext automatically displays:
      // "Gaming Session Saved"
      //
      // No extra notify() call is necessary.
    } catch (error) {
      console.error(
        "Gaming session save failed:",
        error
      );

      // The global NotificationContext automatically displays:
      // "Gaming Action Failed"
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Gaming Tracker</h1>

          <p>
            Add and monitor daily gaming sessions.
          </p>
        </div>

        <Link to="/dashboard" className="back-link">
          Back to Dashboard
        </Link>
      </div>

      <div className="module-grid">
        {/* Gaming Session Form */}

        <div className="panel">
          <div className="panel-title">
            <PlusCircle />

            <h3>Add Gaming Session</h3>
          </div>

          <form
            className="module-form"
            onSubmit={handleSubmit}
          >
            <label>Game Title</label>

            <input
              type="text"
              name="game_title"
              value={formData.game_title}
              onChange={handleChange}
              placeholder="CSGO"
              required
            />

            <label>Platform</label>

            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
            >
              <option>Mobile</option>
              <option>PC</option>
              <option>PlayStation</option>
              <option>Xbox</option>
              <option>Nintendo</option>
            </select>

            <label>Session Date</label>

            <input
              type="date"
              name="session_date"
              value={formData.session_date}
              onChange={handleChange}
              required
            />

            <div className="form-row">
              <div>
                <label>Start Time</label>

                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>End Time</label>

                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                />
              </div>
            </div>

            <label>Duration Minutes</label>

            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              placeholder="150"
              min="1"
              step="1"
              required
            />

            <label>Mood After Gaming</label>

            <select
              name="mood_after"
              value={formData.mood_after}
              onChange={handleChange}
            >
              <option>Happy</option>
              <option>Normal</option>
              <option>Tired</option>
              <option>Angry</option>
              <option>Stressed</option>
            </select>

            <label>Notes</label>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Played ranked matches at night"
            />

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving Session..."
                : "Save Gaming Session"}
            </button>
          </form>
        </div>

        {/* Recent Gaming Sessions */}

        <div className="panel">
          <div className="panel-title">
            <Gamepad2 />

            <h3>Recent Gaming Sessions</h3>
          </div>

          {loading ? (
            <p>Loading gaming sessions...</p>
          ) : sessions.length === 0 ? (
            <p>No gaming sessions added yet.</p>
          ) : (
            <div className="record-list">
              {sessions.map((session) => (
                <div
                  className="record-item"
                  key={session.session_id}
                >
                  <strong>{session.game_title}</strong>

                  <p>
                    {session.platform} •{" "}
                    {session.duration_minutes} minutes
                  </p>

                  <small>
                    {new Date(
                      session.session_date
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

export default GamingTracker;
