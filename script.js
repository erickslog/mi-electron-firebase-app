// Lógica de JavaScript para la Maqueta
document.addEventListener('DOMContentLoaded', () => { 
    // Mock data
    const loteriasData = [
        { id: 'lotto_activo', name: 'Lotto Activo', gameType: 'animalitos', numberRangeEnd: 37, draws: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'] },
        { id: 'la_granjita', name: 'La Granjita', gameType: 'animalitos', numberRangeEnd: 37, draws: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'guacharo_activo', name: 'Guácharo Activo', gameType: 'animalitos', numberRangeEnd: 100, draws: ['10:30', '13:30', '16:30', '19:30'] },
        { id: 'zulia_millonario', name: 'Zulia Millonario', gameType: 'triples', numberRangeEnd: 999, draws: ['12:45', '16:45', '19:00'] }
    ];

    const tabButtons = document.querySelectorAll('.tabs .tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the parent container of the clicked tab (either left-panel or right-panel)
            const parentTabs = button.closest('.tabs');

            // Remove 'active' class from all buttons in the same container
            parentTabs.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add 'active' class to the clicked button
            button.classList.add('active');

            // TODO: Add logic here to show/hide content areas based on the active tab
        });
    });


    const animalitosNombres = [ // Solo hasta 38 para Lotto Activo/Granjita
        "Delfín", "Ballena", "Carnero", "Ciempies", "Alacrán", "Rana", "Perico", "Ratón", "Águila", "Tigre",
        "Gato", "Caballo", "Mono", "Paloma", "Zorro", "Oso", "Pavo", "Burro", "Chivo", "Cochino",
        "Gallo", "Perro", "Camello", "Zebra", "Iguana", "Gallina", "Vaca", "Caimán", "Zamuro", "Elefante",
        "Culebra", "Lapa", "Ardilla", "Pescado", "Venado", "Jirafa", "Cabra", "Toro" //00 a 37
    ];


    const loteriasTabsContainer = document.getElementById('loterias-tabs');
    const modalidadTabsContainer = document.getElementById('modalidad-tabs');
    const gridContainer = document.getElementById('grid-container');
    const keypadContainer = document.getElementById('keypad-container');
    const playSearchInput = document.getElementById('play-search-input');
    const playInputValue = document.getElementById('play-input-value');
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
    const payPrizeModal = document.getElementById('payPrizeModal');
    const closePayPrizeModal = document.getElementById('closePayPrizeModal');
    const ticketNumberInput = document.getElementById('ticketNumberInput');
    const checkTicketButton = document.getElementById('checkTicketButton');
    const confirmPaymentButton = document.getElementById('confirmPaymentButton');
    const prizeDetailsDiv = document.getElementById('prizeDetails');


    let currentTicket = [];
    let selectedLoteria = null;
    let selectedModalidad = 'animalito'; // Por defecto
    let selectedDrawTimes = [];
    let selectedPlayValue = '';

    // --- Inicialización de Loterías y Modalidades ---
    function initTabs() {
        loteriasData.forEach((loteria, index) => {
            const tab = document.createElement('button');
            tab.classList.add('tab-button');
            tab.textContent = loteria.name;
            tab.dataset.loteriaId = loteria.id;
            if (index === 0) {
                tab.classList.add('active');
                selectedLoteria = loteria;
            }
            tab.addEventListener('click', () => switchLoteria(loteria, tab));
            loteriasTabsContainer.appendChild(tab);
        });
        updateModalidadTabs();
        if (selectedLoteria) loadPlayArea();
    }

    function updateModalidadTabs() {
        modalidadTabsContainer.innerHTML = '';
        const modalidades = ['Animalito'];
        if (selectedLoteria && selectedLoteria.gameType === 'triples') {
            modalidades.push('Triple', 'Tripleta');
        }

        modalidades.forEach((modalidad, index) => {
            const tab = document.createElement('button');
            tab.classList.add('tab-button');
            tab.textContent = modalidad;
            tab.dataset.modalidad = modalidad.toLowerCase();
            if ((selectedModalidad === modalidad.toLowerCase()) || (index === 0 && !modalidades.includes(selectedModalidad.charAt(0).toUpperCase() + selectedModalidad.slice(1)))) {
                tab.classList.add('active');
                if(index === 0 && !modalidades.includes(selectedModalidad.charAt(0).toUpperCase() + selectedModalidad.slice(1))) selectedModalidad = modalidad.toLowerCase();
            }
            tab.addEventListener('click', () => switchModalidad(modalidad.toLowerCase(), tab));
            modalidadTabsContainer.appendChild(tab);
        });
    }

    function switchLoteria(loteria, tabElement) {
        selectedLoteria = loteria;
        document.querySelectorAll('#loterias-tabs .tab-button').forEach(t => t.classList.remove('active'));
        tabElement.classList.add('active');
        selectedModalidad = loteria.gameType === 'animalitos' ? 'animalito' : 'triple'; // Reset modalidad
        updateModalidadTabs();
        loadPlayArea();
        loadDrawTimes();
        clearSelection();
    }

    function switchModalidad(modalidad, tabElement) {
        selectedModalidad = modalidad;
        document.querySelectorAll('#modalidad-tabs .tab-button').forEach(t => t.classList.remove('active'));
        tabElement.classList.add('active');
        loadPlayArea();
        clearSelection();
    }

    function clearSelection() {
        selectedPlayValue = '';
        playInputValue.value = '';
        playSearchInput.value = '';
        document.querySelectorAll('.grid-item.selected, .keypad-button.selected').forEach(el => el.classList.remove('selected'));
    }

    // --- Cargar Área de Juego (Animalitos/Teclado) ---
    function loadPlayArea() {
        gridContainer.innerHTML = '';
        keypadContainer.innerHTML = '';
        playSearchInput.placeholder = selectedModalidad === 'animalito' ? "Buscar animalito o ingresar comando..." : "Ingresar número o comando...";

        if (selectedModalidad === 'animalito' && selectedLoteria && selectedLoteria.gameType === 'animalitos') {
            gridContainer.style.display = 'grid';
            keypadContainer.style.display = 'none';
            const limit = selectedLoteria.numberRangeEnd + 1;
            for (let i = 0; i < limit; i++) {
                const item = document.createElement('div');
                item.classList.add('grid-item');
                const numStr = i.toString().padStart(2, '0');
                item.textContent = `${numStr} - ${animalitosNombres[i] || 'N/A'}`;
                if (i >= animalitosNombres.length && selectedLoteria.numberRangeEnd > 37) {
                    item.textContent = `${numStr}`; // Solo número si no hay nombre
                }
                item.dataset.value = numStr;
                item.addEventListener('click', () => selectPlayItem(item, numStr));
                gridContainer.appendChild(item);
            }
        } else if (selectedModalidad === 'triple' || selectedModalidad === 'tripleta') {
            gridContainer.style.display = 'none';
            keypadContainer.style.display = 'grid';
            createKeypad();
        } else {
             gridContainer.style.display = 'none';
             keypadContainer.style.display = 'none';
        }
    }

    function createKeypad() {
        keypadContainer.innerHTML = ''; // Limpiar antes de crear
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Borrar', '0', 'OK'].forEach(key => {
            const button = document.createElement('button');
            button.classList.add('keypad-button');
            button.textContent = key;
            if (key === 'Borrar') {
                button.addEventListener('click', () => {
                    playSearchInput.value = playSearchInput.value.slice(0, -1);
                });
            } else if (key === 'OK') {
                 button.classList.add('double-width'); // Hacer OK más ancho
                 button.addEventListener('click', () => {
                    if(playSearchInput.value) {
                        selectedPlayValue = playSearchInput.value;
                        playInputValue.value = selectedPlayValue;
                        // Aquí podrías agregar lógica para validar si es tripleta y pedir más números
                    }
                });
            } else {
                button.addEventListener('click', () => {
                    playSearchInput.value += key;
                });
            }
            keypadContainer.appendChild(button);
        });
    }

    function selectPlayItem(element, value) {
        document.querySelectorAll('.grid-item.selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        selectedPlayValue = value;
        playInputValue.value = `${value} - ${animalitosNombres[parseInt(value)] || ''}`;
        playSearchInput.value = ''; // Limpiar búsqueda
    }

    // --- Cargar Horarios de Sorteo ---
    function loadDrawTimes() {
        drawTimesContainer.innerHTML = '';
        selectedDrawTimes = [];
        if (selectedLoteria) {
            selectedLoteria.draws.forEach(time => {
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

    // --- Lógica de Búsqueda y Comandos ---
    playSearchInput.addEventListener('input', () => {
        const query = playSearchInput.value.toLowerCase();
        if (selectedModalidad === 'animalito') {
            document.querySelectorAll('.grid-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? '' : 'none';
            });
        }
        // Si es un comando, podría procesarse aquí al presionar Enter o un botón
    });

    playSearchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evitar submit si estuviera en un form
            processPlayInputAsCommand();
        }
    });

    function processPlayInputAsCommand() {
        const command = playSearchInput.value.trim().toUpperCase();
        if (!command) return;

        // Lógica simple para comandos P, S, T
        if (command.startsWith('P') && command.length > 1) { // Permuta
            selectedPlayValue = command;
            playInputValue.value = `Permuta: ${command.substring(1)}`;
        } else if (command.startsWith('S') && command.includes('-')) { // Serie
            selectedPlayValue = command;
            playInputValue.value = `Serie: ${command.substring(1)}`;
        } else if (command.startsWith('T') && command.length > 1) { // Terminal
            selectedPlayValue = command;
            playInputValue.value = `Terminal: ${command.substring(1)}`;
        } else if (selectedModalidad !== 'animalito' && /^\d+$/.test(command)) { // Si es número para triple/tripleta
            selectedPlayValue = command;
            playInputValue.value = command;
        } else if (selectedModalidad === 'animalito') {
            // Intenta seleccionar el primer animalito que coincida si no es comando
            const firstMatch = Array.from(document.querySelectorAll('.grid-item')).find(item => item.style.display !== 'none');
            if (firstMatch) {
                selectPlayItem(firstMatch, firstMatch.dataset.value);
            }
        }
        // No limpiar playSearchInput aquí para que el usuario vea lo que escribió
    }


    // --- Lógica del Ticket ---
    document.querySelectorAll('.amount-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const amountText = btn.dataset.amount;
            if (amountText.startsWith('Bs.')) {
                amountInput.value = parseFloat(amountText.replace('Bs.', ''));
                currencySelect.value = 'BS';
            } else {
                amountInput.value = parseFloat(amountText);
                currencySelect.value = 'USD';
            }
        });
    });

    addPlayButton.addEventListener('click', addPlayToTicket);

    function addPlayToTicket() {
        const amount = parseFloat(amountInput.value);
        const currency = currencySelect.value;
        let playDescription = selectedPlayValue;

        if (playInputValue.value && playInputValue.value !== selectedPlayValue) { // Si hay descripción en el input de valor
            playDescription = playInputValue.value;
        } else if (selectedModalidad === 'animalito' && animalitosNombres[parseInt(selectedPlayValue)]) {
             playDescription = `${selectedPlayValue} - ${animalitosNombres[parseInt(selectedPlayValue)]}`;
        }


        if (!selectedLoteria || selectedDrawTimes.length === 0 || !playDescription || isNaN(amount) || amount <= 0) {
            alert('Por favor, complete todos los campos: Lotería, Modalidad, Horario(s), Jugada y Monto válido.');
            return;
        }

        selectedDrawTimes.forEach(time => {
            const play = {
                id: Date.now() + Math.random(), // ID único simple
                loteriaName: selectedLoteria.name,
                modalidad: selectedModalidad,
                drawTime: time,
                play: playDescription,
                amount: amount,
                currency: currency
            };
            currentTicket.push(play);
        });

        renderTicket();
        // Limpiar campos después de agregar, excepto lotería y modalidad
        // selectedDrawTimes.forEach(time => {
        //     const btn = drawTimesContainer.querySelector(`.draw-time-button[data-time="${time}"]`);
        //     if (btn) btn.classList.remove('selected');
        // });
        // selectedDrawTimes = [];
        // playSearchInput.value = '';
        // if(selectedModalidad === 'animalito') clearSelection(); // Solo limpiar selección de animalito
        amountInput.value = '';
    }

    function renderTicket() {
        if (currentTicket.length === 0) {
            ticketPlaysList.innerHTML = '<p style="text-align: center; color: #888;">Agregue jugadas para verlas aquí.</p>';
        } else {
            ticketPlaysList.innerHTML = '';
            currentTicket.forEach(play => {
                const item = document.createElement('div');
                item.classList.add('ticket-item');
                item.innerHTML = `
                    <span class="play-details">${play.loteriaName} (${play.modalidad}) - ${play.drawTime} - **${play.play}** - ${play.currency === 'USD' ? '$' : 'Bs.'}${play.amount.toFixed(2)}</span>
                    <span class="play-actions"><button data-id="${play.id}">Eliminar</button></span>
                `;
                item.querySelector('button').addEventListener('click', () => removePlayFromTicket(play.id));
                ticketPlaysList.appendChild(item);
            });
        }
        updateTotals();
    }

    function removePlayFromTicket(id) {
        currentTicket = currentTicket.filter(play => play.id !== id);
        renderTicket();
    }

    function updateTotals() {
        let totalBs = 0;
        let totalUsd = 0;
        currentTicket.forEach(play => {
            if (play.currency === 'BS') {
                totalBs += play.amount;
            } else {
                totalUsd += play.amount;
            }
        });
        totalBsDisplay.textContent = `Total Bs: ${totalBs.toFixed(2)}`;
        totalUsdDisplay.textContent = `Total USD: $${totalUsd.toFixed(2)}`;
    }

    clearTicketButton.addEventListener('click', () => {
        if (confirm('¿Está seguro de que desea limpiar todas las jugadas del ticket?')) {
            currentTicket = [];
            renderTicket();
            clearSelection();
             selectedDrawTimes.forEach(time => {
                const btn = drawTimesContainer.querySelector(`.draw-time-button[data-time="${time}"]`);
                if (btn) btn.classList.remove('selected');
            });
            selectedDrawTimes = [];
        }
    });

    generateTicketButton.addEventListener('click', () => {
        if (currentTicket.length === 0) {
            alert('No hay jugadas en el ticket para generar.');
            return;
        }
        // Aquí iría la lógica para enviar el ticket a Firebase y luego imprimir.
        // Por ahora, solo simularemos.
        const ticketDetails = currentTicket.map(p => `${p.loteriaName} ${p.drawTime}: ${p.play} (${p.currency}${p.amount.toFixed(2)})`).join('\n');
        alert(`Ticket Generado (Simulación):\n--------------------------\n${ticketDetails}\n--------------------------\nTotal Bs: ${totalBsDisplay.textContent.split(': ')[1]}\nTotal USD: ${totalUsdDisplay.textContent.split(': ')[1]}\n\n¡Gracias por su jugada!`);
        currentTicket = []; // Limpiar ticket después de generar
        renderTicket();
    });

    // --- Lógica del Modal Pagar Premio ---
    payPrizeButton.addEventListener('click', () => {
        payPrizeModal.style.display = 'block';
        ticketNumberInput.value = '';
        prizeDetailsDiv.innerHTML = '';
        confirmPaymentButton.style.display = 'none';
    });
    closePayPrizeModal.addEventListener('click', () => {
        payPrizeModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target == payPrizeModal) {
            payPrizeModal.style.display = 'none';
        }
    });

    checkTicketButton.addEventListener('click', () => {
        const ticketNum = ticketNumberInput.value.trim();
        if (!ticketNum) {
            prizeDetailsDiv.innerHTML = '<p style="color:red;">Por favor, ingrese un número de ticket.</p>';
            return;
        }
        // Simulación de verificación de ticket
        prizeDetailsDiv.innerHTML = `<p>Verificando ticket: ${ticketNum}...</p><p>El ticket es <strong>GANADOR</strong>.</p><p>Premio: $25.00</p>`;
        confirmPaymentButton.style.display = 'inline-block';
    });

    confirmPaymentButton.addEventListener('click', () => {
        alert(`Pago del ticket ${ticketNumberInput.value.trim()} confirmado (Simulación).`);
        payPrizeModal.style.display = 'none';
    });


    // --- Atajos de Teclado (Simples) ---
    document.addEventListener('keydown', (e) => {
        // console.log(e.key); // Para depurar qué tecla se presiona
        if (document.activeElement === playSearchInput || document.activeElement === amountInput || document.activeElement === ticketNumberInput) {
            // No interferir si se está escribiendo en un input
            if (e.key === 'Enter' && document.activeElement === playSearchInput) {
                 processPlayInputAsCommand(); // Permitir Enter en playSearchInput
            } else {
                return;
            }
        }

        switch (e.key.toUpperCase()) {
            case 'F1':
                e.preventDefault();
                if (loteriasTabsContainer.children[0]) loteriasTabsContainer.children[0].click();
                break;
            case 'F2':
                e.preventDefault();
                if (loteriasTabsContainer.children[1]) loteriasTabsContainer.children[1].click();
                break;
            case 'F3':
                 e.preventDefault();
                if (loteriasTabsContainer.children[2]) loteriasTabsContainer.children[2].click();
                break;
            case 'F4':
                 e.preventDefault();
                if (loteriasTabsContainer.children[3]) loteriasTabsContainer.children[3].click();
                break;
            case 'F5':
                e.preventDefault();
                playSearchInput.focus();
                break;
            case 'F6':
                e.preventDefault();
                amountInput.focus();
                break;
            case 'F11':
                e.preventDefault();
                payPrizeButton.click();
                break;
            case 'F12':
                e.preventDefault();
                generateTicketButton.click();
                break;
            case 'ENTER':
                e.preventDefault();
                addPlayButton.click();
                break;
            case 'ESCAPE':
                e.preventDefault();
                if (payPrizeModal.style.display === 'block') {
                     payPrizeModal.style.display = 'none';
                } else {
                    clearTicketButton.click();
                }
                break;
        }
    });

    // Inicializar
    initTabs();
    if (selectedLoteria) loadDrawTimes();

});