from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/submit_commute', methods=['POST'])
def submit_commute():
    try:
        # Parse the incoming JSON request
        data = request.get_json()  # Get the JSON data sent in the request body

        # Ensure the required fields are in the request
        if not data or 'start_time' not in data or 'end_time' not in data or 'transport_mode' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        # Extract values from the form data
        start_time = data['start_time']
        end_time = data['end_time']
        transport_mode = data['transport_mode']
        freeway = data.get('freeway', None)  # Optional field
        lane = data.get('lane', None)        # Optional field
        raining = data.get('raining', False) # Optional field
        
        
        print('poopy butts)
        
        
        # Handle the data (process, store, etc.)
        # For now, just returning the data as confirmation
        return jsonify({
            'start_time': start_time,
            'end_time': end_time,
            'transport_mode': transport_mode,
            'freeway': freeway,
            'lane': lane,
            'raining': raining
        })

    except Exception as e:
        # If an error occurs, return a 400 status with the error message
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
