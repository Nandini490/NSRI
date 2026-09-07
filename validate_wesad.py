import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

def main():
    # 1. Load the data
    data_path = "/Users/nandinimr/Desktop/NSRI/data/WESAD_model/InputData/WESAD_FINAL_NSRI_30sec_50overlap_CLEAN.csv"
    df = pd.read_csv(data_path)
    
    # 2. Define features, target, and groups (subject)
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
    
    # Pre-processing: replace infinite values with NaN before imputation
    X = X.replace([np.inf, -np.inf], np.nan)
    
    logo = LeaveOneGroupOut()
    
    print(f"Total subjects: {groups.nunique()} ({groups.unique()})")
    print(f"Total rows: {len(df)}")
    print("-" * 60)
    
    accuracies = []
    precisions = []
    recalls = []
    f1s = []
    
    fold = 1
    
    # Track overall predictions for global confusion matrix
    y_true_all = []
    y_pred_all = []
    
    for train_idx, test_idx in logo.split(X, y, groups):
        # Extract train and test sets
        X_train, X_test = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        groups_train, groups_test = groups.iloc[train_idx], groups.iloc[test_idx]
        
        train_subjects = groups_train.unique()
        test_subjects = groups_test.unique()
        intersection = set(train_subjects).intersection(set(test_subjects))
        
        test_subject = test_subjects[0]
        
        # Fit imputation ONLY on training data
        train_mean = X_train.mean()
        X_train = X_train.fillna(train_mean)
        X_test = X_test.fillna(train_mean)  # Apply train mean to test set
        
        print(f"Fold {fold} - Test Subject: {test_subject}")
        print(f"  Train subjects: {list(train_subjects)}")
        print(f"  Test subjects: {list(test_subjects)}")
        print(f"  Train rows: {len(X_train)} | Test rows: {len(X_test)}")
        print(f"  Intersection: {intersection} (Empty? {len(intersection) == 0})")
        
        if len(intersection) > 0:
            print("ERROR: DATA LEAKAGE DETECTED! Subjects overlap.")
            return
            
        # Model training
        model = ExtraTreesClassifier(n_estimators=150, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluation
        y_pred = model.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        # using zero_division=0 to handle cases where true target might have only 1 class
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        accuracies.append(acc)
        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)
        
        y_true_all.extend(y_test)
        y_pred_all.extend(y_pred)
        
        print(f"  Acc: {acc:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f}")
        print("-" * 60)
        fold += 1

    print("=" * 60)
    print("SUBJECT-WISE RESULT — VALIDATION RESULT")
    print("=" * 60)
    
    print(f"Mean Accuracy:  {np.mean(accuracies):.4f} (± {np.std(accuracies):.4f})")
    print(f"Mean Precision: {np.mean(precisions):.4f} (± {np.std(precisions):.4f})")
    print(f"Mean Recall:    {np.mean(recalls):.4f} (± {np.std(recalls):.4f})")
    print(f"Mean F1-score:  {np.mean(f1s):.4f} (± {np.std(f1s):.4f})")
    print()
    print("Global Confusion Matrix:")
    print(confusion_matrix(y_true_all, y_pred_all))
    print()
    print("OLD ROW-LEVEL RESULT — NOT VALID FOR FINAL REPORTING")
    print("~99% Accuracy (Artificial result due to row-level splitting)")
    print("=" * 60)

    # 3. Finally, train on ALL data and save production artifact
    # Note: For production model artifact, we fit on entire available dataset
    print("Training final model on full dataset for production artifact...")
    X_full = X.fillna(X.mean())
    final_model = ExtraTreesClassifier(n_estimators=150, random_state=42)
    final_model.fit(X_full, y)
    
    model_save_path = "/Users/nandinimr/Desktop/NSRI/data/WESAD_model/OutPutModel/ExtraTreeWESADModel_subjectwise.pkl"
    joblib.dump(final_model, model_save_path)
    print(f"Final subject-wise validated model saved to: {model_save_path}")

if __name__ == "__main__":
    main()
