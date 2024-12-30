document.addEventListener('DOMContentLoaded', async function () {
    const baseUrl = await fetchBaseUrl();

    // Wait for the loginComplete event
    document.addEventListener('loginComplete', function () {
        const currentUser = localStorage.getItem('currentUser');
        const commuteFormUsername = document.getElementById('commuteFormUsername');
        const commuteForm = document.getElementById('commuteForm');
        if (currentUser) {
            console.log('User found:', currentUser);
            document.getElementById('commuteFormUsername').innerText = `Welcome, ${currentUser}!`;
        } else {
            console.log('No user logged in yet');
            document.getElementById('commuteFormSection').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
        }
    });

    // Update transport options based on selected mode
    document.getElementById("transport_mode").addEventListener('change', updateTransportOptions);

    function updateTransportOptions() {
        const transportMode = document.getElementById("transport_mode").value;
        const freewayOptions = document.getElementById("freeway_options");
        const laneOptions = document.getElementById("lane_options");

        freewayOptions.style.display = "none";
        laneOptions.style.display = "none";

        if (transportMode === "car") {
            freewayOptions.style.display = "block";
        }

        const freeway = document.getElementById("freeway");
        if (freeway && freeway.value === "freeway") {
            laneOptions.style.display = "block";
        }
    }

    // Handle form submission via AJAX
    document.getElementById('commuteForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const currentUser = localStorage.getItem('currentUser');
        console.log('Current User:', currentUser);

        const formData = {
            username: currentUser,
            start_time: document.getElementById('start_time').value,
            end_time: document.getElementById('end_time').value,
            transport_mode: document.getElementById('transport_mode').value,
            freeway: document.getElementById('freeway')?.value || null,
            lane: document.getElementById('lane')?.value || null,
            raining: document.getElementById('raining').checked
        };

        try {
            const response = await fetch(`${baseUrl}/submit_commute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            console.log('Response:', result);

            if (response.ok) {
                document.getElementById('submitButton').style.display = 'none';
                const dashboard = document.getElementById('dashboard');
                dashboard.style.display = 'block';
                displayDashboardResults(result);
            } else {
                alert("Error submitting commute.");
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while submitting the form.');
        }
    });

    // Helper to format and display results
    function displayDashboardResults(result) {
        const dashboardContent = document.getElementById('dashboardContent');
        dashboardContent.innerHTML = '';

        if (result.with_rain) {
            dashboardContent.innerHTML += formatCommuteResults(result.with_rain, "Avg Commute with Rain");
        }

        if (result.no_rain) {
            dashboardContent.innerHTML += formatCommuteResults(result.no_rain, "Avg Commute without Rain");
        }
    }

    function formatCommuteResults(data, title) {
        let content = `<h3>${title}</h3><ul>`;
        for (const [mode, [time, err]] of Object.entries(data)) {
            content += `<li><strong>${mode}:</strong> ${isNaN(time) ? 'no data' : formatNumber(time)} ± ${isNaN(err) ? '-' : formatNumber(err)} minutes</li>`;
        }
        content += '</ul>';
        return `<div class="table-container">${content}</div>`;
    }

    // Fetch base URL from config.txt
    async function fetchBaseUrl() {
        try {
            const response = await fetch('config.txt');
            if (!response.ok) throw new Error('Failed to fetch config.txt');
            return (await response.text()).trim();
        } catch (error) {
            console.error('Error fetching base URL:', error);
            alert('Could not load configuration. Please try again.');
            return '';
        }
    }

    // Format number to remove decimals
    function formatNumber(number) {
        return parseFloat(number).toFixed(0);
    }
});
