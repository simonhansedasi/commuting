document.addEventListener('DOMContentLoaded', async () => {
    let currentUser = null;

    const elements = {
        submitButton: document.getElementById('submitButton'),
        returningUserSubmit: document.getElementById('returningUserSubmit'),
        generatePinButton: document.getElementById('generatePinButton'),
        responseMessage: document.getElementById('responseMessage'),
        commuteForm: document.getElementById('commuteForm'),
        userSection: document.getElementById('userSection'),
        newUserPinMessage: document.getElementById('newUserPinMessage')
    };

    if (Object.values(elements).some(el => !el)) {
        console.error('One or more required elements are missing.');
        return;
    }

    // Reset visibility
    elements.commuteForm.style.display = 'none';
    elements.responseMessage.innerText = '';
    elements.newUserPinMessage.innerText = '';

    const baseUrl = await fetchBaseUrl();

    elements.returningUserSubmit.addEventListener('click', async () => {
        const username = document.getElementById('returningUsernameInput').value.trim();
        const pin = document.getElementById('returningPinInput').value.trim();

        if (!username || !pin) {
            alert('Please enter both username and pin.');
            return;
        }

        await handleUserLogin(username, pin, baseUrl);
    });

    elements.generatePinButton.addEventListener('click', async () => {
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

        const pin = Math.floor(1000 + Math.random() * 9000);
        await handleUserRegistration(username, pin, email, emailCheckbox, baseUrl);
    });
});

// Fetch base URL from config.txt
async function fetchBaseUrl() {
    try {
        const response = await fetch('config.txt');
        if (!response.ok) throw new Error('Failed to fetch config.txt');
        return response.text().then(url => url.trim());
    } catch (error) {
        console.error('Error fetching base URL:', error);
        alert('Failed to fetch base URL. Please contact support.');
        throw error;
    }
}

async function handleUserLogin(username, pin, baseUrl) {
    const responseMessage = document.getElementById('responseMessage');
    const userSection = document.getElementById('userSection');
    const commuteForm = document.getElementById('commuteForm');

    try {
        const response = await fetch(`${baseUrl}/verify_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pin })
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('currentUser', result.username);
            userSection.style.display = 'none';
            commuteForm.style.display = 'block';
            document.dispatchEvent(new Event('loginComplete'));
        } else {
            responseMessage.innerText = `Error: ${result.message}`;
        }
    } catch (error) {
        console.error('Error verifying user:', error);
        responseMessage.innerText = 'An unexpected error occurred. Please try again.';
    }
}

async function handleUserRegistration(username, pin, email, emailCheckbox, baseUrl) {
    const newUserPinMessage = document.getElementById('newUserPinMessage');
    const responseMessage = document.getElementById('responseMessage');
    const userSection = document.getElementById('userSection');
    const commuteForm = document.getElementById('commuteForm');

    try {
        const response = await fetch(`${baseUrl}/register_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pin, email, emailCheckbox })
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('currentUser', result.username);
            newUserPinMessage.innerText = `Your pin is: ${pin}`;
            responseMessage.innerText = `User ${result.username} registered successfully.`;
            userSection.style.display = 'none';
            commuteForm.style.display = 'block';
            document.dispatchEvent(new Event('loginComplete'));
        } else {
            responseMessage.innerText = `Error: ${result.message}`;
        }
    } catch (error) {
        console.error('Error registering user:', error);
        responseMessage.innerText = 'An unexpected error occurred. Please try again.';
    }
}
