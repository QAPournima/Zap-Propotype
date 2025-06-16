def load_config(config_path):
    import json
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config

def save_results(results, output_path):
    import pandas as pd
    results_df = pd.DataFrame(results)
    results_df.to_csv(output_path, index=False)

def log_metrics(metrics, log_path):
    with open(log_path, 'a') as f:
        for key, value in metrics.items():
            f.write(f"{key}: {value}\n")