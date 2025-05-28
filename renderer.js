document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const usuarioInput = document.getElementById('usuario');
    const claveInput = document.getElementById('clave');
    const codigoAgenciaInput = document.getElementById('codigo-agencia');
    const numeroTaquillaInput = document.getElementById('numero-taquilla');
    const statusElement = document.getElementById('firebase-status');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const usuario = usuarioInput.value;

            // Validación básica en frontend
            if (!usuario || !claveInput.value || !codigoAgenciaInput.value || !numeroTaquillaInput.value) {
                statusElement.textContent = 'Por favor, complete todos los campos.';
                statusElement.style.color = 'orange';
                return; // Detiene el envío si hay campos vacíos
            }

            const clave = claveInput.value;
            const codigoAgencia = codigoAgenciaInput.value;
            const numeroTaquilla = numeroTaquillaInput.value;

            // Limpiar mensaje de estado anterior
            statusElement.textContent = '';

            // Enviar los datos de login al proceso principal usando la API expuesta en preload.js
            if (window.electronAPI && window.electronAPI.sendLogin) {
                window.electronAPI.sendLogin({ usuario, clave, codigoAgencia, numeroTaquilla });
            } else {
                console.error('La API de Electron no está disponible en window.electronAPI.');
                statusElement.textContent = 'Error interno de la aplicación.';
                statusElement.style.color = 'red';
            }
        });
    } else {
        console.error('Botón de login no encontrado.');
    }

    // Manejar la respuesta del proceso principal usando la API expuesta en preload.js
    if (window.electronAPI && window.electronAPI.onLoginResponse) {
        window.electronAPI.onLoginResponse((event, response) => {
            if (response.success) {
                statusElement.textContent = response.message;
                statusElement.style.color = 'green';
                // Aquí puedes redirigir al usuario a la siguiente pantalla
                // o mostrar la interfaz principal de la aplicación.
                console.log('Inicio de sesión exitoso.'); // Evitar logear datos sensibles
                // Opcional: guardar información de la sesión si es necesario, de forma segura.

                // Redirigir o cambiar de vista (ejemplo)
                // Si tienes otra página (como home.html), podrías hacer algo como:
                // window.location.href = 'home.html';

            } else {
                statusElement.textContent = response.message;
                statusElement.style.color = 'red';
                console.error('Error de inicio de sesión:', response.message);
            }
        });
    } else {
        console.error('La API de Electron para onLoginResponse no está disponible.');
    }
});