let campoActual = '';
const modalModificarElement = document.getElementById('modalModificar');
const modalModificar = new bootstrap.Modal(modalModificarElement);

function abrirModalModificacion(campo) {
    campoActual = campo;
    document.getElementById('modalTitulo').innerText = `Modificar ${campo}`;
    document.getElementById('labelInput').innerText = `Nuevo/a ${campo}:`;
    document.getElementById('inputValue').value = '';
    
    if(campo === 'Contraseña') {
        document.getElementById('inputValue').type = 'password';
    } else {
        document.getElementById('inputValue').type = 'text';
    }
    modalModificar.show();
}

function guardarCambios() {
    // Aquí puedes integrar tu lógica con backend (Fetch API / Axios)
    modalModificar.hide();

    // Mostrar mensaje de éxito flotante con Bootstrap
    const alertContainer = document.getElementById('alert-container');
    const alertId = 'alert-' + Date.now();
    
    const alertaHTML = `
        <div id="${alertId}" class="alert alert-success alert-dismissible fade show shadow" role="alert">
            <strong>¡Éxito!</strong> Se ha modificado tu ${campoActual} correctamente.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertaHTML;

    // Ocultar la alerta automáticamente después de 4 segundos
    setTimeout(() => {
        const alertaEl = document.getElementById(alertId);
        if (alertaEl) {
            const alert = bootstrap.Alert.getOrCreateInstance(alertaEl);
            alert.close();
        }
    }, 4000);
}