document.addEventListener('DOMContentLoaded', function () {
    // Retrieve the username from localStorage
    const currentUser = localStorage.getItem('currentUser');
    const commuteFormSection = document.getElementById('commuteFormSection');
    const loginSection = document.getElementById('loginSection');
    const commuteFormUsername = document.getElementById('commuteFormUsername');

    if (currentUser) {
        if (commuteFormUsername) {
            commuteFormUsername.innerText = `Welcome, ${currentUser}!`;
        }

        if (commuteFormSection) commuteFormSection.style.display = 'block';
        if (loginSection) loginSection.style.display = 'none';
    } else {
        alert('No user logged in. Please log in to access the commute form.');
        if (commuteFormSection) commuteFormSection.style.display = 'none';
        if (loginSection) loginSection.style.display = 'block';
    }

    // Transport options update
    const transportMode = document.getElementById("transport_mode");
    const freewayOptions = document.getElementById("freeway_options");
    const laneOptions = document.getElementById("lane_options");

    function updateTransportOptions() {
        if (!transportMode || !freewayOptions || !laneOptions) return;

        freewayOptions.style.display = "none";
        laneOptions.style.display = "none";

        if (transportMode.value === "car") {
            freewayOptions.style.display = "block";
        }

        const freeway = document.getElementById("freeway");
        if (freeway && freeway.value === "freeway") {
            laneOptions.style.display = "block";
        }
    }

    if (transportMode) {
        transportMode.addEventListener('change', updateTransportOptions);
    }

    // Handle form submission
    const commuteForm = document.getElementById('commuteForm');
    if (commuteForm) {
        commuteForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = {
                username: localStorage.getItem('currentUser'),
                start_time: document.getElementById('start_time')?.value,
                end_time: document.getElementById('end_time')?.value,
                transport_mode: transportMode?.value,
                freeway: document.getElementById('freeway')?.value,
                lane: document.getElementById('lane')?.value,
                raining: document.getElementById('raining')?.checked,
            };

            try {
                const response = await fetch('https://e644-73-83-144-18.ngrok-free.app/submit_commute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();
                if (response.ok) {
                    const dashboardContent = document.getElementById('dashboardContent');
                    if (dashboardContent) {
                        dashboardContent.innerHTML = ''; // Clear previous results

                        // Populate dashboard content with new results
                        if (result.with_rain) {
                            // Process with_rain content...
                        }

                        if (result.no_rain) {
                            // Process no_rain content...
                        }
                    }
                } else {
                    alert("Error submitting commute.");
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while submitting the commute form.');
            }
        });
    }
});

// Helper function to format numbers
function formatNumber(number) {
    return parseFloat(number).toFixed(0);
}
