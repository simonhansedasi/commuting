    document.getElementById('usernameForm').addEventListener('submit', async function (e) {
        e.preventDefault();  // Prevent the default form submission

        const username = document.getElementById('username').value;

        // Send the username to the backend for validation
        const response = await fetch('http://127.0.0.1:5000/check_username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });

        const result = await response.json();

        if (response.ok) {
            // Display the success message (e.g., new userID)
            document.getElementById('responseMessage').innerText = 'Username accepted! Your userID is: ' + result.user_id;
        } else {
            // Display error message if the username is taken
            document.getElementById('responseMessage').innerText = 'Error: ' + result.message;
        }
    });