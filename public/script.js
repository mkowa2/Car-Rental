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



// document.addEventListener('click', (event) => {
//     if (event.target.classList.contains('rent-button')) {
//         event.preventDefault();
//
//         const vin = event.target.dataset.vin;
//
//         // Prompt for client's email
//         const clientEmail = prompt("Please enter your email to rent this car:");
//         if (!clientEmail) {
//             alert("Email is required to rent the car.");
//             return;
//         }
//
//         // Prompt for rental duration in days
//         const rentalDays = prompt("How many days would you like to rent this car for?");
//         const rentalDaysInt = parseInt(rentalDays, 10);
//
//         if (!rentalDays || isNaN(rentalDaysInt) || rentalDaysInt <= 0) {
//             alert("Please enter a valid number of rental days.");
//             return;
//         }
//
//         // Calculate the end date
//         const startDate = new Date();
//         const endDate = new Date(startDate);
//         endDate.setDate(startDate.getDate() + rentalDaysInt);
//
//         const rentalData = {
//             clientEmail: clientEmail,
//             vin: vin,
//             startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
//             endDate: endDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
//         };
//
//         console.log('Rental data being sent:', rentalData); // Debugging line
//
//         fetch('/api/rent-car', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(rentalData)
//         })
//             .then((response) => response.json())
//             .then((result) => {
//                 if (result.success) {
//                     alert('Car rented successfully!');
//                 } else {
//                     alert(`Failed to rent the car: ${result.error}`);
//                 }
//             })
//             .catch((error) => {
//                 console.error('Error renting car:', error);
//                 alert('An error occurred. Please try again later.');
//             });
//     }
// });

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('rent-car-modal');
  const closeModalButton = document.getElementById('close-modal');
  const rentCarForm = document.getElementById('rentCarForm');
  const rentCarButton = document.getElementById('rentCarButton');

  let selectedVIN = null; // To store the VIN of the selected car

  // Open the modal when a "Rent this car" button is clicked
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('rent-button')) {
      event.preventDefault();
      selectedVIN = event.target.dataset.vin; // Get the VIN of the selected car
      modal.style.display = 'flex';
    }
});
// Load the host's available cars
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
                `;

                carListDiv.appendChild(carCard);
            });
        })
        .catch((error) => {
            console.error('Error loading host cars:', error);
            document.getElementById('car-list').innerHTML = '<p>Error loading cars. Please try again later.</p>';
        });
}


  });

  // Close the modal
  closeModalButton.addEventListener('click', () => {
    modal.style.display = 'none';
    rentCarForm.reset();
  });

  // Handle form submission
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
                } else {
                    alert(`Failed to rent the car: ${result.error}`);
                }
            })
            .catch((error) => {
                console.error('Error renting car:', error);
                alert('An error occurred. Please try again later.');
            });
    }
);
// Load the host's available cars
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
                `;

                carListDiv.appendChild(carCard);
            });
        })
        .catch((error) => {
            console.error('Error loading host cars:', error);
            document.getElementById('car-list').innerHTML = '<p>Error loading cars. Please try again later.</p>';
        });
}


