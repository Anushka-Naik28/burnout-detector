from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")   # 🔥 THIS SHOWS UI

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    user_input = data.get("input", "")

    result = "Low Burnout"

    return jsonify({"result": result})
