def create_features(data):
    # Example feature creation logic
    data['new_feature'] = data['existing_feature'] * 2
    return data

def select_features(data, feature_list):
    return data[feature_list]