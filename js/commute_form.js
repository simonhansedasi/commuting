document.addEventListener('DOMContentLoaded', function () {
    // Wait for the loginComplete event
    document.addEventListener('loginComplete', function () {
        const currentUser = localStorage.getItem('currentUser');
        const commuteFormUsername = document.getElementById('commuteFormUsername');
        const commuteForm = document.getElementById('commuteForm');
        if (currentUser) {
            console.log('User found:', currentUser);
            // Display the username in the commute form
            document.getElementById('commuteFormUsername').innerText = `Welcome, ${currentUser}!`;

            // Ensure the commute form section is visible
            // document.getElementById('commuteFormSection').style.display = 'block';
            // document.getElementById('loginSection').style.display = 'none';
        } else {
            console.log('No user logged in yet');
            // Show login section if no user found
            document.getElementById('commuteFormSection').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
        }
    });
});
console.log('Poooooooopppppp')
// console.log('User found:', currentUser);



// Handle the transport options based on selected transport mode
function updateTransportOptions() {
    const transportMode = document.getElementById("transport_mode").value;
    const freewayOptions = document.getElementById("freeway_options");
    const laneOptions = document.getElementById("lane_options");

    // Initially hide both freeway options and lane options
    freewayOptions.style.display = "none";
    laneOptions.style.display = "none";

    if (transportMode === "car") {
        freewayOptions.style.display = "block"; // Show freeway options
    }

    const freeway = document.getElementById("freeway");
    if (freeway && freeway.value === "freeway") {
        laneOptions.style.display = "block"; // Show lane options if Freeway selected
    }
}

// Handle form submission via JavaScript (AJAX request)
document.getElementById('commuteForm').addEventListener('submit', async function(e) {
    e.preventDefault();  // Prevent default form submission
    // console.log('Current User:', currentUser);  // Add this line to debug
    const currentUser = localStorage.getItem('currentUser');
    console.log('Current User:', currentUser); 
    // Collect the form data
    const formData = {
        username: currentUser,  // Use the username from the input field
        start_time: document.getElementById('start_time').value,
        end_time: document.getElementById('end_time').value,
        transport_mode: document.getElementById('transport_mode').value,
        freeway: document.getElementById('freeway') ? document.getElementById('freeway').value : null,
        lane: document.getElementById('lane') ? document.getElementById('lane').value : null,
        raining: document.getElementById('raining').checked
    };

    try {
        // Send form data to Flask backend via POST request
        const response = await fetch('https://d3a5-73-83-144-18.ngrok-free.app/submit_commute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        console.log('Response received:', response);  // Log the response object

        const result = await response.json();
        console.log('Response JSON:', result);  // Log the result JSON

        if (response.ok) {
            document.getElementById('submitButton').style.display = 'none'; 

            // Successfully submitted, update the dashboard with the results
            const dashboard = document.getElementById('dashboard');
            dashboard.style.display = 'block'; // Show the dashboard

            const dashboardContent = document.getElementById('dashboardContent');


            // Display the with_rain dictionary (Formatted)
            if (typeof result.with_rain === 'object') {
                console.log(result.with_rain);

                let withRainContent = '<h3> Avg Commute with Rain</h3><ul>';
                for (const [mode, values] of Object.entries(result.with_rain)) {
                    const [time, err] = values;

                    // Check if time and err are valid numbers
                    if (!isNaN(parseFloat(time)) && !isNaN(parseFloat(err))) {
                        withRainContent += `<li><strong>${mode}:</strong> ${formatNumber(time)} \u00B1 ${formatNumber(err)} minutes</li>`;
                    } else {
                        // Handle cases where time or err is '-'
                        withRainContent += `<li><strong>${mode}:</strong> no data</li>`;
                    }
                }
                withRainContent += '</ul>';
                dashboardContent.innerHTML += `<div class="table-container">${withRainContent}</div>`;
            }

            if (typeof result.no_rain === 'object') {
                console.log(result.no_rain);

                let withNoRainContent = '<h3>Avg Commute with no Rain</h3><ul>';
                for (const [mode, values] of Object.entries(result.no_rain)) {
                    const [time, err] = values;

                    // Check if time and err are valid numbers
                    if (!isNaN(parseFloat(time)) && !isNaN(parseFloat(err))) {
                        withNoRainContent += `<li><strong>${mode}:</strong> ${formatNumber(time)} \u00B1 ${formatNumber(err)} minutes</li>`;
                    } else {
                        // Handle cases where time or err is '-'
                        withNoRainContent += `<li><strong>${mode}:</strong> no data</li>`;
                    }
                }
                withNoRainContent += '</ul>';
                dashboardContent.innerHTML += `<div class="table-container">${withNoRainContent}</div>`;
            }


            /*

            // Load and display the chart images
            const chartWithRainImage = document.createElement('img');
            chartWithRainImage.src = result.with_rain_chart;  // Image path for with rain chart
            chartWithRainImage.alt = "Commute with Rain Chart";
            chartWithRainImage.style.maxWidth = '500px';  // Optional styling
            chartWithRainImage.onload = function() {
                dashboardContent.appendChild(chartWithRainImage); // Append chart image once it's loaded
            };

            const chartNoRainImage = document.createElement('img');
            chartNoRainImage.src = result.no_rain_chart;  // Image path for no rain chart
            chartNoRainImage.alt = "Commute without Rain Chart";
            chartNoRainImage.style.maxWidth = '500px';  // Optional styling
            chartNoRainImage.onload = function() {
                dashboardContent.appendChild(chartNoRainImage); // Append chart image once it's loaded
            };
            */
        } else {
            alert("Error submitting commute.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting the commute form.');
    }
});

// Helper function to format numbers with commas replaced by periods
function formatNumber(number) {
    return parseFloat(number).toFixed(0);  // Limit to 2 decimal places
}
