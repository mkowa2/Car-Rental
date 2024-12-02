document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('postCarForm');
    const addButton = document.getElementById('addButton');
    const inputs = form.querySelectorAll('input[required]');

    const checkInputs = () => {
        let allFilled = true;
        inputs.forEach(input => {
            if (input.value.trim() === '') {
                allFilled = false;
            }
        });
        addButton.disabled = !allFilled;
    };

    inputs.forEach(input => {
        input.addEventListener('input', checkInputs);
    });

    document.getElementById('cancelButton').addEventListener('click', () => {
        form.reset();
        addButton.disabled = true;
    });

    // Add Event Listener for Add Button
    // addButton.addEventListener('click', addCar);
    addButton.addEventListener('click', (event) => {
    console.log('Add button clicked'); // Debugging
    addCar(event);
});
});


function addCar(event) {
    event.preventDefault(); // Prevent form submission from reloading the page

    const carData = {
        vin: document.getElementById('carVIN').value,
        make: document.getElementById('carBrand').value,
        model: document.getElementById('carModel').value,
        year: document.getElementById('carYear').value,
        licensePlate: document.getElementById('carLicense').value,
        dailyPrice: document.getElementById('carPrice').value,
        ownerEmail: document.getElementById('ownerEmail').value,
    };

    fetch('/api/add-car', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(carData),
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                alert(result.message);
                document.getElementById('postCarForm').reset();
                document.getElementById('addButton').disabled = true;
                // Reload available cars after adding a new one
                loadAvailableCars();
                window.location.href = '/host-homepage';

            } else {
                alert(`Error: ${result.error}`);
            }
        })
        .catch((error) => {
            console.error('Error adding car:', error);
            alert('An error occurred. Please try again later.');
        });
}
  
// Open Login Modal
function openLoginModal() {
    document.getElementById('login-modal').style.display = 'flex';
}

// Close Login Modal
function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

//Function that redirects to host hompage after login
function loginHost(email, password) {
    fetch('/host-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                localStorage.setItem('hostEmail', data.email);
                alert(data.message);
                window.location.href = data.redirectUrl; // Redirect to host homepage
            } else {
                alert(`Login failed: ${data.error}`);
            }
        })
        .catch((error) => {
            console.error('Error logging in:', error);
            alert('An error occurred. Please try again later.');
        });
}



// Function to fetch car data from the API and display it
function loadAvailableCars() {
    fetch('/api/available-cars')
        .then((response) => response.json())
        .then((cars) => {
            const carListDiv = document.getElementById('car-list');

            if (cars.length === 0) {
                carListDiv.innerHTML = '<p>No cars available at the moment.</p>';
                return;
            }

            // Clear any existing cars
            carListDiv.innerHTML = '';

            cars.forEach((car) => {
                // Create the car card
                const carCard = document.createElement('div');
                carCard.classList.add('car-card');

                carCard.innerHTML = `
                    <h3>${car.Make} ${car.Model} (${car.Year})</h3>
                    <p>License Plate: ${car.LicensePlate}</p>
                    <p class="price">Daily Price: $${car.DailyPrice}</p>
                    <a href="#" class="rent-button" data-vin="${car.VIN}">Rent this car</a>
                `;

                // Append the car card to the car list
                carListDiv.appendChild(carCard);
            });
        })
        .catch((error) => {
            console.error('Error fetching car data:', error);
            const carListDiv = document.getElementById('car-list');
            carListDiv.innerHTML = '<p>Error loading cars. Please try again later.</p>';
        });
}




document.addEventListener('click', (event) => {
    if (event.target.classList.contains('rent-button')) {
        event.preventDefault();

        // console.log(req.session.clientEmail)

        const vin = event.target.dataset.vin;

        const rentalData = {
            clientEmail: 'aamirkmerchant@gmail.com', // @TODO Replace with actual user email from session
            vin: vin,
            startDate: new Date().toISOString().split('T')[0], // Today's date
            endDate: '2024-12-05' // Example end date
        };

        console.log('Rental data being sent:', rentalData); // Debugging line

        fetch('/api/rent-car', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rentalData)
        })
            .then((response) => response.json())
            .then((result) => {
                if (result.success) {
                    alert('Car rented successfully!');
                } else {
                    alert(`Failed to rent the car: ${result.error}`);
                }
            })
            .catch((error) => {
                console.error('Error renting car:', error);
                alert('An error occurred. Please try again later.');
            });
    }
    if (event.target.classList.contains('delete-button')) {
        const vin = event.target.dataset.vin; 
        //TODO IMPLEMENT DELETE FUNCTION
        deleteCar(vin);
    }
});


// Load the host's available cars
function loadHostCars() {
    const hostEmail = localStorage.getItem('hostEmail'); // Retrieve host email from localStorage
    if (!hostEmail) {
        alert('No host email found. Please log in again.');
        window.location.href = '/host-login'; // Redirect to login page
        return;
    }

    // Fetch cars for the host using the email
    fetch(`/api/host-cars?email=${encodeURIComponent(hostEmail)}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) {
                alert(data.error || 'Failed to fetch host cars.');
                return;
            }

            const carListDiv = document.getElementById('car-list');
            const cars = data.cars;

            if (cars.length === 0) {
                carListDiv.innerHTML = '<p>No cars available for this host.</p>';
                return;
            }

            carListDiv.innerHTML = ''; // Clear existing content

            cars.forEach((car) => {
                const carCard = document.createElement('div');
                carCard.classList.add('car-card');

                carCard.innerHTML = `
                    <h3>${car.Make} ${car.Model} (${car.Year})</h3>
                    <p>License Plate: ${car.LicensePlate}</p>
                    <p class="price">Daily Price: $${car.DailyPrice}</p>
                    <button class="delete-button" data-vin="${car.VIN}">Delete</button>

                `;
                carListDiv.appendChild(carCard);
            });
        })
        .catch((error) => {
            console.error('Error loading host cars:', error);
            const carListDiv = document.getElementById('car-list');
            carListDiv.innerHTML = '<p>Error loading cars. Please try again later.</p>';
        });
}

//Delete a car from the host's list
function deleteCar(vin) {
    if (!confirm('Are you sure you want to delete this car?')) {
        return; // Exit if the user cancels
    }

    fetch(`/api/delete-car`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vin }), // Pass the VIN to the backend
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                alert(result.message);
                loadHostCars(); // Reload the list of cars after deletion
            } else {
                alert(`Error: ${result.error}`);
            }
        })
        .catch((error) => {
            console.error('Error deleting car:', error);
            alert('An error occurred. Please try again later.');
        });
}


