document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const createTicketButton = document.getElementById('create-ticket-button');
    const usuarioInput = document.getElementById('usuario');
    const emailInput = document.getElementById('email'); // Assuming the input for email has id="email"
    const loginSection = document.getElementById('login-section'); // Assuming the login section has id="login-section"
    const appSection = document.getElementById('app-section'); // Assuming the main app section has id="app-section"
    const passwordInput = document.getElementById('password'); // Assuming the input for password has id="password"
    const numeroTaquillaInput = document.getElementById('numero-taquilla');
    const statusElement = document.getElementById('firebase-status');
    const transactionStatusElement = document.getElementById('transaction-status'); // Element to display transaction status
    const ticketForm = document.getElementById('ticket-form'); // Assuming your form has this ID
    const loadingIndicator = document.getElementById('loading-indicator'); // Assuming loading indicator element ID
    const printTicketButton = document.getElementById('print-ticket-button'); // Assuming a print button with this ID
    const errorMessageElement = document.getElementById('error-message'); // Assuming error message element ID
    const submitButton = document.getElementById('create-ticket-button'); // Assuming your submit button has this ID
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const usuario = usuarioInput.value;

            // Get email and password from the form
            const email = emailInput.value;
            const password = passwordInput.value;

            // Basic validation
            if (!email || !password) {
                statusElement.textContent = 'Por favor, complete todos los campos.';
                statusElement.style.color = 'orange';
                return; // Detiene el envío si hay campos vacíos
            }

            statusElement.textContent = '';

            if (!window.electronAPI || !window.electronAPI.signInWithEmailAndPassword) {
                console.error('La API de Electron no está disponible en window.electronAPI.');
                statusElement.textContent = 'Error interno de la aplicación.';
                statusElement.style.color = 'red';
            }
        });
    } else {
        console.error('Botón de login no encontrado.');
    }

    // Manejar la respuesta del proceso principal usando la API expuesta en preload.js
    // This part will be handled by the response from signInWithEmailAndPassword directly, not a separate IPC channel for the response.
    // The signInWithEmailAndPassword function exposed in preload.js will likely return a Promise.

    // Add a general handler for authentication state changes if needed, but for initial login, the promise response is sufficient.

    if (loginButton) {
        loginButton.addEventListener('click', async () => { // Make the event listener async
            const email = emailInput.value;
            const password = passwordInput.value;

            statusElement.textContent = ''; // Clear previous messages

            try {
                const userCredential = await window.electronAPI.signInWithEmailAndPassword(email, password);
                statusElement.textContent = 'Inicio de sesión exitoso.';
                statusElement.style.color = 'green';
                console.log('Inicio de sesión exitoso:', userCredential.user.uid); // Log user UID (non-sensitive)

                // Fetch user role from Firestore
                try {
                    if (window.electronAPI && window.electronAPI.getUserRole) {
                        const userRole = await window.electronAPI.getUserRole(userCredential.user.uid);
                        console.log('User Role:', userRole);

                        // Implement role-based UI logic
                        if (loginSection && appSection) {
                            loginSection.style.display = 'none'; // Hide login form
                            appSection.style.display = 'block'; // Show main application content

                            // Example: Show/hide elements based on role
                            if (userRole === 'super_admin' || userRole === 'agency_admin') {
                                // Show admin-specific elements (assuming they have class 'admin-only')
                                document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
                            } else if (userRole === 'ticket_clerk') {
                                // Show ticket clerk specific elements
                                // Hide admin elements
                                document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
                            }
                            // Add more role-based logic as needed
                        }
                    } else {
                        console.error('La API de Electron para getUserRole no está disponible.');
                    }
                } catch (roleError) {
                    console.error('Error fetching user role:', roleError);
                    statusElement.textContent = `Error al obtener el rol del usuario: ${roleError.message}`;
                    statusElement.style.color = 'red';
                }
            } catch (error) {
                statusElement.textContent = `Error de inicio de sesión: ${error.message}`;
                statusElement.style.color = 'red';
                console.error('Error de inicio de sesión:', error);
            }
        });
    }

    // Handle response from the main process for ticket transaction
    if (window.electronAPI && window.electronAPI.onTransactionResponse) {
        window.electronAPI.onTransactionResponse((event, response) => {
            console.log('Transaction Response Received:', response);

            // Hide loading indicator and re-enable submit button
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (submitButton) submitButton.disabled = false;

            if (response.success) {
                transactionStatusElement.textContent = 'Transacción exitosa!';
                transactionStatusElement.style.color = 'green';
            } else {
                transactionStatusElement.textContent = `Error en la transacción: ${response.message}`;
                transactionStatusElement.style.color = 'red';
            }
        });
    }
    // Logic to capture and send ticket data
    if (createTicketButton && ticketForm) {
        createTicketButton.addEventListener('click', () => {
            const selectedHours = [];
            document.querySelectorAll('#hours input[type="checkbox"]:checked').forEach(checkbox => {
                selectedHours.push(checkbox.value);
            });

            const selectedAnimals = [];
            const animalInputs = ticketForm.querySelectorAll('.animal-selection input[type="checkbox"]:checked'); // Assuming a class for animal checkboxes
            animalInputs.forEach(checkbox => {
                selectedAnimals.push(checkbox.value);
            });

            const ticketData = {
                hours: selectedHours,
                plays: [] // Array to store animal/bet combinations
            };

            // Capture bet amounts for selected animals
            selectedAnimals.forEach(animalNumber => {
                const betInput = document.getElementById(`bet-amount-${animalNumber}`); // Assuming input ID format
                if (betInput && betInput.value) {
                    ticketData.plays.push({
                        animal: animalNumber,
                        bet: parseFloat(betInput.value) // Convert bet to a number
                    });
                }
            });

            // Clear previous status messages
            if (transactionStatusElement) transactionStatusElement.textContent = '';
            if (errorMessageElement) errorMessageElement.textContent = '';

            // Basic validation for ticket data
            if (selectedHours.length === 0) {
                 console.warn('Please select at least one hour.');
                 if (errorMessageElement) errorMessageElement.textContent = 'Por favor, seleccione al menos una hora.';
                 return;
            }
             if (ticketData.plays.length === 0) {
                 console.warn('Please select at least one animal and enter a bet amount.');
                 if (errorMessageElement) errorMessageElement.textContent = 'Por favor, seleccione al menos un animal e introduzca un importe de apuesta.';
                 return;
             }

            // Show loading indicator and disable submit button
            if (loadingIndicator) loadingIndicator.style.display = 'block';
            if (submitButton) submitButton.disabled = true;

            // Send ticketData to the main process using the API exposed in preload.js
            if (window.electronAPI && window.electronAPI.sendTicketData) {
                window.electronAPI.sendTicketData(ticketData);
                console.log('Ticket Data Sent:', ticketData);
                if (transactionStatusElement) transactionStatusElement.textContent = 'Enviando transacción...';
            } else {
                console.error('La API de Electron para sendTicketData no está disponible.');
            }
        });
    }

    // Function to call the generatePrintData Cloud Function and handle printing
    async function handlePrintTicket(ticketId) {
        if (!window.electronAPI || !window.electronAPI.callCloudFunction) {
            console.error('La API de Electron para llamar a Cloud Functions no está disponible.');
            // Display error message to the user
            return;
        }

        try {
            // Call the generatePrintData Cloud Function
            const printDataResponse = await window.electronAPI.callCloudFunction('generatePrintData', { ticketId: ticketId });

            if (printDataResponse && printDataResponse.data) {
                const formattedPrintData = printDataResponse.data;
                console.log('Received formatted print data:', formattedPrintData);

                // Extract QR code data (assuming a label like "QR Code Data:")
                const qrCodeDataMatch = formattedPrintData.match(/QR Code Data: (.+)/);
                const qrCodeData = qrCodeDataMatch ? qrCodeDataMatch[1].trim() : null;

                if (qrCodeData) {
                    // Use qrcode-generator to generate a QR code
                    const typeNumber = 4; // Adjust based on the size of data and desired QR code density
                    const errorCorrectionLevel = 'L'; // L, M, Q, H
                    const qr = qrcode(typeNumber, errorCorrectionLevel);
                    qr.addData(qrCodeData);
                    qr.make();

                    const qrCodeDataURL = qr.createDataURL(); // Get the QR code as a data URL
                    console.log('Generated QR Code Data URL:', qrCodeDataURL);

                    // TODO: Implement logic to send formattedPrintData and qrCodeDataURL to the POS printer
                    console.warn('Placeholder: Send formattedPrintData and qrCodeDataURL to the POS printer.');
                } else {
                    console.warn('QR Code Data not found in the formatted print data.');
                }
            } else {
                console.error('Failed to get formatted print data from Cloud Function.');
                // Display error message to the user
            }
        } catch (error) {
            console.error('Error calling generatePrintData Cloud Function:', error);
            // Display error message to the user
        }
    }

    // Example of how you might call handlePrintTicket after a successful transaction
    // You would likely call this function after you receive the ticketId from the submitTicket response.
    // For demonstration purposes, let's add an event listener to a hypothetical print button.
    if (printTicketButton) {
        printTicketButton.addEventListener('click', () => {
            // Replace 'YOUR_RECENT_TICKET_ID' with the actual ticket ID from your submitTicket response
            const lastSuccessfulTicketId = 'YOUR_RECENT_TICKET_ID'; // You'll need to store this after submitTicket success
            if (lastSuccessfulTicketId !== 'YOUR_RECENT_TICKET_ID') {
                handlePrintTicket(lastSuccessfulTicketId);
            } else {
                console.warn('No recent ticket ID available to print.');
                // Inform the user they need to submit a ticket first
            }
        });
    }
});