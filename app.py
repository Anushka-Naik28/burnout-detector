from flask import Flask, request, jsonify
import pickle

app = Flask(__name__)

@app.route("/")
def home():
    return "Burnout Detector is running!"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    user_input = data.get("input", "")

    # Dummy response (replace with your model logic)
    result = "Low Burnout"

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
