
// ==========================================
// LOTERÍA MLB - ZONA AMERICANA
// ==========================================


// ==========================================
// EQUIPOS
// ==========================================

const equipos = {

    1: "New York Yankees",
    2: "Boston Red Sox",
    3: "Toronto Blue Jays",
    4: "Tampa Bay Rays",
    5: "Baltimore Orioles",
    6: "Cleveland Guardians",
    7: "Detroit Tigers",
    8: "Minnesota Twins",
    9: "Chicago White Sox",
    10: "Houston Astros",
    11: "Texas Rangers",
    12: "Seattle Mariners"

};


// ==========================================
// VARIABLES
// ==========================================

let puedeJugar = true;

let intentos = 0;

let premios = 0;

const tiempoCooldown = 5;


// ==========================================
// COLECCIÓN
// ==========================================

// Todos los cromos se guardarán en una lista

let datosGuardados = JSON.parse(
    localStorage.getItem("coleccionCromos")
);

let coleccion = Array.isArray(datosGuardados)
    ? datosGuardados
    : [];


// ==========================================
// AL CARGAR LA PÁGINA
// ==========================================

window.addEventListener("load", function () {

    mostrarColeccion();

});


// ==========================================
// GIRAR RULETA
// ==========================================

function girarRuleta() {

    if (!puedeJugar) {
        return;
    }


    const numeroUsuario =
        document.getElementById("numero").value;


    if (numeroUsuario === "") {

        alert("Primero debes elegir un número.");

        return;

    }


    // Bloquear botón

    puedeJugar = false;


    const boton =
        document.getElementById("botonGirar");

    const resultado =
        document.getElementById("resultado");

    const ruleta =
        document.getElementById("ruleta");


    boton.disabled = true;

    boton.innerHTML = "🎰 Girando...";


    resultado.innerHTML = "";

    resultado.className = "";


    // ==========================================
    // NÚMERO GANADOR
    // ==========================================

    const numeroGanador =
        Math.floor(Math.random() * 2) + 1;


    const equipoGanador =
        equipos[numeroGanador];


    const equipoElegido =
        equipos[numeroUsuario];


    // ==========================================
    // ANIMACIÓN
    // ==========================================

    ruleta.classList.remove("girar");

    void ruleta.offsetWidth;

    ruleta.classList.add("girar");


    // ==========================================
    // RESULTADO
    // ==========================================

    setTimeout(function () {

        intentos++;

        document.getElementById("intentos").textContent =
            intentos;


        // ======================================
        // GANÓ
        // ======================================

        if (
            parseInt(numeroUsuario) ===
            numeroGanador
        ) {

            premios++;

            document.getElementById("premios").textContent =
                premios;


            // Obtener cromo

            const cromo =
                agregarCromo(numeroGanador);


            resultado.innerHTML =

                "🏆 ¡FELICIDADES! 🏆<br><br>" +

                "El número ganador fue el " +

                "<strong>" +
                numeroGanador +
                "</strong>." +

                "<br><br>" +

                "⚾ Equipo: " +

                "<strong>" +
                equipoGanador +
                "</strong>" +

                "<br><br>" +

                "🎁 ¡Has ganado un cromo!";


            resultado.className =
                "ganador";

        }


        // ======================================
        // PERDIÓ
        // ======================================

        else {

            resultado.innerHTML =

                "😔 Esta vez no ganaste." +

                "<br><br>" +

                "El número ganador fue el " +

                "<strong>" +
                numeroGanador +
                "</strong>." +

                "<br><br>" +

                "⚾ Equipo ganador: " +

                "<strong>" +
                equipoGanador +
                "</strong>" +

                "<br><br>" +

                "Tu elegiste el " +

                "<strong>" +
                numeroUsuario +
                "</strong> " +

                "(" +
                equipoElegido +
                ")" +

                "<br><br>" +

                "¡Suerte para la próxima!";


            resultado.className =
                "perdedor";

        }


        // Historial

        agregarHistorial(
            numeroUsuario,
            numeroGanador
        );


        // Cooldown

        iniciarCooldown();


    }, 3000);

}


// ==========================================
// AGREGAR CROMO
// ==========================================

function agregarCromo(numero) {

    const equipo =
        equipos[numero];


    // ==========================================
    // CROMOS DE LOS YANKEES
    // ==========================================

    if (numero == 1) {

        const numeroCromo =
            Math.floor(Math.random() * 2) + 1;


        const imagenCromo =
            "premio/NYY" +
            numeroCromo +
            ".png";


        const cromo = {

            equipo: equipo,

            numero: numeroCromo,

            imagen: imagenCromo

        };


        // Agregar a colección

        coleccion.push(cromo);


        // Guardar

        guardarColeccion();


        // Actualizar pantalla

        mostrarColeccion();


        return cromo;

    }


    // ==========================================
    // OTROS EQUIPOS
    // ==========================================

    const cromo = {

        equipo: equipo,

        numero: 1,

        imagen: ""

    };


    coleccion.push(cromo);


    guardarColeccion();

    mostrarColeccion();


    return cromo;

}


// ==========================================
// GUARDAR COLECCIÓN
// ==========================================

function guardarColeccion() {

    if (!Array.isArray(coleccion)) {
        coleccion = [];
    }

    localStorage.setItem(
        "coleccionCromos",
        JSON.stringify(coleccion)
    );

}


// ==========================================
// MOSTRAR COLECCIÓN
// ==========================================

function mostrarColeccion() {

    const contenedor =
        document.getElementById(
            "coleccionCromos"
        );


    if (!contenedor) {
        return;
    }


    contenedor.innerHTML = "";


    // ==========================================
    // SIN CROMOS
    // ==========================================

    if (coleccion.length === 0) {

        contenedor.innerHTML =
            "<p>Aún no tienes cromos. ¡Gira la ruleta!</p>";

        return;

    }


    // ==========================================
    // MOSTRAR CROMOS
    // ==========================================

    coleccion.forEach(function (cromo, indice) {

        const elemento =
            document.createElement("div");


        elemento.className =
            "cromo";


        // ======================================
        // CROMO CON IMAGEN
        // ======================================

        if (cromo.imagen !== "") {

            elemento.innerHTML =

                "<img src='" +
                cromo.imagen +
                "' " +
                "alt='Cromo de " +
                cromo.equipo +
                "'>" +

                "<div class='cromo-equipo'>" +

                cromo.equipo +

                "</div>" +

                "<button " +
                "onclick=\"descargarCromo(" +
                indice +
                ")\">" +

                "⬇ Descargar cromo" +

                "</button>";

        }


        // ======================================
        // CROMO SIN IMAGEN
        // ======================================

        else {

            elemento.innerHTML =

                "<div class='cromo-numero'>" +

                cromo.numero +

                "</div>" +

                "<div class='cromo-equipo'>" +

                cromo.equipo +

                "</div>" +

                "<div class='cromo-icono'>⚾</div>";

        }


        contenedor.appendChild(elemento);

    });

}


// ==========================================
// DESCARGAR CROMO
// ==========================================

function descargarCromo(indice) {

    const cromo =
        coleccion[indice];


    if (!cromo || !cromo.imagen) {

        alert("Este cromo no tiene una imagen disponible.");

        return;

    }


    const enlace =
        document.createElement("a");


    enlace.href =
        cromo.imagen;


    enlace.download =
        "Cromo-" +
        cromo.equipo.replaceAll(" ", "-") +
        "-" +
        cromo.numero +
        ".png";


    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);

}


// ==========================================
// COOLDOWN
// ==========================================

function iniciarCooldown() {

    const boton =
        document.getElementById(
            "botonGirar"
        );


    const cooldown =
        document.getElementById(
            "cooldown"
        );


    let segundos =
        tiempoCooldown;


    cooldown.innerHTML =

        "⏳ Puedes volver a jugar en " +

        segundos +

        " segundos...";


    const intervalo =
        setInterval(function () {

            segundos--;


            if (segundos > 0) {

                cooldown.innerHTML =

                    "⏳ Puedes volver a jugar en " +

                    segundos +

                    " segundos...";

            }


            else {

                clearInterval(intervalo);


                puedeJugar = true;


                boton.disabled = false;


                boton.innerHTML =
                    "🎰 Girar Ruleta";


                cooldown.innerHTML =
                    "✅ ¡Ya puedes volver a jugar!";

            }

        }, 1000);

}


// ==========================================
// HISTORIAL
// ==========================================

function agregarHistorial(
    numeroUsuario,
    numeroGanador
) {

    const historial =
        document.getElementById(
            "historialTiros"
        );


    if (intentos === 1) {

        historial.innerHTML = "";

    }


    const elemento =
        document.createElement("li");


    const equipoGanador =
        equipos[numeroGanador];


    const equipoElegido =
        equipos[numeroUsuario];


    // ==========================================
    // GANADOR
    // ==========================================

    if (
        parseInt(numeroUsuario) ===
        numeroGanador
    ) {

        elemento.innerHTML =

            "🏆 Elegiste el " +

            "<strong>" +
            numeroUsuario +
            "</strong> " +

            "(" +
            equipoElegido +
            ")" +

            " — Ganaste el cromo de " +

            "<strong>" +
            equipoGanador +
            "</strong>";


        elemento.className =
            "historial-ganador";

    }


    // ==========================================
    // PERDEDOR
    // ==========================================

    else {

        elemento.innerHTML =

            "❌ Elegiste el " +

            "<strong>" +
            numeroUsuario +
            "</strong> " +

            "(" +
            equipoElegido +
            ")" +

            " — Salió el " +

            "<strong>" +
            numeroGanador +
            "</strong> " +

            "(" +
            equipoGanador +
            ")";


        elemento.className =
            "historial-perdedor";

    }


    historial.prepend(elemento);

}