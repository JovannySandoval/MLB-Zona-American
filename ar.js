
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

document.addEventListener("DOMContentLoaded", function () {

    const contenedor = document.querySelector("#ar-container");
    const estado = document.getElementById("estadoAR");
    const resultado = document.getElementById("resultadoAR");

    const botonIniciar = document.getElementById("iniciarAR");
    const botonDetener = document.getElementById("detenerAR");
    const botonPausar = document.getElementById("pausarModelo");
    const botonReanudar = document.getElementById("reanudarModelo");
    const botonConfetti = document.getElementById("botonConfetti");
    const botonFoto = document.getElementById("tomarFoto");

    const informacionEquipo = document.getElementById("informacion-equipo");
    const seccionModelo = document.querySelector(".modelo-web");

    let mindarThree = null;
    let rendererModelo = null;
    let escenaAR = null;
    let camaraAR = null;

    let iniciado = false;
    let iniciando = false;
    let animandoModelo = false;
    let modeloActivo = null;
    let indiceActivo = -1;

    const equiposAR = [];
    const loader = new GLTFLoader();

    // Los controles estarán visibles.
    // La información del equipo aparece al detectar un logo.
    seccionModelo.style.display = "block";
    informacionEquipo.style.display = "none";

    function obtenerInformacion(indice) {
        const numero = indice + 1;

        return {
            titulo: "Logo detectado " + numero,
            modelo: "Mod" + numero + ".glb",
            descripcion:
                "Se ha reconocido el objetivo " + numero +
                " de la colección de realidad aumentada."
        };
    }

    function actualizarInformacion(equipo) {
        const enlacesEquipos = {
            0: { nombre: "Baltimore Orioles", id: "orioles" },
            1: { nombre: "Boston Red Sox", id: "red-sox" },
            2: { nombre: "Seattle Mariners", id: "mariners" },
            3: { nombre: "Tampa Bay Rays", id: "tampa-rays" },
            4: { nombre: "Toronto Blue Jays", id: "blue-jays" },
            5: { nombre: "Texas Rangers", id: "rangers" },
            6: { nombre: "Chicago White Sox", id: "white-sox" },
            7: { nombre: "New York Yankees", id: "yankees" },
            8: { nombre: "Houston Astros", id: "astros" },
            9: { nombre: "Cleveland Guardians", id: "guardians" },
            10: { nombre: "Detroit Tigers", id: "tigers" },
            11: { nombre: "Kansas City Royals", id: "royals" },
            12: { nombre: "Los Angeles Angels", id: "angels" },
            13: { nombre: "Minnesota Twins", id: "twins" },
            14: { nombre: "Athletics", id: "athletics" }
        };

        const datos = enlacesEquipos[equipo.indice];

        if (!datos) {
            console.warn("No hay enlace para el índice:", equipo.indice);
            return;
        }

        informacionEquipo.innerHTML = `
            <h3>${datos.nombre}</h3>
            <a class="boton-historia"
               href="equipos.html#${datos.id}">
                Conocer la historia del equipo
            </a>
        `;

        informacionEquipo.style.display = "block";
    }

    function ocultarModelos() {
        equiposAR.forEach(function (equipo) {
            if (equipo.modelo) {
                equipo.modelo.visible = false;
            }
        });
    }

    function mostrarEquipo(equipo) {
        indiceActivo = equipo.indice;
        modeloActivo = equipo.modelo;

        ocultarModelos();

        resultado.textContent =
            "Logo detectado. Objetivo " + (equipo.indice + 1);
        resultado.className = "detectado";

        actualizarInformacion(equipo);
        animandoModelo = true;

        if (equipo.modelo) {
            equipo.modelo.visible = true;

            console.log(
                "Modelo mostrado:",
                "Mod" + (equipo.indice + 1) + ".glb"
            );
        } else {
            resultado.textContent =
                "Logo detectado. Cargando modelo 3D...";
        }
    }

    function prepararAR() {
        mindarThree = new MindARThree({
            container: contenedor,
            imageTargetSrc: "./assets/logos.mind",
            uiLoading: "no",
            uiScanning: "no",
            uiError: "no"
        });

        const { renderer, scene, camera } = mindarThree;

        rendererModelo = renderer;
        escenaAR = scene;
        camaraAR = camera;

        // Iluminación para los materiales de los modelos 3D.
        scene.add(new THREE.HemisphereLight(0xffffff, 0x666677, 2));

        const luzPrincipal = new THREE.DirectionalLight(0xffffff, 2);
        luzPrincipal.position.set(1, 3, 2);
        scene.add(luzPrincipal);

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        // Crear un anclaje por cada uno de los 15 logos.
        for (let i = 0; i < 15; i++) {
            const indice = i;
            const anchor = mindarThree.addAnchor(indice);
            const nombreModelo = "Mod" + (indice + 1) + ".glb";

            const equipo = {
                indice,
                anchor,
                modelo: null,
                detectado: false
            };

            equiposAR.push(equipo);

            loader.load(
                "./assets/" + nombreModelo,

                function (gltf) {
                    const modelo = gltf.scene;
                    equipo.modelo = modelo;

                    // Mantener los materiales y las texturas originales.
                    modelo.traverse(function (objeto) {
                        if (!objeto.isMesh) return;

                        objeto.castShadow = true;
                        objeto.receiveShadow = true;

                        const materiales = Array.isArray(objeto.material)
                            ? objeto.material
                            : [objeto.material];

                        materiales.forEach(function (material) {
                            if (!material) return;

                            if (material.map) {
                                material.map.colorSpace = THREE.SRGBColorSpace;
                                material.map.needsUpdate = true;
                            }

                            material.needsUpdate = true;
                        });

                        if (!materiales.some(material => material && material.map)) {
                            console.warn(
                                nombreModelo +
                                ": no se encontró una textura principal (map) en este material."
                            );
                        }
                    });

                    // Ajustar el tamaño y centrar el modelo.
                    const caja = new THREE.Box3().setFromObject(modelo);
                    const centro = caja.getCenter(new THREE.Vector3());
                    const dimensiones = caja.getSize(new THREE.Vector3());

                    const dimensionMaxima = Math.max(
                        dimensiones.x,
                        dimensiones.y,
                        dimensiones.z
                    );

                    if (dimensionMaxima > 0) {
                        const escala = 0.5 / dimensionMaxima;

                        modelo.scale.setScalar(escala);
                        modelo.position.set(
                            -centro.x * escala,
                            -centro.y * escala,
                            -centro.z * escala
                        );
                    }

                    modelo.visible = false;
                    anchor.group.add(modelo);

                    console.log("Modelo cargado:", nombreModelo);

                    if (equipo.detectado) {
                        mostrarEquipo(equipo);
                    }
                },

                undefined,

                function (error) {
                    console.error(
                        "Error al cargar " + nombreModelo + ":",
                        error
                    );
                }
            );

            anchor.onTargetFound = function () {
                console.log(
                    "Objetivo detectado:",
                    indice,
                    nombreModelo
                );

                equipo.detectado = true;
                mostrarEquipo(equipo);
            };

            anchor.onTargetLost = function () {
                console.log("Objetivo perdido:", indice);
                equipo.detectado = false;

                if (equipo.modelo) {
                    equipo.modelo.visible = false;
                }

                if (indiceActivo === indice) {
                    modeloActivo = null;
                    indiceActivo = -1;
                    animandoModelo = false;

                    resultado.textContent =
                        "Buscando nuevamente los logos...";
                    resultado.className = "";

                    informacionEquipo.style.display = "none";
                }
            };
        }
    }

    // Iniciar o reanudar el renderizado de Three.js.
    function iniciarRenderizado() {
        rendererModelo.setAnimationLoop(function () {
            if (modeloActivo && animandoModelo) {
                modeloActivo.rotation.y += 0.01;
            }

            rendererModelo.render(escenaAR, camaraAR);
        });
    }

    async function iniciarAR() {
        if (iniciado || iniciando) return;
        iniciando = true;
        botonIniciar.disabled = true;

        try {
            if (!mindarThree) {
                prepararAR();
            }

            estado.textContent = "Iniciando cámara...";
            resultado.textContent = "Preparando realidad aumentada...";

            await mindarThree.start();

            iniciado = true;
            botonDetener.disabled = false;

            // Iniciar el renderizado después de que MindAR arranque.
            iniciarRenderizado();

            estado.textContent = "Cámara activa";
            resultado.textContent = "Busca cualquiera de los 15 logos...";
            resultado.className = "";

            console.log("MindAR iniciado correctamente");
        } catch (error) {
            console.error("Error al iniciar AR:", error);
            estado.textContent = "Error al iniciar";
            resultado.textContent =
                "No se pudo iniciar la cámara. Revisa permisos y utiliza HTTPS o localhost.";
        } finally {
            iniciando = false;
            botonIniciar.disabled = iniciado;
        }
    }

    function detenerAR() {
        if (!mindarThree || !iniciado) return;

        rendererModelo.setAnimationLoop(null);
        mindarThree.stop();

        iniciado = false;
        botonIniciar.disabled = false;
        botonDetener.disabled = true;
        animandoModelo = false;

        ocultarModelos();

        modeloActivo = null;
        indiceActivo = -1;

        equiposAR.forEach(function (equipo) {
            equipo.detectado = false;
        });

        estado.textContent = "Cámara detenida";
        resultado.textContent = "Cámara detenida.";
        resultado.className = "";
        informacionEquipo.style.display = "none";

        console.log("MindAR detenido");
    }

    botonPausar.addEventListener("click", function () {
        if (modeloActivo && modeloActivo.visible) {
            animandoModelo = false;
            console.log("Animación pausada");
        }
    });

    botonReanudar.addEventListener("click", function () {
        if (modeloActivo && modeloActivo.visible) {
            animandoModelo = true;
            console.log("Animación reanudada");
        }
    });

    botonConfetti.addEventListener("click", function () {
        if (!modeloActivo || !modeloActivo.visible) {
            alert("Primero detecta uno de los logos.");
            return;
        }

        if (typeof confetti === "function") {
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 }
            });
        } else {
            console.error("No se cargó la biblioteca canvas-confetti.");
        }
    });

    botonFoto.addEventListener("click", tomarFotoAR);

    function tomarFotoAR() {
        const contenedor = document.querySelector("#ar-container");
        const video = contenedor.querySelector("video");

        if (!iniciado || !rendererModelo || !escenaAR || !camaraAR) {
            alert("Primero inicia la cámara para tomar una foto.");
            return;
        }

        // Usar el renderer que dibuja escenaAR y camaraAR.
        const canvasModelo = rendererModelo.domElement;

        if (!video || !canvasModelo || video.videoWidth === 0) {
            console.error("La cámara o el canvas del modelo no están disponibles.");
            return;
        }

        // Asegurar que la escena se dibuje antes de tomar la foto.
        rendererModelo.render(escenaAR, camaraAR);

        const foto = document.createElement("canvas");
        foto.width = video.videoWidth;
        foto.height = video.videoHeight;

        const contexto = foto.getContext("2d");

        // Capturar la cámara.
        contexto.drawImage(video, 0, 0, foto.width, foto.height);

        // Superponer el canvas del renderer del modelo.
        contexto.drawImage(
            canvasModelo,
            0,
            0,
            foto.width,
            foto.height
        );

        const enlace = document.createElement("a");
        enlace.download = "foto-realidad-aumentada.png";
        enlace.href = foto.toDataURL("image/png");
        enlace.click();
    }

    botonDetener.disabled = true;
    botonIniciar.addEventListener("click", iniciarAR);
    botonDetener.addEventListener("click", detenerAR);
});
