const userIdInput = document.getElementById('userIdInput');
const usernameInput = document.getElementById('usernameInput');
const verifyButton = document.getElementById('verifyButton');
const commuteForm = document.getElementById('commuteForm');
const resultContainer = document.getElementById('resultContainer');

verifyButton.addEventListener('click', async () => {
    const userId = userIdInput.value.trim();
    const username = usernameInput.value.trim();

    if (!userId && !username) {
        alert('Please enter either a UserID or a Username.');
        return;
    }

    try {
        if (userId) {
            // Verify existing user
            const response = await fetch('https://f301-73-83-144-18.ngrok-free.app/verify_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            const result = await response.json();
            if (response.ok) {
              document.getElementById('verifyButton').style.display = 'none';

                resultContainer.innerHTML = `
                    <p>Welcome back, ${result.username}!</p>
                `;
                usernameInput.value = result.username; // Populate the username input field with the verified username
                commuteForm.style.display = 'block';
                submitButton.style.display = 'block'; // Show the submit button


            } else {
                resultContainer.innerHTML = `<p style="color: red;">Error: ${result.message}</p>`;
            }
        } else {
            // Register a new user
            const response = await fetch('https://f301-73-83-144-18.ngrok-free.app/check_username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const result = await response.json();
            if (response.ok) {
              document.getElementById('verifyButton').style.display = 'none';

                resultContainer.innerHTML = `
                    <p>Username accepted! Your userID is: <strong>${result.user_id}</strong></p>
                `;
                usernameInput.value = username; // Populate the username field in the form
                commuteForm.style.display = 'block'; // Show the commute form
                submitButton.style.display = 'block'; // Show the submit button
            } else {
                resultContainer.innerHTML = `<p style="color: red;">Error: ${result.message}</p>`;
            }
        }
    } catch (error) {
        console.error('Error:', error);
        resultContainer.innerHTML = `<p>An unexpected error occurred.</p>`;
    }
});