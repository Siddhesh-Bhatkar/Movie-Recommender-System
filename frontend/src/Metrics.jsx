import { useState, useEffect } from "react";
import API from "./api";

function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    API.get("/metrics")
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!metrics) return <div className="metrics-loading">Loading model metrics...</div>;

  return (
    <div className="metrics-box">
      <div className="metrics-header">
        <h3>📊 Model Performance</h3>
        <button
          className="explainer-toggle"
          onClick={() => setShowExplainer((v) => !v)}
        >
          {showExplainer ? "Hide Explainer ▲" : "What does this mean? ▼"}
        </button>
      </div>

      {showExplainer && (
        <div className="explainer-section">
          <div className="explainer-card">
            <h4>🔢 What is RMSE?</h4>
            <p>
              <strong>Root Mean Square Error (RMSE)</strong> measures how far off
              the model's predicted ratings are from actual user ratings, on
              average. An RMSE of <strong>0.89</strong> means predictions are
              off by less than 1 star — pretty good on a 1–5 scale!
            </p>
            <p className="explainer-note">📉 Lower RMSE = better accuracy</p>
          </div>

          <div className="explainer-card">
            <h4>📏 What is MAE?</h4>
            <p>
              <strong>Mean Absolute Error (MAE)</strong> is the average absolute
              difference between predicted and actual ratings. Unlike RMSE, it
              doesn't penalise large errors as heavily. An MAE of{" "}
              <strong>0.71</strong> means on average we're less than ¾ of a star
              off.
            </p>
            <p className="explainer-note">📉 Lower MAE = better accuracy</p>
          </div>

          <div className="explainer-card">
            <h4>🤝 What is Collaborative Filtering?</h4>
            <p>
              Collaborative filtering recommends items by finding{" "}
              <strong>patterns across many users</strong>. If users A and B both
              loved the same 5 movies, and user A loved movie X, we predict user
              B will too — without needing to know anything about the movie's
              content.
            </p>
            <p className="explainer-note">
              🧠 This model uses <strong>SVD (Singular Value Decomposition)</strong>{" "}
              to compress user–item interactions into latent factors, capturing
              hidden taste dimensions.
            </p>
          </div>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-pill">
          <span className="metric-label">RMSE</span>
          <span className="metric-value good">{metrics.rmse}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">MAE</span>
          <span className="metric-value good">{metrics.mae}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Dataset</span>
          <span className="metric-value">{metrics.dataset}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Model</span>
          <span className="metric-value">{metrics.model}</span>
        </div>
      </div>

      <details className="hyperparams">
        <summary>⚙️ Hyperparameters</summary>
        <pre>{JSON.stringify(metrics.hyperparameters, null, 2)}</pre>
      </details>
    </div>
  );
}

export default Metrics;