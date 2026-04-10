import { useEffect, useState } from "react";
import API from "./api";
import "./index.css";
import Metrics from "./Metrics";

function StarRating({ movieId, value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const current = hovered || value || 0;

  return (
    <div className="star-rating" aria-label={`Rate movie ${movieId}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`star ${star <= current ? "star-filled" : "star-empty"}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(movieId, star)}
          aria-label={`${star} star`}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  );
}

function App() {
  const [movies, setMovies] = useState([]);
  const [ratings, setRatings] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coldStart, setColdStart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await API.get("/movies");
      setMovies(res.data);
    } catch (err) {
      console.error("Error fetching movies", err);
    }
  };

  const handleRating = (movieId, value) => {
    setRatings((prev) => ({ ...prev, [movieId]: value }));
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await API.get(`/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  const addFromSearch = (movie) => {
    if (!movies.find((m) => m.item_id === movie.item_id)) {
      setMovies((prev) => [movie, ...prev]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const submitRatings = async () => {
    setLoading(true);
    try {
      const ratingsArray = Object.entries(ratings).map(([movie_id, rating]) => ({
        movie_id: parseInt(movie_id),
        rating: parseFloat(rating),
      }));

      const res = await API.post("/recommend", { ratings: ratingsArray, n: 10 });
      setRecommendations(res.data.recommendations);
      setColdStart(res.data.cold_start);
    } catch (err) {
      console.error("Error getting recommendations", err);
    }
    setLoading(false);
  };

  const ratedCount = Object.keys(ratings).length;
  const progress = Math.min((ratedCount / 3) * 100, 100);

  return (
    <div className="container">
      <header className="app-header">
        <h1>🎬 Movie Recommender</h1>
        <p className="subtitle">Rate movies to get personalised picks powered by SVD collaborative filtering</p>
      </header>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search for a movie to rate..."
          value={searchQuery}
          onChange={handleSearch}
        />
        {searching && <span className="search-spinner">⏳</span>}
        {searchResults.length > 0 && (
          <ul className="search-dropdown">
            {searchResults.map((m) => (
              <li key={m.item_id} onClick={() => addFromSearch(m)}>
                {m.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Progress */}
      <div className="progress-section">
        <div className="progress-label">
          {ratedCount < 3
            ? `Rate ${3 - ratedCount} more movie${3 - ratedCount !== 1 ? "s" : ""} to unlock recommendations`
            : `✅ ${ratedCount} movies rated — ready to go!`}
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Movie list */}
      <div className="movie-list">
        {movies.map((movie) => (
          <div
            key={movie.item_id}
            className={`movie-item ${ratings[movie.item_id] ? "movie-rated" : ""}`}
          >
            <span className="movie-title">{movie.title}</span>
            <StarRating
              movieId={movie.item_id}
              value={ratings[movie.item_id]}
              onChange={handleRating}
            />
          </div>
        ))}
      </div>

      <button
        className="submit-btn"
        onClick={submitRatings}
        disabled={ratedCount < 3 || loading}
      >
        {loading ? "Crunching the numbers..." : "✨ Get Recommendations"}
      </button>

      {loading && <div className="spinner" />}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h2>🍿 Top Picks For You</h2>
          {coldStart && (
            <p className="cold-start-note">
              No ratings detected — showing popular movies as a starting point.
            </p>
          )}
          <div className="rec-grid">
            {recommendations.map((rec, i) => (
              <div key={rec.movie_id} className="rec-card">
                <div className="rec-rank">#{i + 1}</div>
                <div className="rec-title">{rec.title}</div>
                {rec.predicted_rating && (
                  <div className="rec-badge">
                    ⭐ {rec.predicted_rating} predicted
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Metrics />
    </div>
  );
}

export default App;