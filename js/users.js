document.addEventListener('DOMContentLoaded', () => {
    const userIdInput = document.getElementById('userIdInput');
    const usernameInput = document.getElementById('usernameInput');
    const verifyButton = document.getElementById('verifyButton');
    const commuteForm = document.getElementById('commuteForm');
    const resultContainer = document.getElementById('resultContainer');

    if (!userIdInput || !usernameInput || !verifyButton || !commuteForm || !resultContainer) {
        console.error('One or more elements are missing in the DOM.');
        return;
    }

    // Reset the page state on load
    verifyButton.style.display = 'block';
    commuteForm.style.display = 'none';

    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        commuteForm.style.display = 'block';
        verifyButton.style.display = 'none';
        resultContainer.innerHTML = `<p>Welcome back, ${savedUsername}!</p>`;
    }

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
                const response = await fetch('https://e644-73-83-144-18.ngrok-free.app/verify_user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                verifyButton.style.display = 'none';
                resultContainer.innerHTML = `<p>Welcome back, ${result.username}!</p>`;
                usernameInput.value = result.username;
                localStorage.setItem('username', result.username);
                commuteForm.style.display = 'block';
            } else {
                // Register a new user
                const response = await fetch('https://e644-73-83-144-18.ngrok-free.app/check_username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                verifyButton.style.display = 'none';
                resultContainer.innerHTML = `<p>Username accepted! Your userID is: <strong>${result.user_id}</strong></p>`;
                usernameInput.value = username;
                localStorage.setItem('username', username);
                commuteForm.style.display = 'block';
            }
        } catch (error) {
            console.error('Fetch error:', error);
            resultContainer.innerHTML = `<p style="color: red;">An unexpected error occurred. Please try again later.</p>`;
        }
    });
});
