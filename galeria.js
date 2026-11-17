
/* ==========================================
   MLB - ZONA AMERICANA
   EDITOR DE IMÁGENES Y VIDEOS
========================================== */

// ==========================================
// ELEMENTOS DEL EDITOR DE IMÁGENES
// ==========================================

const canvasImagen = document.getElementById("canvasEditor");
const contextoImagen = canvasImagen.getContext("2d");

let imagenOriginal = null;

// ==========================================
// ABRIR EDITOR DE IMAGEN
// ==========================================

function abrirEditor(imagen) {
    if (!imagen.complete || !imagen.naturalWidth) {
        alert("La imagen todavía no está disponible.");
        return;
    }

    imagenOriginal = imagen;

    canvasImagen.width = imagen.naturalWidth;
    canvasImagen.height = imagen.naturalHeight;

    restaurarImagen();

    document.getElementById("editor").style.display = "flex";
}

// ==========================================
// CERRAR EDITOR DE IMAGEN
// ==========================================

function cerrarEditor() {
    document.getElementById("editor").style.display = "none";
}

// ==========================================
// RESTAURAR IMAGEN
// ==========================================

function restaurarImagen() {
    if (!imagenOriginal) return;

    contextoImagen.filter = "none";

    contextoImagen.clearRect(
        0, 0,
        canvasImagen.width,
        canvasImagen.height
    );

    contextoImagen.drawImage(
        imagenOriginal,
        0, 0,
        canvasImagen.width,
        canvasImagen.height
    );
}

// ==========================================
// FUNCIÓN GENERAL PARA FILTROS DE PÍXELES
// ==========================================

function transformarPixeles(contexto, ancho, alto, tipo) {
    const imagen = contexto.getImageData(0, 0, ancho, alto);
    const datos = imagen.data;

    for (let i = 0; i < datos.length; i += 4) {
        const r = datos[i];
        const g = datos[i + 1];
        const b = datos[i + 2];

        if (tipo === "termica") {
            const brillo = (r + g + b) / 3;

            if (brillo < 85) {
                datos[i] = 0;
                datos[i + 1] = 0;
                datos[i + 2] = brillo * 2;
            } else if (brillo < 170) {
                datos[i] = brillo * 2;
                datos[i + 1] = 0;
                datos[i + 2] = 255 - brillo;
            } else {
                datos[i] = 255;
                datos[i + 1] = brillo;
                datos[i + 2] = 0;
            }
        }

        if (tipo === "saturado") {
            const promedio = (r + g + b) / 3;

            datos[i] = promedio + (r - promedio) * 1.8;
            datos[i + 1] = promedio + (g - promedio) * 1.8;
            datos[i + 2] = promedio + (b - promedio) * 1.8;
        }

        if (tipo === "pastel") {
            datos[i] = r * 0.7 + 255 * 0.3;
            datos[i + 1] = g * 0.7 + 255 * 0.3;
            datos[i + 2] = b * 0.7 + 255 * 0.3;
        }
    }

    contexto.putImageData(imagen, 0, 0);
}

// ==========================================
// PIXELADO
// ==========================================

function pixelarCanvas(contexto, ancho, alto) {
    const tamaño = 15;

    const temporal = document.createElement("canvas");
    const ctxTemporal = temporal.getContext("2d");

    temporal.width = Math.max(1, Math.ceil(ancho / tamaño));
    temporal.height = Math.max(1, Math.ceil(alto / tamaño));

    ctxTemporal.drawImage(
        contexto.canvas,
        0, 0,
        temporal.width,
        temporal.height
    );

    contexto.clearRect(0, 0, ancho, alto);
    contexto.imageSmoothingEnabled = false;

    contexto.drawImage(
        temporal,
        0, 0,
        temporal.width,
        temporal.height,
        0, 0,
        ancho, alto
    );

    contexto.imageSmoothingEnabled = true;
}

// ==========================================
// APLICAR FILTROS A IMAGEN
// ==========================================

function aplicarFiltro(filtro) {
    if (!imagenOriginal) return;

    restaurarImagen();

    const ancho = canvasImagen.width;
    const alto = canvasImagen.height;

    if (filtro === "normal") return;

    if (filtro === "desenfoque" || filtro === "suave") {
        contextoImagen.filter =
            filtro === "desenfoque" ? "blur(5px)" : "blur(2px)";

        contextoImagen.clearRect(0, 0, ancho, alto);
        contextoImagen.drawImage(imagenOriginal, 0, 0, ancho, alto);
        contextoImagen.filter = "none";
        return;
    }

    if (filtro === "pixelado") {
        pixelarCanvas(contextoImagen, ancho, alto);
        return;
    }

    if (["termica", "saturado", "pastel"].includes(filtro)) {
        transformarPixeles(contextoImagen, ancho, alto, filtro);
    }
}

// ==========================================
// GUARDAR IMAGEN
// ==========================================

function guardarImagen() {
    if (!imagenOriginal) {
        alert("Primero selecciona una imagen.");
        return;
    }

    canvasImagen.toBlob(function(blob) {
        if (!blob) {
            alert("No se pudo guardar la imagen.");
            return;
        }

        descargarArchivo(blob, "imagen-filtrada.png");
    }, "image/png");
}

// ==========================================
// DESCARGAR ARCHIVOS
// ==========================================

function descargarArchivo(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombre;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ==========================================
// ELEMENTOS DEL EDITOR DE VIDEOS
// ==========================================

const video = document.getElementById("videoOriginal");
const canvas = document.getElementById("canvasVideo");
const contexto = canvas.getContext("2d");

let filtroActualVideo = "normal";
let animacionVideo = null;

let grabando = false;
let grabador = null;
let partesVideo = [];
let streamGrabacion = null;

// ==========================================
// ABRIR EDITOR DE VIDEO
// ==========================================

function abrirEditorVideo(videoSeleccionado) {
    if (grabando) {
        alert("Detén la grabación antes de cambiar de video.");
        return;
    }

    videoSeleccionado.pause();
    video.pause();

    if (animacionVideo !== null) {
        cancelAnimationFrame(animacionVideo);
        animacionVideo = null;
    }

    filtroActualVideo = "normal";

    const fuente = videoSeleccionado.currentSrc ||
        videoSeleccionado.querySelector("source")?.src;

    if (!fuente) {
        alert("No se encontró el archivo de video.");
        return;
    }

    canvas.width = 640;
    canvas.height = 360;
    contexto.clearRect(0, 0, canvas.width, canvas.height);

    video.src = fuente;
    video.load();

    video.onloadedmetadata = function() {
        // Limitar la resolución interna para mejorar
        // el rendimiento de los filtros en celulares.
        const anchoOriginal = video.videoWidth || 640;
        const altoOriginal = video.videoHeight || 360;

        const escala = Math.min(1, 960 / anchoOriginal);

        canvas.width = Math.max(1, Math.round(anchoOriginal * escala));
        canvas.height = Math.max(1, Math.round(altoOriginal * escala));

        dibujarFotograma();
    };

    document.getElementById("editorVideo").style.display = "flex";
}

// ==========================================
// DIBUJAR FOTOGRAMA CON FILTRO
// ==========================================

function dibujarFotograma() {
    if (video.readyState < 2 || !canvas.width || !canvas.height) {
        return;
    }

    const ancho = canvas.width;
    const alto = canvas.height;

    contexto.filter = "none";
    contexto.clearRect(0, 0, ancho, alto);

    if (filtroActualVideo === "desenfoque") {
        contexto.filter = "blur(5px)";
    } else if (filtroActualVideo === "suave") {
        contexto.filter = "blur(2px)";
    }

    contexto.drawImage(video, 0, 0, ancho, alto);
    contexto.filter = "none";

    if (filtroActualVideo === "pixelado") {
        pixelarCanvas(contexto, ancho, alto);
    }

    if (["termica", "saturado", "pastel"].includes(filtroActualVideo)) {
        transformarPixeles(
            contexto,
            ancho,
            alto,
            filtroActualVideo
        );
    }
}

// ==========================================
// ANIMACIÓN DE VIDEO
// ==========================================

function dibujarVideo() {
    if (video.paused || video.ended) {
        animacionVideo = null;
        dibujarFotograma();
        return;
    }

    dibujarFotograma();

    animacionVideo = requestAnimationFrame(dibujarVideo);
}

video.addEventListener("play", function() {
    if (animacionVideo === null) {
        dibujarVideo();
    }
});

video.addEventListener("pause", function() {
    if (animacionVideo !== null) {
        cancelAnimationFrame(animacionVideo);
        animacionVideo = null;
    }

    dibujarFotograma();
});

video.addEventListener("seeked", dibujarFotograma);
video.addEventListener("loadeddata", dibujarFotograma);

// ==========================================
// CAMBIAR FILTRO DE VIDEO
// ==========================================

function aplicarFiltroVideo(filtro) {
    filtroActualVideo = filtro;

    if (video.paused) {
        dibujarFotograma();
    }
}

// ==========================================
// INICIAR GRABACIÓN
// ==========================================

function comenzarGrabacion() {
    if (grabando) return;

    if (!video.currentSrc || video.readyState < 2) {
        alert("Primero selecciona y carga un video.");
        return;
    }

    if (
        typeof MediaRecorder === "undefined" ||
        typeof canvas.captureStream !== "function"
    ) {
        alert("Este navegador no admite la grabación del video filtrado.");
        return;
    }

    const formatos = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm"
    ];

    const formato = formatos.find(tipo =>
        MediaRecorder.isTypeSupported(tipo)
    );

    if (!formato) {
        alert("Este navegador no admite exportar video WebM.");
        return;
    }

    try {
        streamGrabacion = canvas.captureStream(30);

        grabador = new MediaRecorder(streamGrabacion, {
            mimeType: formato
        });

        partesVideo = [];

        grabador.ondataavailable = function(evento) {
            if (evento.data && evento.data.size > 0) {
                partesVideo.push(evento.data);
            }
        };

        grabador.onstop = function() {
            const blob = new Blob(partesVideo, {
                type: grabador.mimeType
            });

            if (blob.size > 0) {
                descargarArchivo(blob, "video-filtrado.webm");
            } else {
                alert("No se generó contenido de video.");
            }

            if (streamGrabacion) {
                streamGrabacion.getTracks().forEach(
                    pista => pista.stop()
                );
                streamGrabacion = null;
            }

            grabador = null;
        };

        grabador.onerror = function() {
            grabando = false;
            alert("Ocurrió un error durante la grabación.");
        };

        grabador.start();
        grabando = true;

        // La grabación comienza con el video reproduciéndose.
        if (video.ended) {
            video.currentTime = 0;
        }

        video.play().catch(function() {
            detenerGrabacion();
            alert("No se pudo reproducir el video.");
        });

    } catch (error) {
        grabando = false;

        if (streamGrabacion) {
            streamGrabacion.getTracks().forEach(
                pista => pista.stop()
            );
            streamGrabacion = null;
        }

        alert("No fue posible iniciar la grabación.");
        console.error(error);
    }
}

// ==========================================
// DETENER Y GUARDAR GRABACIÓN
// ==========================================

function detenerGrabacion() {
    if (!grabando || !grabador) {
        alert("No hay ninguna grabación activa.");
        return;
    }

    if (grabador.state !== "inactive") {
        grabador.stop();
    }

    grabando = false;
}

// ==========================================
// CERRAR EDITOR DE VIDEO
// ==========================================

function cerrarEditorVideo() {
    if (grabando) {
        detenerGrabacion();
    }

    video.pause();

    if (animacionVideo !== null) {
        cancelAnimationFrame(animacionVideo);
        animacionVideo = null;
    }

    document.getElementById("editorVideo").style.display = "none";
}

// ==========================================
// CERRAR EDITORES CON TECLA ESCAPE
// ==========================================

document.addEventListener("keydown", function(evento) {
    if (evento.key !== "Escape") return;

    const editorImagen = document.getElementById("editor");
    const editorVideo = document.getElementById("editorVideo");

    if (editorVideo.style.display === "flex") {
        cerrarEditorVideo();
    } else if (editorImagen.style.display === "flex") {
        cerrarEditor();
    }
});
