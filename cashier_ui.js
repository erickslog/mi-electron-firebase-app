import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentTicket = []; // Local data structure for the current ticket
let activeBettingHouses = []; // To store fetched betting houses
let selectedBettingHouse = null;
let selectedModality = 'animalito'; // Default
let selectedDrawTimes = [];

const loteriasTabsContainer = document.getElementById('loterias-tabs');
const modalidadTabsContainer = document.getElementById('modalidad-tabs');
const gridContainer = document.getElementById('grid-container');
const keypadContainer = document.getElementById('keypad-container');
const playSearchInput = document.getElementById('play-search-input');
const playInputValue = document.getElementById('play-input-value'); // Assuming you have this input to show selected/processed play
const drawTimesContainer = document.getElementById('draw-times-container');
const amountInput = document.getElementById('amount-input');
const currencySelect = document.getElementById('currency-select');
const addPlayButton = document.getElementById('add-play-button');
const ticketPlaysList = document.getElementById('ticket-plays-list');
const totalBsDisplay = document.getElementById('total-bs');
const totalUsdDisplay = document.getElementById('total-usd');
const generateTicketButton = document.getElementById('generate-ticket-button');
const clearTicketButton = document.getElementById('clear-ticket-button');
const payPrizeButton = document.getElementById('pay-prize-button');
// Assuming you have elements for the pay prize modal and its inputs/buttons as in front.html mockup
const payPrizeModal = document.getElementById('payPrizeModal');
const closePayPrizeModal = document.getElementById('closePayPrizeModal');
const ticketNumberInput = document.getElementById('ticketNumberInput');
const checkTicketButton = document.getElementById('checkTicketButton');
const confirmPaymentButton = document.getElementById('confirmPaymentButton');
const prizeDetailsDiv = document.getElementById('prizeDetails');

// Mock animal names (you might fetch this based on betting house later)
const animalitosNombres = ["Delfín", "Ballena", "Carnero", "Ciempies", "Alacrán", "Rana", "Perico", "Ratón", "Águila", "Tigre",
    "Gato", "Caballo", "Mono", "Paloma", "Zorro", "Oso", "Pavo", "Burro", "Chivo", "Cochino",
    "Gallo", "Perro", "Camello", "Zebra", "Iguana", "Gallina", "Vaca", "Caimán", "Zamuro", "Elefante",
    "Culebra", "Lapa", "Ardilla", "Pescado", "Venado", "Jirafa", "Cabra", "Toro" // 00 a 37
];

/**
 * On startup, retrieve active betting houses and their draws from Firestore,
 * and populate the tabs and time selectors.
 */
async function loadBettingHousesAndDraws() {
    try {
        const querySnapshot = await getDocs(collection(db, "bettingHouses"));
        activeBettingHouses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Populate lottery tabs
        loteriasTabsContainer.innerHTML = '';
        activeBettingHouses.forEach((house, index) => {
            const tab = document.createElement('button');
            tab.classList.add('tab-button');
            tab.textContent = house.name;
            tab.dataset.houseId = house.id;
            if (index === 0) {
                tab.classList.add('active');
                selectedBettingHouse = house;
            }
            tab.addEventListener('click', () => switchBettingHouse(house, tab));
            loteriasTabsContainer.appendChild(tab);
        });

        // Initialize modalities and play area for the first betting house
        if (selectedBettingHouse) {
            updateModalidadTabs();
            renderPlayInputArea(selectedBettingHouse, selectedModality);
            loadDrawTimes(selectedBettingHouse);
        }

    } catch (error) {
        console.error("Error loading betting houses:", error);
        // Display an error message to the user
    }
}

function updateModalidadTabs() {
    modalidadTabsContainer.innerHTML = '';
    const modalities = ['Animalito'];
    if (selectedBettingHouse && selectedBettingHouse.gameTypes && selectedBettingHouse.gameTypes.includes('triples')) {
        modalities.push('Triple', 'Tripleta');
    }

    modalities.forEach((modalidad, index) => {
        const tab = document.createElement('button');
        tab.classList.add('tab-button');
        tab.textContent = modalidad;
        tab.dataset.modalidad = modalidad.toLowerCase();
        if ((selectedModality === modalidad.toLowerCase()) || (index === 0 && !modalities.some(m => selectedModality === m.toLowerCase()))) {
             tab.classList.add('active');
             if(index === 0 && !modalities.some(m => selectedModality === m.toLowerCase())) selectedModality = modalidad.toLowerCase();
        }
        tab.addEventListener('click', () => switchModality(modalidad.toLowerCase(), tab));
        modalidadTabsContainer.appendChild(tab);
    });
}

function switchBettingHouse(house, tabElement) {
    selectedBettingHouse = house;
    document.querySelectorAll('#loterias-tabs .tab-button').forEach(t => t.classList.remove('active'));
    tabElement.classList.add('active');
    selectedModality = house.gameTypes.includes('animalitos') ? 'animalito' : 'triple'; // Default to animalito or triple based on house capability
    updateModalidadTabs();
    renderPlayInputArea(selectedBettingHouse, selectedModality);
    loadDrawTimes(selectedBettingHouse);
    clearSelection();
}

function switchModality(modalidad, tabElement) {
    selectedModality = modalidad;
    document.querySelectorAll('#modalidad-tabs .tab-button').forEach(t => t.classList.remove('active'));
    tabElement.classList.add('active');
    renderPlayInputArea(selectedBettingHouse, selectedModality);
    clearSelection();
}

function clearSelection() {
    selectedPlayValue = '';
    playInputValue.value = '';
    playSearchInput.value = '';
    document.querySelectorAll('.grid-item.selected, .keypad-button.selected').forEach(el => el.classList.remove('selected'));
}

/**
 * Dynamically change the #grid-container to display the animal grid or the numeric keypad.
 * @param {object} selectedHouse - The selected betting house object.
 * @param {string} selectedModality - The selected modality ('animalito', 'triple', 'tripleta').
 */
function renderPlayInputArea(selectedHouse, selectedModality) {
    gridContainer.innerHTML = '';
    keypadContainer.innerHTML = '';
    playSearchInput.placeholder = selectedModality === 'animalito' ? "Buscar animalito o ingresar comando..." : "Ingresar número o comando...";

    if (selectedModality === 'animalito' && selectedHouse && selectedHouse.gameTypes && selectedHouse.gameTypes.includes('animalitos')) {
        gridContainer.style.display = 'grid';
        keypadContainer.style.display = 'none';
        const limit = selectedHouse.numberRangeEnd !== undefined ? selectedHouse.numberRangeEnd + 1 : 38; // Default to 38 if range not specified
        for (let i = 0; i < limit; i++) {
            const item = document.createElement('div');
            item.classList.add('grid-item');
            const numStr = i.toString().padStart(2, '0');
            item.textContent = `${numStr} - ${animalitosNombres[i] || ''}`; // Use mock names, or fetch real ones
            item.dataset.value = numStr;
            item.addEventListener('click', () => selectPlayItem(item, numStr));
            gridContainer.appendChild(item);
        }
    } else if (selectedModality === 'triple' || selectedModality === 'tripleta') {
        gridContainer.style.display = 'none';
        keypadContainer.style.display = 'grid';
        createKeypad();
    } else {
         gridContainer.style.display = 'none';
         keypadContainer.style.display = 'none';
    }
}

function createKeypad() {
    keypadContainer.innerHTML = '';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Borrar', '0', 'OK'].forEach(key => {
        const button = document.createElement('button');
        button.classList.add('keypad-button');
        button.textContent = key;
        if (key === 'Borrar') {
            button.addEventListener('click', () => {
                playSearchInput.value = playSearchInput.value.slice(0, -1);
                handlePlayInputCommand(); // Process the input change
            });
        } else if (key === 'OK') {
             button.classList.add('double-width');
             button.addEventListener('click', () => {
                // Handle OK - could trigger command processing or value confirmation
                 handlePlayInputCommand();
            });
        } else {
            button.addEventListener('click', () => {
                playSearchInput.value += key;
                 handlePlayInputCommand(); // Process the input change
            });
        }
        keypadContainer.appendChild(button);
    });
}

function selectPlayItem(element, value) {
    document.querySelectorAll('.grid-item.selected').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedPlayValue = value;
    playInputValue.value = `${value} - ${animalitosNombres[parseInt(value)] || ''}`; // Display selected value with name
    playSearchInput.value = ''; // Clear search input after selection
}

function loadDrawTimes(selectedHouse) {
    drawTimesContainer.innerHTML = '';
    selectedDrawTimes = [];
    if (selectedHouse && selectedHouse.draws) {
        selectedHouse.draws.forEach(time => {
            const btn = document.createElement('button');
            btn.classList.add('draw-time-button');
            btn.textContent = time;
            btn.dataset.time = time;
            btn.addEventListener('click', () => toggleDrawTime(btn, time));
            drawTimesContainer.appendChild(btn);
        });
    }
}

function toggleDrawTime(button, time) {
    button.classList.toggle('selected');
    if (selectedDrawTimes.includes(time)) {
        selectedDrawTimes = selectedDrawTimes.filter(t => t !== time);
    } else {
        selectedDrawTimes.push(time);
    }
}

/**
 * On the input or keyup event of the #play-input field, detect prefixes ('P', 'S', 'T').
 * Validate the input. Show visual feedback. Calculate expanded combinations.
 */
function handlePlayInputCommand() {
    const input = playSearchInput.value.trim();
    playInputValue.value = ''; // Clear previous feedback/selection display

    if (!input) {
        // If input is empty, show animal grid if modality is animalito
        if (selectedModality === 'animalito' && selectedBettingHouse && selectedBettingHouse.gameTypes.includes('animalitos')) {
             document.querySelectorAll('.grid-item').forEach(item => item.style.display = '');
        }
        return;
    }

    // Simple search for animalitos
    if (selectedModality === 'animalito' && selectedBettingHouse && selectedBettingHouse.gameTypes.includes('animalitos')) {
        document.querySelectorAll('.grid-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(input.toLowerCase()) ? '' : 'none';
        });
    }

    // Command detection (P, S, T)
    if (input.startsWith('P') && input.length > 1) { // Permuta
        const number = input.substring(1);
        // TODO: Validate number and calculate permutations
        playInputValue.value = `Permuta: ${number}`; // Show feedback
        selectedPlayValue = { type: 'permuta', value: number }; // Store command details
    } else if (input.startsWith('S') && input.includes('-')) { // Serie
        const range = input.substring(1).split('-');
        // TODO: Validate range and calculate series
        playInputValue.value = `Serie: ${input.substring(1)}`; // Show feedback
        selectedPlayValue = { type: 'serie', value: input.substring(1) }; // Store command details
    } else if (input.startsWith('T') && input.length > 1) { // Terminal
        const terminal = input.substring(1);
        // TODO: Validate terminal (2 digits)
        playInputValue.value = `Terminal: ${terminal}`; // Show feedback
        selectedPlayValue = { type: 'terminal', value: terminal }; // Store command details
    } else if (selectedModality === 'triple' && /^\d{1,3}$/.test(input)) { // Triple or Tripleta numeric input
         playInputValue.value = input;
         selectedPlayValue = { type: selectedModality, value: input };
    } else if (selectedModality === 'tripleta' && /^\d{1,3}$/.test(input)) { // Tripleta numeric input
         playInputValue.value = input;
         selectedPlayValue = { type: selectedModality, value: input };
    }
}

/**
 * Handles the click event on the 'Generate Ticket' button.
 * When 'ADD' is pressed, retrieve the data from the configuration panel and the play
 * (simple or expanded). and add it to a local data structure representing the current ticket.
 * Update the display in #ticket-plays-list and the totals.
 */
function addPlayToCurrentTicket() {
    const amount = parseFloat(amountInput.value);
    const currency = currencySelect.value;
    const playDetails = selectedPlayValue; // Use the stored selected value/command object

    if (!selectedBettingHouse || selectedDrawTimes.length === 0 || !playDetails || isNaN(amount) || amount <= 0) {
        alert('Por favor, complete todos los campos: Lotería, Modalidad, Horario(s), Jugada y Monto válido.');
        return;
    }

    // TODO: Expand commands (P, S, T) into individual plays if necessary based on type
    // For now, just add the selected play value as is

    selectedDrawTimes.forEach(time => {
        const play = {
            id: Date.now() + Math.random(), // Simple unique ID
            bettingHouseId: selectedBettingHouse.id,
            bettingHouseName: selectedBettingHouse.name,
            modality: selectedModality,
            drawTime: time,
            play: typeof playDetails === 'object' ? playDetails.value : playDetails, // Store the value/command
            playType: typeof playDetails === 'object' ? playDetails.type : 'simple', // Store the type (simple, permuta, serie, terminal)
            amount: amount,
            currency: currency
        };
        currentTicket.push(play);
    });

    renderTicket();
    // Clear selection and amount after adding
    clearSelection();
    amountInput.value = '';
    selectedDrawTimes = []; // Clear selected draw times visually and in array
    document.querySelectorAll('.draw-time-button.selected').forEach(btn => btn.classList.remove('selected'));

}

/**
 * Handles the click event on the 'Clear All' button.
 * @param {Event} event - The click event.
 */
function handleClearAll(event) {
    console.log('Clear All button clicked.');
    // TODO: Implement logic to clear the current ticket
    // Clear the list/array of plays
    // Clear the ticket plays list UI (#ticket-plays-list)
    // Reset the totals to 0
}

/**
 * Handles the click event on the 'Pay Prize' button.
 * @param {Event} event - The click event.
 */
function handlePayPrize(event) {
    console.log('Pay Prize button clicked.');
    // TODO: Implement logic to handle prize payment
    // Open a modal or section to enter the ticket number
    // When the user submits the ticket number, send it to the main process/backend to verify and pay
    // Handle the response (e.g., display prize amount, confirm payment)
}

// Add event listener for the 'Add to Play' button
document.addEventListener('DOMContentLoaded', () => {
    const addPlayButton = document.getElementById('add-play-button');
    if (addPlayButton) {
        addPlayButton.addEventListener('click', handleAddPlay);
    }

    // You'll need to add event listeners for other interactive elements here
    // e.g., lottery tabs, modality tabs, play input, generate ticket button, clear all button, pay prize button
});