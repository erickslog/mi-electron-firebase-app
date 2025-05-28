document.addEventListener('DOMContentLoaded', () => {
    const registrationFormDiv = document.getElementById('registration-form');
    const showRegistrationButton = document.getElementById('show-registration-form'); // Assuming you give your button/link this ID
    const hideRegistrationButton = registrationFormDiv.querySelector('.hide-registration-form'); // Assuming you give your hide button/link this class

    // Function to show the registration form
    function showRegistrationForm() {
        registrationFormDiv.style.display = 'block'; // Or 'flex', 'grid', depending on your CSS
    }

    // Function to hide the registration form
    function hideRegistrationForm() {
        registrationFormDiv.style.display = 'none';
    }

    // Listen for registration response from the main process
    if (window.electronAPI) {
        window.electronAPI.onRegistrationResponse((event, response) => {
            if (response.success) {
                console.log('Registration successful:', response.data);
                alert('Registration successful!'); // Or display in a dedicated element
            } else {
                console.error('Registration error:', response.message);
                alert('Registration failed: ' + response.message); // Or display in a dedicated element
            }
        });
    }

    // Event listener to show the registration form
    if (showRegistrationButton) {
        showRegistrationButton.addEventListener('click', showRegistrationForm);
    }

    // Event listener to hide the registration form
    if (hideRegistrationButton) {
        hideRegistrationButton.addEventListener('click', hideRegistrationForm);
    }

    const loginForm = document.querySelector('#login-form'); // Assuming your login form has this ID
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission
            console.log('Login form submitted');

            const email = loginForm.elements['email'].value; // Assuming input has name="email"
            const password = loginForm.elements['password'].value; // Assuming input has name="password"

            // Send login credentials to the main process via IPC
            if (window.electronAPI) {
                window.electronAPI.sendLogin({ email, password });
            } else {
                console.error('electronAPI is not available.');
            }
        });
    }

    // Listen for login response from the main process
    if (window.electronAPI) {
        window.electronAPI.onLoginResponse((event, response) => {
            console.log('Login response from main process:', response);
            if (response.success) {
                console.log('User logged in:', response.user);
                // Redirect or update UI upon successful login
                window.location.href = 'front.html'; // Redirect to front.html
            } else {
                const errorMessage = response.message;
                console.error('Login error:', errorMessage);
                alert('Login failed: ' + errorMessage); // Or display in a dedicated element with id 'error-message'
            }
        });
    }


    // Placeholder function for handling registration form submission
    const registrationForm = registrationFormDiv.querySelector('form'); // Assuming the form is a direct child
     if (registrationForm) {
        registrationForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission
            console.log('Registration form submitted');
            // Add your registration logic here (e.g., collect form data, call Cloud Function)

            const agencyName = registrationForm.elements['agencyName'].value; // Assuming input has name="agencyName"
            const ownerName = registrationForm.elements['ownerName'].value; // Assuming input has name="ownerName"
            const ownerEmail = registrationForm.elements['ownerEmail'].value; // Assuming input has name="ownerEmail"
            const password = registrationForm.elements['regPassword'].value; // Assuming input has name="regPassword"
            const taxId = registrationForm.elements['taxId'].value; // Assuming input has name="taxId"
            const address = registrationForm.elements['address'].value; // Assuming input has name="address"
            const phone = registrationForm.elements['phone'].value; // Assuming input has name="phone"

            const registrationData = {
                agencyName: agencyName,
                ownerName: ownerName,
                ownerEmail: ownerEmail,
                password: password, // Note: Passwords should be handled securely, ideally not sent directly like this for registration. Consider Firebase Authentication or server-side hashing.
                taxId: taxId,
                address: address,
                phone: phone
            };

            // Send registration data to the main process via IPC
            if (window.electronAPI) {
                window.electronAPI.sendRegistration(registrationData);
            } else {
                console.error('electronAPI is not available.');
            }
        });
    }
});