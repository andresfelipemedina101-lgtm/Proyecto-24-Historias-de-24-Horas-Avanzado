
const CLAVE = "historias";                 // Nombre con el que se guardan en localStorage
const DURACION = 3000;                     // Cada historia se muestra 3 segundos
const UN_DIA = 24 * 60 * 60 * 1000;        // 24 horas en milisegundos
const ANCHO_MAX = 1080;                    // Tamaño máximo permitido de la imagen
const ALTO_MAX = 1920;

const btnAgregar = document.getElementById("btnAgregar");
const inputImagen = document.getElementById("inputImagen");
const lista = document.getElementById("listaHistorias");
const mensaje = document.getElementById("mensaje");
const sinHistorias = document.getElementById("sinHistorias");
const visor = document.getElementById("visor");
const barras = document.getElementById("barrasProgreso");
const imagenVisor = document.getElementById("imagenVisor");
const btnCerrar = document.getElementById("btnCerrar");

let historias = [];      // Historias vigentes
let actual = 0;          // Posición de la historia que se está viendo
let temporizador;        // Guarda el setTimeout para poder cancelarlo



// Lee las historias guardadas y descarta las que tienen más de 24 horas
function cargarHistorias() {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE)) || [];
    historias = guardadas.filter(h => Date.now() - h.fecha < UN_DIA);
    localStorage.setItem(CLAVE, JSON.stringify(historias));
}



// Convierte la imagen a base64 y la reduce si pasa de 1080x1920
function convertirImagen(archivo) {
    return new Promise(resolver => {
        const img = new Image();

        img.onload = () => {
            // Escala proporcional: si la imagen ya es pequeña, se deja igual (1)
            const escala = Math.min(1, ANCHO_MAX / img.width, ALTO_MAX / img.height);

            // Se dibuja la imagen en un canvas con el nuevo tamaño
            const canvas = document.createElement("canvas");
            canvas.width = img.width * escala;
            canvas.height = img.height * escala;
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

            resolver(canvas.toDataURL("image/jpeg", 0.8));
        };

        // Crea una dirección temporal para que el navegador pueda leer el archivo
        img.src = URL.createObjectURL(archivo);
    });
}

// Se ejecuta cuando el usuario elige una imagen
async function agregarHistoria() {
    const archivo = inputImagen.files[0];
    if (!archivo) return;

    const base64 = await convertirImagen(archivo);

    // Cada historia guarda la imagen y la fecha en que se publicó
    historias.push({ imagen: base64, fecha: Date.now() });

    try {
        localStorage.setItem(CLAVE, JSON.stringify(historias));
        mensaje.textContent = "¡Historia publicada!";
    } catch (error) {
        historias.pop();
        mensaje.textContent = "No hay espacio para más historias.";
    }

    inputImagen.value = "";   // Permite volver a elegir la misma imagen
    mostrarHistorias();
}



// Dibuja un círculo por cada historia en la barra superior
function mostrarHistorias() {
    cargarHistorias();
    lista.innerHTML = "";

    // El texto "Aún no hay historias" solo se ve si la lista está vacía
    sinHistorias.hidden = historias.length > 0;

    historias.forEach((historia, i) => {
        const boton = document.createElement("button");
        boton.className = "historia circulo";
        boton.innerHTML = `<img src="${historia.imagen}" alt="Historia ${i + 1}">`;
        boton.onclick = () => abrirVisor(i);   // Al hacer clic se abre esa historia
        lista.appendChild(boton);
    });
}



function abrirVisor(i) {
    visor.classList.remove("oculto");
    mostrarHistoria(i);
}

function cerrarVisor() {
    clearTimeout(temporizador);
    visor.classList.add("oculto");
}

// Muestra la historia número "i" con su barra de progreso
function mostrarHistoria(i) {
    clearTimeout(temporizador);   // Cancela el cambio automático anterior
    actual = i;
    imagenVisor.src = historias[i].imagen;

    // Se crea una barra por historia: las anteriores llenas y la actual animada (CSS)
    barras.innerHTML = historias.map((h, j) => {
        let estado = "";
        if (j < i) estado = "llena";
        if (j === i) estado = "activa";
        return `<div class="barra ${estado}"><div class="relleno"></div></div>`;
    }).join("");

    // Pasados 3 segundos se avanza a la siguiente historia
    temporizador = setTimeout(siguiente, DURACION);
}

function siguiente() {
    if (actual < historias.length - 1) {
        mostrarHistoria(actual + 1);
    } else {
        cerrarVisor();           
    }
}

function anterior() {
    if (actual > 0) mostrarHistoria(actual - 1);
}



// Se guarda dónde empezó el dedo/mouse y se compara con dónde terminó
let inicioX = 0;

visor.addEventListener("pointerdown", e => inicioX = e.clientX);

visor.addEventListener("pointerup", e => {
    const distancia = e.clientX - inicioX;
    if (distancia < -50) siguiente();   // Deslizó hacia la izquierda
    if (distancia > 50) anterior();     // Deslizó hacia la derecha
});



btnAgregar.onclick = () => inputImagen.click();   // El + abre el selector de archivos
inputImagen.onchange = agregarHistoria;
btnCerrar.onclick = cerrarVisor;

// Al abrir la página se muestran las historias, y cada minuto se revisa si alguna cumplió 24 horas para quitarla aunque la página siga abierta
mostrarHistorias();
setInterval(mostrarHistorias, 60000);
