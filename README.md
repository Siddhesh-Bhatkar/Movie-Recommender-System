# 🎬 Movie Recommender System

A full-stack movie recommendation engine built with **React**, **Flask**, and **SVD collaborative filtering** trained on the MovieLens 100K dataset.

---

## 🚀 Live Features

- ⭐ **Interactive star rating UI** — rate movies directly in the browser
- 🔍 **Live movie search** — find and rate any movie in the dataset
- 🤖 **SVD-based recommendations** — personalised picks based on your taste profile
- ❄️ **Cold-start fallback** — popularity-weighted recommendations for new users
- 📊 **Model metrics panel** — RMSE, MAE, and hyperparameter transparency
- 📖 **Built-in explainer** — teaches users what collaborative filtering actually does

---

## 🏗️ System Architecture

```
User (Browser)
    │
    ▼
React Frontend (localhost:3000)
    │  axios POST /recommend  { ratings: [...] }
    │  axios GET  /movies
    │  axios GET  /metrics
    │  axios GET  /search?q=...
    ▼
Flask REST API (localhost:5000)
    │
    ├── /movies     → returns 20 random movies from movies.pkl
    ├── /search     → fuzzy title search on movies DataFrame
    ├── /metrics    → returns RMSE, MAE, hyperparameters
    └── /recommend  → collaborative filtering inference
            │
            ▼
    SVD Model (svd_model.pkl)
        │
        ├── If no ratings → popularity fallback (mean × log(count))
        └── If ratings provided:
                │
                ├── Build user latent vector from item factors (qi)
                │     weighted by (rating − global_mean)
                │
                ├── Dot product with all unrated item vectors
                │
                └── Return top-N predictions (clipped to [1, 5])
            │
            ▼
    JSON Response → React renders recommendation cards
```

---

## 📐 How the Model Works

### Collaborative Filtering
Collaborative filtering recommends items by discovering **patterns across many users** — no knowledge of a movie's content is needed. If users A and B rate similar movies similarly, and A loved movie X, the system predicts B will too.

### SVD (Singular Value Decomposition)
The model factorises a sparse user–item ratings matrix into latent factor vectors:

```
R ≈ U × Σ × Vᵀ
```

- **U** — user latent factors (user tastes)
- **Σ** — singular values (importance of each dimension)
- **Vᵀ (qi)** — item latent factors (movie characteristics)

Each latent dimension captures a hidden "taste axis" (e.g., preference for action, drama, comedy) without being explicitly labelled.

### Inference for New Users
Since new users aren't in the training set, we **synthesise a user vector** from their ratings:

```python
user_factor = Σ (rating − global_mean) × item_vector[movie_id]
```

This projects the user into the learned latent space using weighted item factors.

---

## 📊 Model Performance

| Metric | Value | Meaning |
|--------|-------|---------|
| **RMSE** | 0.89 | Predictions are off by < 1 star on average (penalises large errors) |
| **MAE** | 0.71 | Mean absolute error — half a star off on average |
| **Dataset** | MovieLens 100K | 100,000 ratings from 943 users on 1,682 movies |

**Why lower is better:** Both RMSE and MAE measure distance between predicted and actual ratings. On a 1–5 scale, an RMSE of 0.89 is competitive with published baselines for this dataset.

### Hyperparameters (tuned via GridSearchCV)

```json
{
  "n_factors": 100,
  "lr_all": 0.01,
  "reg_all": 0.05
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Axios |
| Backend | Flask, Flask-CORS |
| ML Model | Surprise SVD (scikit-surprise) |
| Data | MovieLens 100K (`u.data`) |
| Model Storage | joblib (`.pkl`) |

---

## ⚙️ Setup & Running

### Backend

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install flask flask-cors pandas numpy joblib scikit-surprise

# Train model (first time only)
python train_model.py

# Start API server
python app.py
# → Running on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start
# → Running on http://localhost:3000
```

---

## 📁 Project Structure

```
movie-recommender/
├── app.py               # Flask REST API
├── train_model.py       # SVD training + GridSearchCV
├── svd_model.pkl        # Trained model (gitignored)
├── movies.pkl           # Movie metadata DataFrame
├── data/
│   └── u.data           # MovieLens 100K ratings
└── frontend/
    └── src/
        ├── App.jsx      # Main UI + star rating
        ├── Metrics.jsx  # Model metrics + explainer
        ├── api.js       # Axios base config
        └── index.css    # Styling
```

---

## 🔮 Future Improvements

### Model Improvements
- **Hybrid model (LightFM)** — combine collaborative filtering with item content features (genre, cast, year) to reduce cold-start reliance
- **Implicit feedback** — incorporate watch time, click behaviour, and scroll depth as signals
- **Time-aware recommendations** — decay older ratings to reflect evolving taste
- **BPR (Bayesian Personalised Ranking)** — optimise for ranking quality rather than raw rating prediction

### Engineering Improvements
- **User authentication (JWT)** — persist ratings across sessions in a database (PostgreSQL)
- **Redis caching** — cache popular recommendation results to reduce inference latency
- **Dockerise** — containerise Flask + React for reproducible deployments
- **Deploy on AWS** — ECS (Flask) + S3/CloudFront (React) + RDS (ratings store)
- **A/B testing framework** — compare SVD vs hybrid model recommendations in production

### UI / UX Improvements
- **Pagination + infinite scroll** for the movie rating list
- **Genre filters** to help users find movies they recognise
- **Explanation cards** per recommendation: "Recommended because you liked X"
- **Re-rate / remove** already-rated movies

---

## 📚 References

- [MovieLens Dataset](https://grouplens.org/datasets/movielens/100k/)
- [Surprise Library Documentation](https://surprise.readthedocs.io/)
- [Matrix Factorisation Techniques — Koren et al. (2009)](https://datajobs.com/data-science-repo/Recommender-Systems-[Netflix].pdf)
