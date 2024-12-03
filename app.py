import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
import commute_analysis as ca
# from flask_sqlalchemy import SQLAlchemy
import random


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:4000"}})



# Initialize the database and ensure the users table exists
def init_users_db():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT UNIQUE,
            user_id TEXT UNIQUE
        )
    ''')
    conn.commit()
    conn.close()
    
def init_db():
    """Initialize the SQLite database and create a table if it doesn't exist."""
    with sqlite3.connect('commute_data.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS commute (
                username TEXT NOT NULL,
                session_number INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                transport_mode TEXT NOT NULL,
                freeway TEXT,
                lane TEXT,
                raining BOOLEAN NOT NULL,
                PRIMARY KEY (username, session_number)
            )
        ''')
        conn.commit()
        
        
        
# Generate a new user ID
def generate_user_id(username):
    import random
    random_number = random.randint(100, 999)
    return f"{username}{random_number}"



@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    result = add_or_check_user(username)
    if result['status'] == 'exists':
        return jsonify({'error': 'Username already exists. Please provide the correct user ID.'}), 400
    else:
        return jsonify({'message': 'User created successfully', 'user_id': result['user_id']}), 201




@app.route('/')
def index():
    return render_template('index.html') 

@app.route('/verify_user', methods=['POST'])
def verify_user():
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'UserID is required'}), 400

    # Check if the userID exists in the database
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('SELECT username FROM users WHERE user_id = ?', (user_id,))
    result = cursor.fetchone()
    conn.close()

    if result:
        return jsonify({'message': 'User verified', 'username': result[0]}), 200
    else:
        return jsonify({'message': 'Invalid UserID. Please check or register again.'}), 400


# Add or check a user in the database
def check_or_add_user(username):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()

    # Check if the username exists
    cursor.execute('SELECT user_id FROM users WHERE username = ?', (username,))
    result = cursor.fetchone()

    if result:
        # Username exists, return an error
        conn.close()
        return {'status': 'exists', 'message': 'Username already taken. Please choose another one.'}, 400
    else:
        # Generate a new user ID
        new_user_id = f"{username}{random.randint(100, 999)}"
        cursor.execute('INSERT INTO users (username, user_id) VALUES (?, ?)', (username, new_user_id))
        conn.commit()
        conn.close()
        print(new_user_id)
        return {'status': 'created', 'user_id': new_user_id}, 200
    
    
@app.route('/check_username', methods=['POST'])
def check_username():
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    result, status_code = check_or_add_user(username)
    print(result)
    return jsonify(result), status_code
    

@app.route('/submit_commute', methods=['POST'])
def submit_commute():
    try:
        # Parse the incoming JSON request
        data = request.get_json()  # Get the JSON data sent in the request body

        # Ensure the required fields are in the request
        if not data or 'username' not in data or 'start_time' not in data or 'end_time' not in data or 'transport_mode' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        # Extract values from the form data
        username = data['username']
        start_time = data['start_time']
        end_time = data['end_time']
        transport_mode = data['transport_mode']
        freeway = data.get('freeway', None)  # Optional field
        lane = data.get('lane', None)        # Optional field
        raining = data.get('raining', False) # Optional field
        
        
        
        
        
        
        with sqlite3.connect('commute_data.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT MAX(session_number) FROM commute WHERE username = ?
            ''', (username,))
            result = cursor.fetchone()
            next_session_number = (result[0] or 0) + 1  # Increment the last session number, or start at 1
            
            
        with sqlite3.connect('commute_data.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO commute (username, session_number, start_time, end_time, transport_mode, freeway, lane, raining)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (username, next_session_number, start_time, end_time, transport_mode, freeway, lane, raining))
            conn.commit()
            
            
            
        df = ca.get_data_from_db(username = username)
        with_rain, no_rain = ca.analyze_commute_data(username)
        rain_chart_path, no_rain_chart_path = ca.plot_pie(user = username)
        return (jsonify({
            'username':username,
            'start_time': start_time,
            'end_time': end_time,
            'transport_mode': transport_mode,
            'freeway': freeway,
            'lane': lane,
            'raining': raining,
            'with_rain':with_rain,
            'no_rain': no_rain,
            'with_rain_chart': rain_chart_path,
            'no_rain_chart': no_rain_chart_path       
        }))

    except Exception as e:
        # If an error occurs, return a 400 status with the error message
        return jsonify({'error': str(e)}), 400
    
    

    
    
    

if __name__ == '__main__':
    init_db()
    init_users_db()

    app.run(debug=True)
