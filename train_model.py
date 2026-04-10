import pandas as pd
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split, GridSearchCV
from surprise import accuracy
import joblib

# Load ratings
ratings = pd.read_csv('data/u.data', sep='\t', names=['user_id', 'item_id', 'rating', 'timestamp'])
# Load movie titles
movies = pd.read_csv('data/u.item', sep='|', encoding='latin-1', 
                     names=['item_id', 'title'] + [f'col{i}' for i in range(1,23)], usecols=[0,1])

# Prepare data for Surprise
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(ratings[['user_id', 'item_id', 'rating']], reader)

# Train-test split
trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

from surprise import NormalPredictor
algo = NormalPredictor()
algo.fit(trainset)
predictions = algo.test(testset)
rmse = accuracy.rmse(predictions)
print(f'Baseline RMSE: {rmse}')   # Usually around 1.5

param_grid = {
    'n_factors': [50, 100, 150],
    'lr_all': [0.005, 0.01, 0.02],
    'reg_all': [0.02, 0.05, 0.1]
}
gs = GridSearchCV(SVD, param_grid, measures=['rmse', 'mae'], cv=3, n_jobs=-1)
gs.fit(data)

print(f'Best RMSE: {gs.best_score["rmse"]}')
print(f'Best params: {gs.best_params["rmse"]}')

best_params = gs.best_params['rmse']
final_algo = SVD(**best_params)
final_algo.fit(trainset)

# Save the model and the movies dataframe
joblib.dump(final_algo, 'svd_model.pkl')
movies.to_pickle('movies.pkl')