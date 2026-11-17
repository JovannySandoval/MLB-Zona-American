
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // ELEMENTOS HTML
    // ==========================================

    const contenedor = document.querySelector("#ar-container");
    const estado = document.getElementById("estadoAR");
    const resultado = document.getElementById("resultadoAR");

    const botonIniciar = document.getElementById("iniciarAR");
    const botonDetener = document.getElementById("detenerAR");
    const botonPausar = document.getElementById("pausarModelo");
    const botonReanudar = document.getElementById("reanudarModelo");
    const botonConfetti = document.getElementById("botonConfetti");
    const botonFoto = document.getElementById("tomarFoto");

    const seccionModelo = document.querySelector(".modelo-web");

    // ==========================================
    // VARIABLES
    // ==========================================

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

    // Mostrar los controles del modelo.
    if (seccionModelo) {
        seccionModelo.style.display = "block";
    }

    // ==========================================
    // OCULTAR MODELOS
    // ==========================================

    function ocultarModelos() {

        equiposAR.forEach(function (equipo) {

            if (equipo.modelo) {
                equipo.modelo.visible = false;
            }

        });

    }

    // ==========================================
    // MOSTRAR MODELO DETECTADO
    // ==========================================

    function mostrarEquipo(equipo) {

        indiceActivo = equipo.indice;
        modeloActivo = equipo.modelo;

        ocultarModelos();

        resultado.textContent =
            "Logo detectado. Objetivo " + (equipo.indice + 1);

        resultado.className = "detectado";

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

    // ==========================================
    // PREPARAR REALIDAD AUMENTADA
    // ==========================================

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

        // ======================================
        // ILUMINACIÓN
        // ======================================

        scene.add(
            new THREE.HemisphereLight(
                0xffffff,
                0x666677,
                2
            )
        );

        const luzPrincipal =
            new THREE.DirectionalLight(0xffffff, 2);

        luzPrincipal.position.set(1, 3, 2);

        scene.add(luzPrincipal);

        scene.add(
            new THREE.AmbientLight(0xffffff, 0.5)
        );

        // ======================================
        // CREAR 15 ANCLAJES
        // ======================================

        for (let i = 0; i < 15; i++) {

            const indice = i;

            const anchor = mindarThree.addAnchor(indice);

            const nombreModelo =
                "Mod" + (indice + 1) + ".glb";

            const equipo = {

                indice: indice,
                anchor: anchor,
                modelo: null,
                detectado: false

            };

            equiposAR.push(equipo);

            // ==================================
            // CARGAR MODELO 3D
            // ==================================

            loader.load(

                "./assets/" + nombreModelo,

                function (gltf) {

                    const modelo = gltf.scene;

                    equipo.modelo = modelo;

                    // Mantener materiales y texturas.

                    modelo.traverse(function (objeto) {

                        if (!objeto.isMesh) {
                            return;
                        }

                        objeto.castShadow = true;
                        objeto.receiveShadow = true;

                        const materiales =
                            Array.isArray(objeto.material)
                                ? objeto.material
                                : [objeto.material];

                        materiales.forEach(function (material) {

                            if (!material) {
                                return;
                            }

                            if (material.map) {

                                material.map.colorSpace =
                                    THREE.SRGBColorSpace;

                                material.map.needsUpdate = true;

                            }

                            material.needsUpdate = true;

                        });

                        if (!materiales.some(
                            material => material && material.map
                        )) {

                            console.warn(
                                nombreModelo +
                                ": no se encontró textura principal."
                            );

                        }

                    });

                    // ==================================
                    // AJUSTAR TAMAÑO Y CENTRAR
                    // ==================================

                    const caja =
                        new THREE.Box3().setFromObject(modelo);

                    const centro =
                        caja.getCenter(new THREE.Vector3());

                    const dimensiones =
                        caja.getSize(new THREE.Vector3());

                    const dimensionMaxima = Math.max(

                        dimensiones.x,
                        dimensiones.y,
                        dimensiones.z

                    );

                    if (dimensionMaxima > 0) {

                        const escala =
                            0.5 / dimensionMaxima;

                        modelo.scale.setScalar(escala);

                        modelo.position.set(

                            -centro.x * escala,
                            -centro.y * escala,
                            -centro.z * escala

                        );

                    }

                    modelo.visible = false;

                    anchor.group.add(modelo);

                    console.log(
                        "Modelo cargado:",
                        nombreModelo
                    );

                    // Si ya se detectó el logo,
                    // mostrar el modelo al terminar de cargar.

                    if (equipo.detectado) {

                        mostrarEquipo(equipo);

                    }

                },

                undefined,

                function (error) {

                    console.error(
                        "Error al cargar " + nombreModelo,
                        error
                    );

                    if (
                        equipo.detectado &&
                        indiceActivo === equipo.indice
                    ) {

                        resultado.textContent =
                            "Logo detectado, pero no se pudo " +
                            "cargar el modelo " + nombreModelo;

                    }

                }

            );

            // ==================================
            // LOGO DETECTADO
            // ==================================

            anchor.onTargetFound = function () {

                console.log(
                    "Objetivo detectado:",
                    indice,
                    nombreModelo
                );

                equipo.detectado = true;

                mostrarEquipo(equipo);

            };

            // ==================================
            // LOGO PERDIDO
            // ==================================

            anchor.onTargetLost = function () {

                console.log(
                    "Objetivo perdido:",
                    indice
                );

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

                }

            };

        }

    }

    // ==========================================
    // RENDERIZADO Y ANIMACIÓN
    // ==========================================

    function iniciarRenderizado() {

        if (!rendererModelo) {
            return;
        }

        rendererModelo.setAnimationLoop(function () {

            if (modeloActivo && animandoModelo) {

                modeloActivo.rotation.y += 0.01;

            }

            rendererModelo.render(
                escenaAR,
                camaraAR
            );

        });

    }

    // ==========================================
    // INICIAR CÁMARA
    // ==========================================

    async function iniciarAR() {

        if (iniciado || iniciando) {
            return;
        }

        iniciando = true;

        botonIniciar.disabled = true;

        estado.textContent = "Iniciando cámara...";

        resultado.textContent =
            "Preparando realidad aumentada...";

        try {

            if (!mindarThree) {

                prepararAR();

            }

            await mindarThree.start();

            iniciado = true;

            botonDetener.disabled = false;

            iniciarRenderizado();

            estado.textContent = "Cámara activa";

            resultado.textContent =
                "Busca cualquiera de los 15 logos...";

            resultado.className = "";

            console.log(
                "MindAR iniciado correctamente"
            );

        } catch (error) {

            console.error(
                "Error al iniciar Realidad Aumentada:",
                error
            );

            estado.textContent =
                "Error al iniciar cámara";

            resultado.textContent =
                "No se pudo iniciar la Realidad Aumentada. " +
                "Verifica los permisos de cámara, la conexión " +
                "y los archivos del proyecto.";

            botonDetener.disabled = true;

        } finally {

            iniciando = false;

            botonIniciar.disabled = iniciado;

        }

    }

    // ==========================================
    // DETENER CÁMARA
    // ==========================================

    async function detenerAR() {

        if (!mindarThree || !iniciado) {
            return;
        }

        botonDetener.disabled = true;

        try {

            if (rendererModelo) {

                rendererModelo.setAnimationLoop(null);

            }

            await mindarThree.stop();

            iniciado = false;

            animandoModelo = false;

            ocultarModelos();

            modeloActivo = null;
            indiceActivo = -1;

            equiposAR.forEach(function (equipo) {

                equipo.detectado = false;

            });

            estado.textContent =
                "Cámara detenida";

            resultado.textContent =
                "Cámara detenida.";

            resultado.className = "";

            console.log("MindAR detenido");

        } catch (error) {

            console.error(
                "Error al detener cámara:",
                error
            );

            estado.textContent =
                "Error al detener cámara";

            resultado.textContent =
                "No se pudo detener correctamente la cámara.";

        } finally {

            botonIniciar.disabled = iniciado;

            botonDetener.disabled = !iniciado;

        }

    }

    // ==========================================
    // PAUSAR ANIMACIÓN
    // ==========================================

    if (botonPausar) {

        botonPausar.addEventListener(
            "click",
            function () {

                if (
                    modeloActivo &&
                    modeloActivo.visible
                ) {

                    animandoModelo = false;

                    console.log(
                        "Animación pausada"
                    );

                }

            }
        );

    }

    // ==========================================
    // REANUDAR ANIMACIÓN
    // ==========================================

    if (botonReanudar) {

        botonReanudar.addEventListener(
            "click",
            function () {

                if (
                    modeloActivo &&
                    modeloActivo.visible
                ) {

                    animandoModelo = true;

                    console.log(
                        "Animación reanudada"
                    );

                }

            }
        );

    }

    // ==========================================
    // LANZAR CONFETI
    // ==========================================

    if (botonConfetti) {

        botonConfetti.addEventListener(
            "click",
            function () {

                if (
                    !modeloActivo ||
                    !modeloActivo.visible
                ) {

                    alert(
                        "Primero detecta uno de los logos."
                    );

                    return;

                }

                if (typeof confetti === "function") {

                    confetti({

                        particleCount: 150,
                        spread: 90,
                        origin: { y: 0.6 }

                    });

                } else {

                    console.error(
                        "No se cargó canvas-confetti."
                    );

                }

            }
        );

    }

    // ==========================================
    // TOMAR FOTOGRAFÍA
    // ==========================================

    function tomarFotoAR() {

        if (
            !iniciado ||
            !rendererModelo ||
            !escenaAR ||
            !camaraAR
        ) {

            alert(
                "Primero inicia la cámara para tomar una foto."
            );

            return;

        }

        const video = contenedor.querySelector("video");

        const canvasModelo =
            rendererModelo.domElement;

        if (
            !video ||
            !canvasModelo ||
            video.videoWidth === 0
        ) {

            console.error(
                "La cámara o el modelo no están disponibles."
            );

            alert(
                "Espera a que la cámara termine de cargar."
            );

            return;

        }

        rendererModelo.render(
            escenaAR,
            camaraAR
        );

        const foto =
            document.createElement("canvas");

        foto.width = video.videoWidth;
        foto.height = video.videoHeight;

        const contexto = foto.getContext("2d");

        if (!contexto) {
            return;
        }

        // Capturar imagen de la cámara.

        contexto.drawImage(

            video,
            0,
            0,
            foto.width,
            foto.height

        );

        // Superponer modelo 3D.

        contexto.drawImage(

            canvasModelo,
            0,
            0,
            foto.width,
            foto.height

        );

        try {

            const enlace =
                document.createElement("a");

            enlace.download =
                "foto-realidad-aumentada.png";

            enlace.href =
                foto.toDataURL("image/png");

            enlace.click();

        } catch (error) {

            console.error(
                "Error al guardar fotografía:",
                error
            );

            alert(
                "No se pudo guardar la fotografía."
            );

        }

    }

    if (botonFoto) {

        botonFoto.addEventListener(
            "click",
            tomarFotoAR
        );

    }

    // ==========================================
    // EVENTOS PRINCIPALES
    // ==========================================

    botonDetener.disabled = true;

    botonIniciar.addEventListener(
        "click",
        iniciarAR
    );

    botonDetener.addEventListener(
        "click",
        detenerAR
    );

});
