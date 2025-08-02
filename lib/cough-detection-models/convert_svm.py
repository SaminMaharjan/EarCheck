
# Python script to convert SVM model to JSON format for web use
import joblib
import json
import numpy as np

# Load the SVM model
svm_model = joblib.load('svm_param.joblib')

# Extract model parameters
model_data = {
    'support_vectors': svm_model.support_vectors_.tolist(),
    'dual_coef': svm_model.dual_coef_.tolist(),
    'intercept': svm_model.intercept_.tolist(),
    'gamma': svm_model.gamma,
    'C': svm_model.C,
    'kernel': svm_model.kernel,
    'support': svm_model.support_.tolist(),
    'n_support': svm_model.n_support_.tolist()
}

# Save as JSON
with open('svm_model.json', 'w') as f:
    json.dump(model_data, f)

print("SVM model converted to JSON format")
