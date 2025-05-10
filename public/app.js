// Handle registration form submission
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Please enter both a username and a password.');
        return;
    }

    try {
        console.log('Registering user:', username);
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const message = await response.text();
        alert(message);

        if (response.ok) {
            console.log('Registration successful');
            window.location.href = 'login.html';
        } else {
            console.error('Registration failed:', message);
        }
    } catch (error) {
        console.error('Registration Error:', error);
        alert('An error occurred while registering. Please try again.');
    }
});

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessageElement = document.getElementById('error-message');

    try {
        console.log('Attempting login for user:', username);
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            console.log('Login successful');
            window.location.href = 'home.html';
        } else {
            const error = await response.text();
            console.error('Login failed:', error);
            errorMessageElement.textContent = error;
            errorMessageElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Login Error:', error);
        errorMessageElement.textContent = 'An error occurred during login. Please try again.';
        errorMessageElement.style.display = 'block';
    }
});
// Handle logout process
function logoutUser() {
    console.log('Logging out the user...');
    
    // Clear localStorage or sessionStorage (if you use it to store login tokens)
    localStorage.removeItem('authToken'); // Replace 'authToken' with your token key
    sessionStorage.clear();

    // If using cookies, clear them as well
    document.cookie = 'authToken=; Max-Age=0; path=/;';

    // Optional: Make an API call to invalidate the session on the server (if applicable)
    fetch('/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Include credentials for server-side session invalidation
    })
    .then(response => {
        if (response.ok) {
            console.log('Server session invalidated');
        } else {
            console.error('Failed to invalidate server session');
        }
    })
    .catch(error => console.error('Logout error:', error));

    // Redirect to logout page
    window.location.href = 'logout.html';
}

// Store submitted items and markers
let submittedItems = [];
const markers = {}; // Dictionary to store markers with custom IDs

// Initialize the Leaflet map
let map; // Declare globally
if (window.location.pathname.endsWith('map.html')) {
    map = L.map('map').setView([53.6100, -6.1900], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Load items from the server and populate markers
    async function loadMarkers() {
        try {
            const response = await fetch('/items');
            if (!response.ok) throw new Error('Failed to load items');

            const items = await response.json();
            console.log('Items loaded:', items);

            submittedItems = items;

            items.forEach((item, index) => {
                console.log('Item security questions:', item.securityQuestions);

                // Create and add marker to the map
                const marker = L.marker([item.latitude, item.longitude]).addTo(map);

                // Store marker using index as the key
                markers[index] = marker;

                // Bind popup with claim button
                marker.bindPopup(`
                    <strong>${item.name}</strong><br>
                    ${item.description}<br>
                    <button onclick="showQuestions(${item.latitude}, ${item.longitude}, ${index})">Claim Item</button>
                `);
            });
        } catch (error) {
            console.error('Error loading markers:', error);
        }
    }

    loadMarkers();
}

// Function to show security questions and handle item claiming
window.showQuestions = async function (lat, lng, markerIndex) {
    console.log('Attempting to claim item at:', lat, lng);

    const item = submittedItems.find(item => item.latitude === lat && item.longitude === lng);

    if (!item || !item.securityQuestions || item.securityQuestions.length === 0) {
        alert('Security questions not found for this item.');
        console.error('Item or security questions not found:', item);
        return;
    }

    console.log('Security questions found:', item.securityQuestions);

    let allCorrect = true;

    // Loop through each security question and display using prompt
    for (let i = 0; i < item.securityQuestions.length; i++) {
        const { question, answer } = item.securityQuestions[i];
        console.log(`Question: ${question}, Expected Answer: ${answer}`);

        const userAnswer = prompt(question);
        console.log(`User Answer: ${userAnswer}`);

        if (!userAnswer || userAnswer.toLowerCase() !== answer.toLowerCase()) {
            allCorrect = false;
            console.log('Answer incorrect or not provided');
            break;
        }
    }

    if (allCorrect) {
        alert(`Correct! You can contact the owner at: ${item.phone_number}`);
        sendNotification('Item Claimed', `The item "${item.name}" has been claimed.`);

        // Send a request to delete the item from the database
        try {
            const response = await fetch(`/delete-item/${item.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Item successfully claimed and removed from the database.');

                // Remove the marker from the map
                const marker = markers[markerIndex];
                if (marker) {
                    map.removeLayer(marker);
                    console.log('Marker removed successfully:', marker);
                } else {
                    console.error('Marker to remove not found!');
                }

                // Remove the item from the local array
                submittedItems = submittedItems.filter(i => i !== item);
                console.log('Item claimed and marker removed:', item);
            } else {
                console.error('Failed to delete item from the database');
                alert('Failed to delete item from the database. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('An error occurred while deleting the item. Please try again.');
        }
    } else {
        alert('Incorrect answers. Please try again.');
        console.log('Incorrect answers for item:', item);
    }
};


// Handle item submission form
document.getElementById('itemForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemName = document.getElementById('itemName').value;
    const description = document.getElementById('description').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const location = document.getElementById('location').value;
    const category = document.getElementById('category').value; // Get the selected category
    const [lat, lng] = location.split(',').map(Number);

    const securityQuestions = [
        { question: document.getElementById('question1').value, answer: document.getElementById('answer1').value },
        { question: document.getElementById('question2').value, answer: document.getElementById('answer2').value },
        { question: document.getElementById('question3').value, answer: document.getElementById('answer3').value }
    ];

    try {
        const response = await fetch('/submit-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemName, description, lat, lng, phoneNumber, category, securityQuestions })
        });

        if (response.ok) {
            alert('Item submitted successfully!');
            e.target.reset();
        } else {
            alert('Error submitting item. Please try again.');
            console.error('Error submitting item:', response);
        }
    } catch (error) {
        console.error('Item Submission Error:', error);
        alert('An error occurred while submitting the item. Please try again.');
    }
});

// Handle location search
document.getElementById('searchButton')?.addEventListener('click', async () => {
    const query = document.getElementById('locationSearch').value.trim();
    if (!query) {
        alert('Please enter a location to search.');
        return;
    }

    try {
        console.log('Searching for location:', query);
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=pk.eyJ1IjoiY2xpbnRvbm9qbyIsImEiOiJjbTNlb3gzbWQwZmE2MndzODE2ZG40b2Y4In0.EMPasr1jAk9hXuvaNZgLUA`);
        const data = await response.json();

        if (data.features.length === 0) {
            alert('Location not found. Please try a different search term.');
            console.error('Location not found for query:', query);
            return;
        }

        const [lng, lat] = data.features[0].geometry.coordinates;
        document.getElementById('location').value = `${lat}, ${lng}`;
        alert(`Coordinates for ${query}: Latitude: ${lat}, Longitude: ${lng}`);
        console.log('Location found:', { lat, lng });
    } catch (error) {
        console.error('Geocoding Error:', error);
        alert('An error occurred while searching for the location. Please try again.');
    }
});



// Notification handling
if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}

function sendNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

