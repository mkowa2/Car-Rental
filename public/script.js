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
                loadHostCars();
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
                localStorage.setItem('hostEmail', data.email); // Save host email locally
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
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('rent-car-modal');
    const closeModalButton = document.getElementById('close-modal');
    const rentCarForm = document.getElementById('rentCarForm');
    const rentCarButton = document.getElementById('rentCarButton');
    const carListDiv = document.getElementById('car-list');

    let selectedVIN = null; // To store the VIN of the selected car

    // Open the modal when a "Rent this car" button is clicked
    carListDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('rent-button')) {
            event.preventDefault();
            selectedVIN = event.target.dataset.vin; // Get the VIN of the selected car
            modal.style.display = 'flex'; // Show the rent car modal
        }
    });

    // Close the modal
    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
        rentCarForm.reset();
    });

    // Handle form submission for renting the car
    rentCarForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const clientEmail = document.getElementById('clientEmail').value;
        const rentalDays = parseInt(document.getElementById('rentalDays').value, 10);

        if (!clientEmail || isNaN(rentalDays) || rentalDays <= 0) {
            alert('Please provide valid inputs.');
            return;
        }

        // Calculate the startDate and endDate
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + rentalDays);

        const rentalData = {
            clientEmail: clientEmail,
            vin: selectedVIN,
            startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            endDate: endDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
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
                    modal.style.display = 'none'; // Hide modal after successful rental
                    rentCarForm.reset();
                    location.reload(); // Reload the page after successful rental
                } else {
                    alert(`Failed to rent the car: ${result.error}`);
                }
            })
            .catch((error) => {
                console.error('Error renting car:', error);
                alert('An error occurred. Please try again later.');
            });
    });
});

function loadAvailableCars() {
    console.log('Fetching available cars...');
    fetch('/api/available-cars')
        .then((response) => response.json())
        .then((data) => {
            console.log('Available cars:', data);
            if (!data.success) {
                console.error(data.error || 'Failed to load cars.');
                return;
            }

            const carListDiv = document.getElementById('car-list');
            const cars = data.cars;

            if (cars.length === 0) {
                carListDiv.innerHTML = '<p>No cars available at the moment.</p>';
                return;
            }
            // Clear previous cars
            carListDiv.innerHTML = '';
            // Render each car
            cars.forEach((car) => {
                const carCard = document.createElement('div');
                carCard.classList.add('car-card');

                carCard.innerHTML = `
                    <h3>${car.Make} ${car.Model} (${car.Year})</h3>
                    <p>License Plate: ${car.LicensePlate}</p>
                    <p class="price">Daily Price: $${car.DailyPrice}</p>
                    <a href="#" class="rent-button" data-vin="${car.VIN}">Rent this car</a>
                `;

                carListDiv.appendChild(carCard);
            });
        })
        .catch((error) => {
            console.error('Error loading cars:', error);
            const carListDiv = document.getElementById('car-list');
            carListDiv.innerHTML = '<p>Error loading cars. Please try again later.</p>';
        });
}

window.addEventListener('load', loadAvailableCars);


function loadHostCars() {
    const hostEmail = localStorage.getItem('hostEmail'); // Retrieve email from localStorage
    if (!hostEmail) {
        alert('No host email found. Please log in again.');
        window.location.href = '/host-login'; // Redirect to login page
        return;
    }

    fetch(`/api/host-cars?email=${encodeURIComponent(hostEmail)}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) {
                alert(data.error || 'Failed to fetch host cars.');
                return;
            }

            const carListDiv = document.getElementById('car-list-host');
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
            document.getElementById('car-list-host').innerHTML = '<p>Error loading cars. Please try again later.</p>';
        });

        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-button')) {
                const vin = event.target.dataset.vin; // Retrieve VIN from data attribute
                deleteCar(vin);
            }
        });
}

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


document.addEventListener('DOMContentLoaded', () => {
    const fetchRentalsButton = document.getElementById('fetchRentalsButton');
    const rentalsListDiv = document.getElementById('rental-list');
    const clientEmailInput = document.getElementById('clientEmail'); // Get the email input field

    // Add event listener for "Fetch Rentals" button
    fetchRentalsButton.addEventListener('click', () => {
        const clientEmail = clientEmailInput.value.trim(); // Get the email value and remove extra spaces

        // Check if the email is provided
        if (!clientEmail) {
            alert('Please enter your email.');
            return;
        }

        // Call fetch rentals API with the client's email
        fetch(`/api/fetch-rentals?clientEmail=${encodeURIComponent(clientEmail)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const rentals = data.rentals;

                    if (rentals.length === 0) {
                        rentalsListDiv.innerHTML = '<p>No rentals found.</p>';
                        return;
                    }

                    rentalsListDiv.innerHTML = ''; // Clear any previous results

                    rentals.forEach(rental => {
                        const rentalCard = document.createElement('div');
                        rentalCard.classList.add('rental-card');

                        // Calculate the total price
                        const startDate = new Date(rental.StartDate);
                        const endDate = new Date(rental.EndDate);
                        const timeDiff = endDate - startDate; // Difference in milliseconds
                        const daysDiff = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days
                        const totalPrice = rental.DailyPrice * daysDiff; // Calculate total price

                        rentalCard.innerHTML = `
                            <h3>Car: ${rental.Make} ${rental.Model} (${rental.Year})</h3>
                            <p>Start Date: ${rental.StartDate}</p>
                            <p>End Date: ${rental.EndDate}</p>
                            <p>Total Price: $${totalPrice.toFixed(2)}</p> <!-- Display the total price -->
                            <button class="cancel-button" data-vin="${rental.VIN}">Cancel/Return</button>
                        `;
                        rentalsListDiv.appendChild(rentalCard);
                    });

                    // Handle cancel button clicks
                    document.querySelectorAll('.cancel-button').forEach(button => {
                        button.addEventListener('click', (event) => {
                            const vin = event.target.dataset.vin;
                            cancelRental(vin);
                        });
                    });

                } else {
                    alert('Error fetching rentals: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error fetching rentals:', error);
                alert('Failed to fetch rentals. Please try again later.');
            });
    });

    // Function to cancel a rental
    function cancelRental(vin) {
        const clientEmail = clientEmailInput.value.trim(); // Get the email value again

        if (!clientEmail) {
            alert('Please enter your email.');
            return;
        }

        if (!confirm('Are you sure you want to cancel/return this car?')) {
            return;
        }

        fetch('/api/cancel-rental', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vin, clientEmail }),
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('Rental cancelled/returned successfully!');
                    location.reload(); // Reload to update the rental list
                } else {
                    alert(`Failed to cancel/return rental: ${result.error}`);
                }
            })
            .catch(error => {
                console.error('Error cancelling rental:', error);
                alert('An error occurred. Please try again later.');
            });
    }
});