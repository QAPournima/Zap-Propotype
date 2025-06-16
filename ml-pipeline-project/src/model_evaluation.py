def evaluate_model(model, X_test, y_test):
    predictions = model.predict(X_test)
    accuracy = (predictions == y_test).mean()
    return accuracy

def generate_report(model, X_test, y_test):
    from sklearn.metrics import classification_report
    predictions = model.predict(X_test)
    report = classification_report(y_test, predictions)
    return report