from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")   # shows UI

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    user_input = data.get("input", "")

    # Replace with real ML logic later
    result = "Low Burnout"

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
