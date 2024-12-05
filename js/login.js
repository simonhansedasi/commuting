
let currentUser = null;


document.getElementById('returningUserSubmit').addEventListener('click', async function() {
    const username = document.getElementById('returningUsernameInput').value.trim();
    const pin = document.getElementById('returningPinInput').value.trim();

    if (!username || !pin) {
        alert('Please enter both username and pin.');
        return;
    }

    // Perform validation (e.g., check if the username and pin exist)
    const response = await fetch('https://f301-73-83-144-18.ngrok-free.app/verify_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin })
    });

    const result = await response.json();
    if (response.ok) {
        currentUser = result.username;

        localStorage.setItem('currentUser', result.username);

        document.getElementById('responseMessage').innerText = `Welcome back, ${currentUser}!`;

        // Hide the login form and show the commute form
        document.getElementById('userSection').style.display = 'none';
        document.getElementById('commuteForm').style.display = 'block';
    } else {
        document.getElementById('responseMessage').innerText = `Error: ${result.message}`;
    }
});

document.getElementById('generatePinButton').addEventListener('click', async function() {
    const username = document.getElementById('newUsernameInput').value.trim();
    const emailCheckbox = document.getElementById('emailCheckbox').checked;
    const email = document.getElementById('emailInput').value.trim();
    if (!username) {
        alert('Please enter a username.');
        return;
    }
    if (emailCheckbox && !email) {
        alert('Please enter your email address to receive your username and PIN.');
        return;
    }
    // Generate a random 4-digit pin
    const pin = Math.floor(1000 + Math.random() * 9000);

    // Send the new user information along with the generated pin
    const response = await fetch('https://f301-73-83-144-18.ngrok-free.app/register_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin, email, emailCheckbox })
    });

    const result = await response.json();
    if (response.ok) {
        currentUser = result.username;
        localStorage.setItem('currentUser', result.username);

        document.getElementById('newUserPinMessage').innerText = `Your pin is: ${pin}`;
        document.getElementById('responseMessage').innerText = `User ${currentUser} registered successfully with pin: ${pin}`;
        // Hide the login form and show the commute form
        document.getElementById('userSection').style.display = 'none';
        document.getElementById('commuteForm').style.display = 'block';
    } else {
        document.getElementById('responseMessage').innerText = `Error: ${result.message}`;
    }
});
