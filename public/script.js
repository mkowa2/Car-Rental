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

window.addEventListener('load', loadAvailableCars);


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
          modal.style.display = 'none';
          rentCarForm.reset();
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

document.addEventListener('DOMContentLoaded', () => {
    const fetchRentalsButton = document.getElementById('fetchRentalsButton');
    const clientEmailInput = document.getElementById('clientEmail');
    const rentalList = document.getElementById('rental-list');

    // Fetch rentals for the provided client email
    fetchRentalsButton.addEventListener('click', () => {
        const clientEmail = clientEmailInput.value.trim();

        if (!clientEmail) {
            alert('Please enter your email.');
            return;
        }

        fetch(`/api/client-rentals?email=${encodeURIComponent(clientEmail)}`)
            .then(response => response.json())
            .then(rentals => {
                displayRentals(rentals, clientEmail);
            })
            .catch(error => {
                console.error('Error fetching rentals:', error);
                alert('Failed to fetch rentals. Please try again later.');
            });
    });

    // Display the list of rentals
    function displayRentals(rentals, clientEmail) {
        if (rentals.length === 0) {
            rentalList.innerHTML = '<p>No active rentals found.</p>';
            return;
        }

        rentalList.innerHTML = ''; // Clear previous content

        rentals.forEach(rental => {
            const startDate = new Date(rental.StartDate);
            const endDate = new Date(rental.EndDate);

            // Calculate total cost
            const daysRented = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const totalCost = daysRented * rental.DailyPrice;

            const rentalCard = document.createElement('div');
            rentalCard.classList.add('rental-card');

            rentalCard.innerHTML = `
                <h3>${rental.Make} ${rental.Model} (${rental.Year})</h3>
                <p><strong>Start Date:</strong> ${rental.StartDate}</p>
                <p><strong>End Date:</strong> ${rental.EndDate}</p>
                <p><strong>Daily Price:</strong> $${rental.DailyPrice}</p>
                <p><strong>Total Cost:</strong> $${totalCost}</p>
                <button class="return-button" data-vin="${rental.VIN}" data-email="${clientEmail}">Return/Cancel</button>
            `;

            rentalList.appendChild(rentalCard);
        });
    }

    // Handle car return/cancellation
    rentalList.addEventListener('click', (event) => {
        if (event.target.classList.contains('return-button')) {
            const vin = event.target.dataset.vin;
            const clientEmail = event.target.dataset.email;

            fetch('/api/return-car', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vin, clientEmail })
            })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        alert('Car returned successfully!');
                        // Refresh the rentals list
                        fetchRentalsButton.click();
                    } else {
                        alert(`Failed to return car: ${result.error}`);
                    }
                })
                .catch(error => {
                    console.error('Error returning car:', error);
                    alert('An error occurred. Please try again later.');
                });
        }
    });
});