import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
import commute_analysis as ca
from flask_mail import Mail, Message
import random
from dotenv import load_dotenv
import os




app = Flask(__name__)
CORS(app, support_credentials = True, resources={r'/*': {'origins': ['http://127.0.0.1:4000', 'https://92cc-73-83-144-18.ngrok-free.app','https://simonhansedasi.github.io']}})
# Load environment variables from .env file
load_dotenv()

email_username = os.getenv('EMAIL_USERNAME')
email_password = os.getenv('EMAIL_PASSWORD')

app.config['MAIL_USERNAME'] = email_username
app.config['MAIL_PASSWORD'] = email_password
# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True

mail = Mail(app)

# Initialize the database and ensure the users table exists
def init_users_db():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT UNIQUE,
            pin TEXT UNIQUE
        )
    ''')
    conn.commit()
    conn.close()
    
def init_db():
    '''Initialize the SQLite database and create a table if it doesn't exist.'''
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
        
        
        
def generate_pin():
    return str(random.randint(1000, 9999))



@app.route('/register_user', methods=['POST'])
def register_user():
    data = request.json
    print(data)
    username = data.get('username')
    pin = data.get('pin')
    email = data.get('email')  # Get the optional email
    emailCheckbox = data.get('emailCheckbox')

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    result = add_or_check_user(username, pin)
    
    if result['status'] == 'exists':
        return jsonify({'message': 'Username already exists. Please use the correct pin.'}), 400

    # If we reach here, the user was created successfully
    response_data = {'message': 'User created successfully', 'username': username, 'pin': result['pin']}

    # Send an email if the emailCheckbox is true and email is provided
    if emailCheckbox and email:
        # print('poopy')
        try:
            msg = Message(
                subject='Your Commute Tracker Credentials',
                sender=app.config['MAIL_USERNAME'],
                recipients=[email],
                body=f'Hello,\nHere are your credentials for the Commute Tracker Portal.\n\nUsername: {username},\nPin: {pin}\n\nHappy tracking!\n'
            )
            mail.send(msg)
            response_data['email_status'] = 'Email sent successfully'
        except Exception as e:
            response_data['email_status'] = f'Failed to send email: {str(e)}'
        print(response_data['email_status'])

    return jsonify(response_data), 201





@app.route('/')
def index():
    return render_template('index.html') 

@app.route('/verify_user', methods=['POST'])
def verify_user():
    data = request.json
    username = data.get('username')
    pin = data.get('pin')
    print(username)
    print(pin)
    if not username or not pin:
        return jsonify({'error': 'Username and pin are required'}), 400

    # Check if the username exists and the pin matches
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('SELECT pin FROM users WHERE username = ?', (username,))
    result = cursor.fetchone()
    conn.close()
    print(result)
    if result and result[0] == pin:
        return jsonify({'message': 'User verified successfully', 'username': username}), 200
    else:
        return jsonify({'error': 'Invalid username or pin'}), 400



# Add or check a user in the database
def add_or_check_user(username, pin):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()

    # Check if the username already exists
    cursor.execute('SELECT pin FROM users WHERE username = ?', (username,))
    result = cursor.fetchone()

    if result:
        # If the username exists, return the pin
        return {'status': 'exists', 'pin': result[0]}
    
    # If the username doesn't exist, create a new user with a generated pin
    # pin = generate_pin()
    cursor.execute('INSERT INTO users (username, pin) VALUES (?, ?)', (username, pin))
    conn.commit()

    conn.close()
    
    return {'status': 'created', 'pin': pin}
    
    
@app.route('/check_username', methods=['POST'])
def check_username():
    data = request.json
    username = data.get('username')
    pint = data.get('pin')

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    result, status_code = check_or_add_user(username, pin)
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
            
            
            
        # df = ca.get_data_from_db(username = username)
        with_rain, no_rain = ca.analyze_commute_data(username)
        rain_chart_path, no_rain_chart_path = ca.plot_pie(user = username)
        print(username, start_time, end_time, transport_mode, freeway, lane, raining, with_rain, no_rain, rain_chart_path, no_rain_chart_path)
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

    app.run(port = 5003)
