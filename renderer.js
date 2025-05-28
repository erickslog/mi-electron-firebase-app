const qrcode = require('qrcode-generator');
document.addEventListener('DOMContentLoaded', () => {
    const createTicketButton = document.getElementById('create-ticket-button');
    const transactionStatusElement = document.getElementById('transaction-status');
    const ticketForm = document.getElementById('ticket-form');
    const loadingIndicator = document.getElementById('loading-indicator');
    const printTicketButton = document.getElementById('print-ticket-button');
    const errorMessageElement = document.getElementById('error-message');
    const submitButton = document.getElementById('create-ticket-button');

    function collectTicketData() {
        const selectedHours = [];
        document.querySelectorAll('#hours input[type="checkbox"]:checked').forEach(checkbox => {
            selectedHours.push(checkbox.value);
        });

        const selectedAnimals = [];
        const animalInputs = ticketForm.querySelectorAll('.animal-selection input[type="checkbox"]:checked'); // Assuming a class for animal checkboxes
        animalInputs.forEach(checkbox => { // This comment was on the wrong line in the original prompt, removing here
            selectedAnimals.push(checkbox.value);
        });

        const ticketData = {
            hours: selectedHours, // This comment was on the wrong line in the original prompt, removing here
            plays: [] // Array to store animal/bet combinations
        };

        // Capture bet amounts for selected animals
        selectedAnimals.forEach(animalNumber => {
            const betInput = document.getElementById(`bet-amount-${animalNumber}`); // Assuming input ID format
            if (betInput && betInput.value) {
                ticketData.plays.push({
                    animal: animalNumber, // This comment was on the wrong line in the original prompt, removing here
                    bet: parseFloat(betInput.value) // Convert bet to a number
                });
            }
        }); // This comment was on the wrong line in the original prompt, removing here
        return ticketData;
    }

    function validateTicketData(ticketData) {


        if (transactionStatusElement) transactionStatusElement.textContent = '';
        if (errorMessageElement) errorMessageElement.textContent = '';


        if (ticketData.hours.length === 0) {
             console.warn('Please select at least one hour.');
             if (errorMessageElement) errorMessageElement.textContent = 'Por favor, seleccione al menos una hora.';
             return false;
        }
         return true; // Validation passed
    }

    if (window.electronAPI && window.electronAPI.onTransactionResponse) {
        window.electronAPI.onTransactionResponse((event, response) => {
            console.log('Transaction Response Received:', response);


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
    if (createTicketButton && ticketForm) {
        createTicketButton.addEventListener('click', () => {
            const ticketData = collectTicketData();

            if (!validateTicketData(ticketData)) {
 return; // Stop if validation fails
            }


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

    async function handlePrintTicket(ticketId) {
        if (!window.electronAPI || !window.electronAPI.callCloudFunction) {
            console.error('La API de Electron para llamar a Cloud Functions no está disponible.');

            return;
        }

        try {

            const printDataResponse = await window.electronAPI.callCloudFunction('generatePrintData', { ticketId: ticketId });

            if (printDataResponse && printDataResponse.data) {
                const formattedPrintData = printDataResponse.data;

                console.log('Received formatted print data:', formattedPrintData);

                // Extract QR code data (assuming a label like "QR Code Data:")
                const qrCodeData = formattedPrintData.match(/QR Code Data: (.+)/)?.[1]?.trim() || null;

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
            }
        } catch (error) {
            console.error('Error calling generatePrintData Cloud Function:', error);
            // Display error message to the user
        }
    }
});