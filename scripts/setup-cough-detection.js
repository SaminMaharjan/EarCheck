#!/usr/bin/env node

/**
 * Setup script to integrate the cough detection project with EarCheck
 * This script helps convert the Python models to a format usable by the web application
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up cough detection integration...\n');

// Check if cough-detection directory exists
const coughDetectionPath = path.join(__dirname, '..', 'cough-detection');
if (!fs.existsSync(coughDetectionPath)) {
  console.error('❌ cough-detection directory not found!');
  console.log('Please clone the repository first:');
  console.log('git clone https://github.com/mhdadk/cough-detection.git');
  process.exit(1);
}

console.log('✅ Found cough-detection directory');

// Create integration directory
const integrationPath = path.join(__dirname, '..', 'lib', 'cough-detection-models');
if (!fs.existsSync(integrationPath)) {
  fs.mkdirSync(integrationPath, { recursive: true });
  console.log('✅ Created integration directory');
}

// Copy necessary files
const filesToCopy = [
  'feature_extractor/mx-h64-1024_0d3-1.17.pkl',
  'feature_extractor/net.py',
  'classifiers/svm/svm_param.joblib',
  'features/X.npy',
  'features/labels.pkl'
];

console.log('\n📋 Files to integrate:');
filesToCopy.forEach(file => {
  const sourcePath = path.join(coughDetectionPath, file);
  const destPath = path.join(integrationPath, path.basename(file));
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  Missing ${file} (may need to run training first)`);
  }
});

// Create conversion script for the SVM model
const conversionScript = `
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
`;

fs.writeFileSync(path.join(integrationPath, 'convert_svm.py'), conversionScript);
console.log('✅ Created SVM conversion script');

// Create README for integration
const readme = `
# Cough Detection Integration

This directory contains the integrated models from the cough detection project.

## Files:
- \`mx-h64-1024_0d3-1.17.pkl\`: Pre-trained feature extraction network
- \`net.py\`: Network architecture for feature extraction
- \`svm_param.joblib\`: Trained SVM classifier
- \`X.npy\`: Feature vectors from the dataset
- \`labels.pkl\`: Labels for the feature vectors
- \`convert_svm.py\`: Script to convert SVM model to JSON format

## Setup Instructions:

1. **Convert SVM model to JSON** (for web use):
   \`\`\`bash
   cd lib/cough-detection-models
   python convert_svm.py
   \`\`\`

2. **Train the models** (if not already trained):
   \`\`\`bash
   cd cough-detection
   python classifiers/svm/main.py
   \`\`\`

3. **Extract features** (if not already extracted):
   \`\`\`bash
   cd cough-detection
   python feature_extractor/extract_features.py
   \`\`\`

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
`;

fs.writeFileSync(path.join(integrationPath, 'README.md'), readme);
console.log('✅ Created integration README');

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Run the training scripts in the cough-detection directory if needed');
console.log('2. Convert the SVM model to JSON format using the provided script');
console.log('3. Update the cough detection integration to use the actual models');
console.log('\nSee lib/cough-detection-models/README.md for detailed instructions'); 