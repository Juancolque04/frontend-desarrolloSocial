// Variables globales
let isAuthenticated = false;
let userRole = null;

const uploadForm = document.getElementById('uploadForm');
const fileList = document.getElementById('fileList');

const fileInput = document.getElementById('fileInput');
const fileNameSpan = document.getElementById('file-name');
const uploadSection = document.querySelector('.upload-section');

const section = uploadForm.getAttribute('data-section');

async function initApp() {
    await checkAuth(); // Comprobar autenticación
    loadFiles(); // Cargar archivos subidos
}

// Actualizar el nombre del archivo seleccionado
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileNameSpan.textContent = fileInput.files[0].name;
    } else {
        fileNameSpan.textContent = 'Ningún archivo seleccionado';
    }
});

// Manejar la subida de archivos
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];

    if (!file) {
        Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: 'Por favor, selecciona un archivo para subir.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('section', section); // Enviar la sección al backend

    try {
        const response = await fetch('http://localhost:5000/api/files/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Archivo subido correctamente',
                confirmButtonText: 'Aceptar'
            });
            uploadForm.reset();
            fileNameSpan.textContent = 'Ningún archivo seleccionado';
            loadFiles();
        } else {
            const errorData = await response.json();
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error: ${errorData.message}`,
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error al subir el archivo:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al subir el archivo.',
            confirmButtonText: 'Aceptar'
        });
    }
});

// Función para cargar y mostrar los archivos subidos
async function loadFiles() {
    try {
        const response = await fetch(`http://localhost:5000/api/files/${section}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            const files = await response.json();
            fileList.innerHTML = '';

            if (files.length === 0) {
                fileList.innerHTML = '<li>No hay archivos subidos.</li>';
                return;
            }

            files.forEach(file => {
                const li = document.createElement('li');

                const link = document.createElement('a');
                link.href = `http://localhost:5000${file.fileUrl}`;
                link.target = '_blank';
                link.textContent = file.filename;

                // Crear un botón de eliminar
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar';
                deleteButton.classList.add('delete-button');
                deleteButton.onclick = () => {
                    Swal.fire({
                        title: '¿Estás seguro?',
                        text: "¿Deseas eliminar este archivo?",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            deleteFile(file.id);
                        }
                    });
                };

                li.appendChild(link);
                li.appendChild(deleteButton);
                fileList.appendChild(li);
            });

            adjustDeleteButtonsVisibility();
        } else {
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error: ${errorData.message}`,
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error al cargar los archivos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al cargar los archivos.',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para eliminar un archivo
async function deleteFile(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/files/delete/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (response.ok) {
            // Muestra la alerta de éxito antes de cargar los archivos
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Archivo eliminado correctamente',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                loadFiles(); // Solo cargar archivos después de que se confirme la alerta
            });
        } else {
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error: ${errorData.message}`,
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error al eliminar el archivo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al eliminar el archivo.',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para ajustar la visibilidad de los botones de eliminar según el rol
function adjustDeleteButtonsVisibility() {
    if (userRole !== 'admin') {
        document.querySelectorAll('.delete-button').forEach(button => {
            button.style.display = 'none';
        });
    } else {
        document.querySelectorAll('.delete-button').forEach(button => {
            button.style.display = 'inline-block';
        });
    }
}

// Función para manejar el estado no autenticado
function handleUnauthenticated() {
    isAuthenticated = false;
    userRole = null;

    // Ocultar el formulario de subida de archivos
    if (uploadForm) {
        uploadForm.style.display = 'none';
    }

    // Mostrar solo la sección de archivos subidos
    if (fileList) {
        document.getElementById('archivos-subidos').style.display = 'block';
    }
}

// Función para manejar el estado autenticado
function handleAuthenticated(role) {
    isAuthenticated = true;
    userRole = role;

    // Mostrar el formulario de subida de archivos si es admin
    if (uploadForm) {
        if (userRole === 'admin') {
            uploadForm.style.display = 'block';
        } else {
            uploadForm.style.display = 'none';
        }
    }

    // Mostrar la sección de archivos subidos
    if (fileList) {
        document.getElementById('archivos-subidos').style.display = 'block';
    }
}

// Función para comprobar si la sesión está activa y obtener el rol
async function checkAuth() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                handleAuthenticated(data.user.role);
            } else {
                handleUnauthenticated();
            }
        } else {
            handleUnauthenticated();
        }
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo verificar la autenticación. Por favor, inténtalo de nuevo más tarde.',
        });
        handleUnauthenticated();
    }
}

// Obtener el modal
const modal = document.getElementById("modal-protocolos");
const btn = document.getElementById("protocolos-intervencion");
const closeButton = document.getElementsByClassName("close-button")[0];

btn.onclick = function () {
    modal.style.display = "block";
}

closeButton.onclick = function () {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Iniciar la aplicación
initApp();
