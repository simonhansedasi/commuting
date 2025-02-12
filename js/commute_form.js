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
        
        
    // Function to get the selected value of a radio button group

    function getSelectedRadioValue(name) {
        const selected = document.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : null;
    }
        
        
        const formData = {
            username: currentUser,
            start_time: document.getElementById('start_time').value,
            end_time: document.getElementById('end_time').value,
            transport_mode: document.getElementById('transport_mode').value,
            freeway: document.getElementById('freeway')?.value || null,
            lane: document.getElementById('lane')?.value || null,
            precipitation: getSelectedRadioValue('weather'), // New precipitation field
            conditions: getSelectedRadioValue('conditions') // New road condition field

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
    
    function displayDashboardResults(result) {
        const dashboardContent = document.getElementById('dashboardContent');
        dashboardContent.innerHTML = '';  // Clear previous content
        console.log('Received results:', result);

        // Display a single table with all conditions, weather, and CI values
        if (result.CIs) {
            dashboardContent.innerHTML += formatCommuteResults(result.CIs);
        }
    }
    
// Helper function to format commute results into a table (based on nested structure)
function formatCommuteResults(data) {
    let content = `<table><thead><tr>
                    <th>Transport Mode</th><th>Weather</th><th>Road Condition</th><th>Travel Time (minutes)</th></tr></thead><tbody>`;

// Loop through transport modes first
for (const mode in data) {
    // Loop through weather conditions within each transport mode
    for (const weather in data[mode]) {
        // Loop through road conditions within each weather condition
        for (const condition in data[mode][weather]) {
            const [time, err] = data[mode][weather][condition];
            content += `<tr>
                            <td><strong>${mode}</strong></td>
                            <td>${weather}</td>
                            <td>${condition}</td>
                            <td>${isNaN(time) ? 'no data' : formatNumber(time)} ± ${isNaN(err) ? '-' : formatNumber(err)}</td>
                        </tr>`;
        }
    }
}

    content += '</tbody></table>';
    return `<div class="table-container">${content}</div>`;
}

// Helper function to format numbers with 2 decimal places
function formatNumber(num) {
    return num.toFixed(2);
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
