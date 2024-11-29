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
  