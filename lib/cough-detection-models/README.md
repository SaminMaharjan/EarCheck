
# Cough Detection Integration

This directory contains the integrated models from the cough detection project.

## Files:
- `mx-h64-1024_0d3-1.17.pkl`: Pre-trained feature extraction network
- `net.py`: Network architecture for feature extraction
- `svm_param.joblib`: Trained SVM classifier
- `X.npy`: Feature vectors from the dataset
- `labels.pkl`: Labels for the feature vectors
- `convert_svm.py`: Script to convert SVM model to JSON format

## Setup Instructions:

1. **Convert SVM model to JSON** (for web use):
   ```bash
   cd lib/cough-detection-models
   python convert_svm.py
   ```

2. **Train the models** (if not already trained):
   ```bash
   cd cough-detection
   python classifiers/svm/main.py
   ```

3. **Extract features** (if not already extracted):
   ```bash
   cd cough-detection
   python feature_extractor/extract_features.py
   ```

## Integration Notes:

- The SVM model needs to be converted to JSON format for use in the browser
- The feature extraction network can be converted to TensorFlow.js format
- Audio processing uses the same parameters as the original project
- Feature vectors are 1024-dimensional as in the original implementation

## Next Steps:

1. Convert the SVM model to JSON format
2. Implement TensorFlow.js version of the feature extraction network
3. Update the cough detection integration to use the actual trained models
4. Test with real audio data
