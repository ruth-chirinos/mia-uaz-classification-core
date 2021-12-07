import argparse
import matplotlib.pyplot as plt
from autosklearn.classification import AutoSklearnClassifier
from glob import glob
from sklearn import metrics as sklmetrics
from autosklearn import metrics as asklmetrics
import joblib
import json
import os
import pandas as pd
from sklearn.model_selection import train_test_split

def parse_args():
    parser = argparse.ArgumentParser() 
    parser.add_argument('--hosts', type=list, default=json.loads(os.environ.get('SM_HOSTS')))
    parser.add_argument('--time_left_for_this_task', type=int, default=120 )
    parser.add_argument('--per_run_time_limit', type=int, default=30 )
    parser.add_argument('--validation_size', type=float, default=0.15 )
    parser.add_argument('--test_size', type=float, default=0.15 )
    parser.add_argument('--initial_configurations_via_metalearning', type=int, default=30 )
    parser.add_argument('--current_host', type=str, default=os.environ.get('SM_CURRENT_HOST'))
    
    return parser.parse_known_args()

if __name__ == '__main__':
    args, _ = parse_args()
    
    path = os.environ.get('SM_CHANNEL_TRAINING')
    filename = glob(f'{path}/*.csv')[0]
    dataset = pd.read_csv(filename)
    dataset = dataset.dropna(subset=['target'])
    categorical_columns = dataset.select_dtypes(include='object').columns
    dataset = dataset.astype({column: 'category' for column in categorical_columns})
    
    print('Dataset has been loaded. ')
    
    x_train, x_test, y_train, y_test = train_test_split(
        dataset.drop(columns=['target']),
        dataset['target'], 
        test_size=args.test_size, 
        random_state=7
    )
    
    print(f'Training dataset size: {y_train.shape[0]}')
    print(f'Test dataset size: {y_test.shape[0]}')

    model = AutoSklearnClassifier(
        time_left_for_this_task=args.time_left_for_this_task,
        per_run_time_limit=args.per_run_time_limit,
        ensemble_size=1,
        initial_configurations_via_metalearning=args.initial_configurations_via_metalearning,
        include={
            'feature_preprocessor': ['no_preprocessing']
        },
        resampling_strategy_arguments={
            'train_size': 1 - args.validation_size
        },
        metric=asklmetrics.f1_macro,
        scoring_functions=[
            asklmetrics.accuracy,
            asklmetrics.precision_macro,
            asklmetrics.recall_macro,
            asklmetrics.f1_macro
        ]
    )
    
    print('Model has been compiled.')

    model.fit(x_train, y_train)
    print('Model has been trained.')

    if args.current_host == args.hosts[0]:
        path = os.environ.get('SM_MODEL_DIR')
        
        # Ourtput test index
        x_test.index.to_series().rename('index').to_csv(os.path.join(path, 'test_index.csv'), index=False)
        print('Test index has been saved')
        
        joblib.dump(model, os.path.join(path, 'best_model.gzip'))
        print('Model has been saved')
        
        results = pd.DataFrame({
          name: model.cv_results_[name].data 
          for name in [
            'param_classifier:__choice__', 
            'metric_accuracy', 
            'metric_precision_macro', 
            'metric_recall_macro', 
            'metric_f1_macro'
          ]
        })
        results['train_duration'] = model.cv_results_['mean_fit_time']
        results['status'] = model.cv_results_['status']
        results.index.name = 'id'
        results = results.rename(columns={
            'param_classifier:__choice__': 'algorithm', 
            'metric_accuracy': 'accuracy', 
            'metric_precision_macro': 'precision_macro', 
            'metric_recall_macro': 'recall_macro', 
            'metric_f1_macro': 'f1_score_macro'
        }).sort_values('f1_score_macro', ascending=False)
        
        # Output metrics of all models
        results.round(2).to_csv(os.path.join(path, 'models_metrics.csv'))
        print('Model metrics has been saved')
        
        # Output params used for the model, params are calculated by Auto Sklearn
        models_params = model.cv_results_['params']
        for idx, model_params in enumerate(models_params):
            model_params['id'] = idx
        models_params = [
            list(filter(lambda model_params: model_params['id'] == idx, models_params))[0] 
            for idx in results.index
        ]
        with open(os.path.join(path, 'models_params.json'), 'w') as file:
            json.dump(models_params, file)
        print('Model params has been saved')
            
        # Plot confusion matrix    
        title = f"Best model: {results['algorithm'].values[0].replace('_', ' ')} (id = {results.index[0]})"
        plt.figure()
        sklmetrics.plot_confusion_matrix(model, x_test, y_test, cmap='Blues')
        plt.title(title)
        plt.savefig(os.path.join(path, 'best_model_confusion_matrix.jpg') )
        print('Best model Confusion Matrix image has been saved')
        
        # Plot ROC Curve
        plt.figure()
        if 'predict_proba' in dir(model):
          y_pred = model.predict_proba(x_test) 
        elif 'decision_function' in dir(model):
          y_pred = model.decision_function(x_test) 
        for idx, label in enumerate(model.classes_):
            fpr, tpr, _ = sklmetrics.roc_curve(y_test == label, y_pred[:, idx])
            roc_auc = sklmetrics.auc(fpr, tpr)
            plt.plot(fpr, tpr, label=f'ROC AUC (class = {label}): {roc_auc:.2f}')
        
        plt.plot([0, 1], [0, 1], 'k--')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(title)
        plt.legend(loc="lower right")
        plt.savefig(os.path.join(path, 'best_model_roc_curve.jpg') )
        print('Best model ROC Curve image has been saved')
        
        print('Process has been finished.')