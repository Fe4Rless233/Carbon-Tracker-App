from flask import Flask, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'  # Change this to a random secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///carbon_tracker.db' 
db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

# Tracking model (adjust as needed)
class Tracking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity = db.Column(db.String(150), nullable=False)
    amount = db.Column(db.Float, nullable=False)  # Allow decimals
    date = db.Column(db.DateTime) # Add a date column to store the date and time of the tracking entry

with app.app_context():
    db.create_all()

@app.route('/signup', methods=['POST'])
def signup():
    try:
        username = request.json.get('username')
        password = request.json.get('password')
        hashed_password = generate_password_hash(password, method='sha256')
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully!'})
    except Exception as e:
        return jsonify({'message': 'Error creating user', 'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        username = request.json.get('username')
        password = request.json.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            return jsonify({'message': 'Login successful!'})
        return jsonify({'message': 'Invalid credentials!'}), 401
    except Exception as e:
        return jsonify({'message': 'Error during login', 'error': str(e)}), 500

@app.route('/track', methods=['POST'])
def track():
    try:
        if 'user_id' not in session:
            return jsonify({'message': 'You need to log in!'}), 401
        activity = request.json.get('activity')
        amount = request.json.get('amount')
        new_tracking = Tracking(user_id=session['user_id'], activity=activity, amount=amount, date=datetime.utcnow())
        db.session.add(new_tracking)
        db.session.commit()
        return jsonify({'message': 'Tracking data saved!'})
    except Exception as e:
        return jsonify({'message': 'Error saving tracking data', 'error': str(e)}), 500

@app.route('/logout', methods=['POST'])
def logout():
    try:
        session.pop('user_id', None)
        return jsonify({'message': 'Logged out successfully!'})
    except Exception as e:
        return jsonify({'message': 'Error during logout', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)