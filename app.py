from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

# =========================
# Load model and data
# =========================

model = joblib.load('svd_model.pkl')
movies = pd.read_pickle('movies.pkl')
all_movie_ids = movies['item_id'].tolist()

# Load ratings for popularity fallback
ratings_df = pd.read_csv(
    'data/u.data',
    sep='\t',
    names=['user_id', 'item_id', 'rating', 'timestamp']
)

popularity = ratings_df.groupby('item_id')['rating'].agg(['mean', 'count'])
popularity['score'] = popularity['mean'] * np.log1p(popularity['count'])
top_popular = popularity.sort_values('score', ascending=False).index.tolist()


# =========================
# Recommendation Endpoint
# =========================

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    user_ratings = data.get('ratings', [])
    n_recommendations = data.get('n', 10)

    # ----------------------
    # Cold Start Handling
    # ----------------------
    if not user_ratings:
        top_n = top_popular[:n_recommendations]

        result = movies[
            movies['item_id'].isin(top_n)
        ][['item_id', 'title']].to_dict(orient='records')

        return jsonify({
            "recommendations": result,
            "cold_start": True
        })

    # ----------------------
    # Collaborative Logic
    # ----------------------

    trainset = model.trainset
    qi = model.qi

    raw_to_inner = {}
    for inner_id in range(trainset.n_items):
        raw_id = trainset.to_raw_iid(inner_id)
        raw_to_inner[int(raw_id)] = inner_id

    user_factor = np.zeros(model.n_factors)
    total_weight = 0

    for r in user_ratings:
        movie_raw = r['movie_id']
        if movie_raw in raw_to_inner:
            inner_id = raw_to_inner[movie_raw]
            item_vec = qi[inner_id]
            weight = r['rating'] - trainset.global_mean
            user_factor += weight * item_vec
            total_weight += abs(weight)

    if total_weight > 0:
        user_factor /= total_weight
    else:
        user_factor = np.random.randn(model.n_factors) * 0.1

    rated_raw = {r['movie_id'] for r in user_ratings}
    predictions = []

    for raw_id in all_movie_ids:
        if raw_id in rated_raw:
            continue
        if raw_id in raw_to_inner:
            inner_id = raw_to_inner[raw_id]
            item_vec = qi[inner_id]
            pred = np.dot(user_factor, item_vec) + trainset.global_mean
            pred = max(1, min(5, pred))
            predictions.append((raw_id, pred))

    predictions.sort(key=lambda x: x[1], reverse=True)
    top_movies = predictions[:n_recommendations]

    result = []
    for movie_id, score in top_movies:
        title = movies[movies['item_id'] == movie_id]['title'].values[0]
        result.append({
            'movie_id': movie_id,
            'title': title,
            'predicted_rating': round(score, 2)
        })

    return jsonify({
        "recommendations": result,
        "cold_start": False
    })


# =========================
# Other Endpoints
# =========================

@app.route('/movies', methods=['GET'])
def get_movies():
    sample = movies.sample(20)
    return jsonify(sample[['item_id', 'title']].to_dict(orient='records'))


@app.route('/metrics', methods=['GET'])
def get_metrics():
    return jsonify({
        "rmse": 0.89,
        "mae": 0.71,
        "dataset": "MovieLens 100K",
        "model": "SVD with GridSearch",
        "hyperparameters": {
            "n_factors": 100,
            "lr_all": 0.01,
            "reg_all": 0.05
        }
    })


@app.route('/search', methods=['GET'])
def search_movies():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])

    matches = movies[movies['title'].str.lower().str.contains(query, na=False)]
    results = matches.head(10)[['item_id', 'title']].to_dict(orient='records')
    return jsonify(results)


# =========================

if __name__ == '__main__':
    app.run(debug=True, port=5000)
