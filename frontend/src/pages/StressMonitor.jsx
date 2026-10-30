
import { useEffect, useState } from "react";
import { Brain, Send } from "lucide-react";
import { Link } from "react-router-dom";

import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const StressMonitor = () => {
  const { notify } = useNotifications();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [assessments, setAssessments] = useState([]);
  const [result, setResult] = useState(null);

  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load the stress questionnaire from MySQL.
  const loadQuestions = async () => {
    try {
      const response = await api.get("/stress/questions", {
        toast: false,
      });

      const loadedQuestions = response.data.questions || [];

      setQuestions(loadedQuestions);

      const initialAnswers = {};

      loadedQuestions.forEach((question) => {
        initialAnswers[question.question_id] = 3;
      });

      setAnswers(initialAnswers);
    } catch (error) {
      console.error("Stress questions load failed:", error);

      notify({
        type: "danger",
        title: "Questions Load Failed",
        duration: 4000,
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Load previous stress assessments.
  const loadAssessments = async () => {
    try {
      const response = await api.get("/stress", {
        toast: false,
      });

      setAssessments(response.data.assessments || []);
    } catch (error) {
      console.error("Assessment history load failed:", error);

      notify({
        type: "danger",
        title: "Assessment History Load Failed",
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    loadQuestions();
    loadAssessments();
  }, []);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: Number(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    // Frontend validation uses the same sliding popup.
    if (questions.length === 0) {
      notify({
        type: "warning",
        title: "Questions Unavailable",
        duration: 4000,
      });

      return;
    }

    const formattedAnswers = questions.map((question) => ({
      question_id: Number(question.question_id),
      answer_value: Number(
        answers[question.question_id] ?? 3
      ),
    }));

    const hasInvalidAnswer = formattedAnswers.some(
      (answer) =>
        !Number.isInteger(answer.answer_value) ||
        answer.answer_value < 1 ||
        answer.answer_value > 5
    );

    if (hasInvalidAnswer) {
      notify({
        type: "warning",
        title: "Complete All Questions",
        duration: 4000,
      });

      return;
    }

    try {
      setSubmitting(true);
      setResult(null);

      const response = await api.post("/stress/submit", {
        assessment_date: getLocalDate(),
        answers: formattedAnswers,
      });

      setResult(response.data.result || null);

      // Refresh the assessment history.
      await loadAssessments();

      // Global API interceptor automatically shows:
      // "Assessment Completed"
    } catch (error) {
      console.error(
        "Stress assessment submission failed:",
        error
      );

      // Global API interceptor automatically shows:
      // "Assessment Failed"
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Stress Monitor</h1>
          <p>
            Answer the questionnaire to calculate
            your stress level.
          </p>
        </div>

        <Link to="/dashboard" className="back-link">
          Back to Dashboard
        </Link>
      </div>

      <div className="module-grid">
        <div className="panel">
          <div className="panel-title">
            <Brain />
            <h3>Stress Questionnaire</h3>
          </div>

          {loadingQuestions ? (
            <p>Loading stress questions...</p>
          ) : (
            <form
              className="question-form"
              onSubmit={handleSubmit}
            >
              {questions.map((question) => (
                <div
                  className="question-box"
                  key={question.question_id}
                >
                  <div>
                    <strong>
                      {question.question_text}
                    </strong>

                    <p>{question.category}</p>
                  </div>

                  <select
                    value={
                      answers[question.question_id] ?? 3
                    }
                    onChange={(event) =>
                      handleAnswerChange(
                        question.question_id,
                        event.target.value
                      )
                    }
                  >
                    <option value="1">
                      1 - Very Low
                    </option>

                    <option value="2">
                      2 - Low
                    </option>

                    <option value="3">
                      3 - Normal
                    </option>

                    <option value="4">
                      4 - High
                    </option>

                    <option value="5">
                      5 - Very High
                    </option>
                  </select>
                </div>
              ))}

              <button
                type="submit"
                className="module-submit-btn"
                disabled={
                  submitting || questions.length === 0
                }
              >
                <Send size={18} />

                {submitting
                  ? "Submitting..."
                  : "Submit Assessment"}
              </button>
            </form>
          )}

          {/* Keep the assessment result visible.
              This is data, not an old notification. */}

          {result && (
            <div className="result-box">
              <h3>Assessment Result</h3>

              <p>
                <strong>Total Score:</strong>{" "}
                {result.total_score}
              </p>

              <p>
                <strong>Average Score:</strong>{" "}
                {result.average_score}
              </p>

              <p>
                <strong>Stress Percentage:</strong>{" "}
                {result.stress_percentage}%
              </p>

              <p>
                <strong>Stress Level:</strong>{" "}
                <span
                  className={`level ${String(
                    result.stress_level || ""
                  ).toLowerCase()}`}
                >
                  {result.stress_level}
                </span>
              </p>

              <p>{result.recommendation}</p>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">
            <Brain />
            <h3>Previous Assessments</h3>
          </div>

          {assessments.length === 0 ? (
            <p>
              No stress assessments submitted yet.
            </p>
          ) : (
            <div className="record-list">
              {assessments.map((item) => (
                <div
                  className="record-item"
                  key={item.assessment_id}
                >
                  <strong>
                    {item.stress_level}
                  </strong>

                  <p>
                    Score: {item.average_score}
                    {" | "}
                    Percentage:{" "}
                    {item.stress_percentage}%
                  </p>

                  <small>
                    {new Date(
                      item.assessment_date
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

export default StressMonitor;
