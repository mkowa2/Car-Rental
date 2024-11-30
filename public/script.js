// // Open Login Modal
// function openLoginModal() {
//     document.getElementById('login-modal').style.display = 'flex';
// }

// // Close Login Modal
// function closeLoginModal() {
//     document.getElementById('login-modal').style.display = 'none';
// }

// // Function to fetch car data from the API and display it
// function loadAvailableCars() {
//     fetch('/api/available-cars')
//       .then((response) => response.json())
//       .then((cars) => {
//         const carListDiv = document.getElementById('car-list');
  
//         if (cars.length === 0) {
//           carListDiv.innerHTML = '<p>No cars available at the moment.</p>';
//           return;
//         }
  
//         // Create a list to display the cars
//         const ul = document.createElement('ul');
  
//         cars.forEach((car) => {
//           const li = document.createElement('li');
  
//           li.innerHTML = `
//             <strong>${car.Make} ${car.Model} (${car.Year})</strong><br>
//             Daily Price: $${car.DailyPrice}<br>
//             <a href="/rent-car?vin=${car.VIN}">Rent this car</a>
//           `;
  
//           ul.appendChild(li);
//         });
  
//         carListDiv.appendChild(ul);
//       })
//       .catch((error) => {
//         console.error('Error fetching car data:', error);
//         const carListDiv = document.getElementById('car-list');
//         carListDiv.innerHTML = '<p>Error loading cars. Please try again later.</p>';
//       });
//   }
  
//   window.addEventListener('load', loadAvailableCars);
  