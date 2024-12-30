fetchBaseUrl()
    .then(baseUrl => {
        fetch(`${baseUrl}/get_images`, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch images.');
            }
            return response.json();
        })
        .then(data => {
            console.log("Parsed JSON:", data);
            const dashboardDiv = document.querySelector('.all_users');
            data.images.forEach(imgUrl => {
                console.log("Appending image:", imgUrl);
                let img = document.createElement('img');
                img.src = imgUrl;
                dashboardDiv.appendChild(img);
            });
        })
        .catch(error => {
            console.error("Error fetching images:", error);
        });
    })
    .catch(error => {
        console.error('Failed to fetch base URL. Exiting...');
    });

// Fetch base URL from config.txt
function fetchBaseUrl() {
    return fetch('config.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch config.txt');
            }
            return response.text();
        })
        .then(url => url.trim())
        .catch(error => {
            console.error('Error fetching base URL:', error);
            alert('Failed to fetch base URL. Please contact support.');
            throw error;
        });
}
