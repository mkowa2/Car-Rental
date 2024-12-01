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
  });
  
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
});

  