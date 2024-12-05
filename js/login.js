document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;

    const submitButton = document.getElementById('submitButton');
    const returningUserSubmit = document.getElementById('returningUserSubmit');
    const generatePinButton = document.getElementById('generatePinButton');
    const responseMessage = document.getElementById('responseMessage');
    const commuteForm = document.getElementById('commuteForm');
    const userSection = document.getElementById('userSection');
    const newUserPinMessage = document.getElementById('newUserPinMessage');

    if (!returningUserSubmit || !generatePinButton || !responseMessage || !commuteForm || !userSection) {
        console.error('One or more required elements are missing.');
        return;
    }

    // Reset visibility
    commuteForm.style.display = 'none';
    responseMessage.innerText = '';
    newUserPinMessage.innerText = '';

    returningUserSubmit.addEventListener('click', async function () {
        const username = document.getElementById('returningUsernameInput').value.trim();
        const pin = document.getElementById('returningPinInput').value.trim();

        if (!username || !pin) {
            alert('Please enter both username and pin.');
            return;
        }

        try {
            const response = await fetch('https://e644-73-83-144-18.ngrok-free.app/verify_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin }),
            });

            const result = await response.json();

            if (response.ok) {
                currentUser = result.username;
                localStorage.setItem('currentUser', currentUser);

                responseMessage.innerText = `Welcome back, ${currentUser}!`;

                // Show commute form and hide login section
                userSection.style.display = 'none';
                commuteForm.style.display = 'block';
            } else {
                responseMessage.innerText = `Error: ${result.message}`;
            }
        } catch (error) {
            console.error('Error verifying user:', error);
            responseMessage.innerText = 'An unexpected error occurred. Please try again.';
        }
    });

    generatePinButton.addEventListener('click', async function () {
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

        const pin = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit pin

        try {
            const response = await fetch('https://e644-73-83-144-18.ngrok-free.app/register_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin, email, emailCheckbox }),
            });

            const result = await response.json();

            if (response.ok) {
                currentUser = result.username;
                localStorage.setItem('currentUser', result.username);

                newUserPinMessage.innerText = `Your pin is: ${pin}`;
                responseMessage.innerText = `User ${currentUser} registered successfully with pin: ${pin}`;

                // Show commute form and hide login section
                userSection.style.display = 'none';
                commuteForm.style.display = 'block';
            } else {
                responseMessage.innerText = `Error: ${result.message}`;
            }
        } catch (error) {
            console.error('Error registering user:', error);
            responseMessage.innerText = 'An unexpected error occurred. Please try again.';
        }
    });
});
