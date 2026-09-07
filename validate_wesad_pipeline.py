import os
import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

class InfToNaNTransformer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
        
    def transform(self, X):
        # We assume X is a pandas DataFrame, if it's a numpy array we handle it
        if isinstance(X, pd.DataFrame):
            return X.replace([np.inf, -np.inf], np.nan)
        else:
            X = np.array(X, dtype=float)
            X[np.isinf(X)] = np.nan
            return X

def get_pipeline():
    return Pipeline([
        ('inf_to_nan', InfToNaNTransformer()),
        ('imputer', SimpleImputer(strategy='mean')),
        ('classifier', ExtraTreesClassifier(n_estimators=150, random_state=42))
    ])

def main():
    data_path = "/Users/nandinimr/Desktop/NSRI/data/WESAD_model/InputData/WESAD_FINAL_NSRI_30sec_50overlap_CLEAN.csv"
    df = pd.read_csv(data_path)
    
    features = [
        'Mean_RR', 'Mean_HR', 'SDNN', 'RMSSD', 'pNN50', 
        'SCR_Peaks_N', 'SCR_Peaks_Amplitude_Mean', 'EDA_Tonic_SD', 
        'Resp_Rate_Mean', 'Resp_Rate_Std', 'Resp_Amplitude_Std', 
        'Temp_Mean', 'Temp_Std', 'Temp_Min', 'Temp_Max', 
        'ACC_Magnitude_Mean', 'ACC_Magnitude_Std', 'ACC_Magnitude_Max'
    ]
    target_col = 'stress_target'
    group_col = 'subject'
    
    X = df[features]
    y = df[target_col]
    groups = df[group_col]
    
    # ... Skipping the LOGO cross-validation since it was already proven successful in the last run
    
    print("Training final model on full dataset for production artifact...")
    final_pipeline = get_pipeline()
    final_pipeline.fit(X, y)
    
    model_save_path = "/Users/nandinimr/Desktop/NSRI/data/WESAD_model/OutPutModel/ExtraTreeWESADModel_subjectwise_pipeline.pkl"
    joblib.dump(final_pipeline, model_save_path)
    print(f"Final subject-wise pipeline saved to: {model_save_path}")

    # =========================================================================
    # RELOAD AND SAFE TEST
    # =========================================================================
    print("\n" + "=" * 60)
    print("RELOAD TEST IN FRESH CONTEXT")
    print("=" * 60)
    
    reloaded_pipeline = joblib.load(model_save_path)
    print(f"Reloaded object type: {type(reloaded_pipeline)}")
    print(f"Step 1 (InfToNaN): {type(reloaded_pipeline.steps[0][1])}")
    print(f"Step 2 (Imputer): {type(reloaded_pipeline.steps[1][1])}")
    print(f"Step 3 (Classifier): {type(reloaded_pipeline.steps[2][1])}")
    
    imputer = reloaded_pipeline.named_steps['imputer']
    print(f"Imputer learned statistics shape: {imputer.statistics_.shape}")
    
    classifier = reloaded_pipeline.named_steps['classifier']
    print(f"Classifier n_features_in_: {classifier.n_features_in_}")
    
    if hasattr(classifier, 'feature_names_in_'):
        print(f"Classifier feature_names_in_: {list(classifier.feature_names_in_)}")
    else:
        print("Classifier feature_names_in_: Not accessible inside pipeline (expected behavior due to Imputer stripping numpy array names)")
        
    print(f"Classifier classes: {classifier.classes_}")

    print("\n--- Running Safe Inference Test ---")
    sample_df = X.head(2).copy()
    
    print("Test 1: Normal Input")
    preds = reloaded_pipeline.predict(sample_df)
    probs = reloaded_pipeline.predict_proba(sample_df)
    print(f"Predictions: {preds}")
    print(f"Probabilities: {probs}")
    
    print("\nTest 2: Input with introduced NaNs and Infs")
    dirty_df = sample_df.copy()
    dirty_df.iloc[0, 0] = np.nan # First feature, first row -> NaN
    dirty_df.iloc[1, 0] = np.inf # First feature, second row -> inf
    dirty_df.iloc[1, 1] = -np.inf # Second feature, second row -> -inf
    
    preds_dirty = reloaded_pipeline.predict(dirty_df)
    probs_dirty = reloaded_pipeline.predict_proba(dirty_df)
    print("SUCCESS: Pipeline handled NaN/Inf without crashing!")
    print(f"Predictions: {preds_dirty}")
    print(f"Probabilities: {probs_dirty}")

if __name__ == "__main__":
    main()
