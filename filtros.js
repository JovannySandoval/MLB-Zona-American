function cambiarFiltro(filtro) {

    var camara = document.getElementById("camara");
    var nombre = document.getElementById("nombreFiltro");


    if (filtro == "normal") {

        camara.className = "camara filtro-normal";
        nombre.innerHTML = "Filtro normal";

    }


    if (filtro == "azul") {

        camara.className = "camara filtro-azul";
        nombre.innerHTML = "Filtro azul";

    }


    if (filtro == "rojo") {

        camara.className = "camara filtro-rojo";
        nombre.innerHTML = "Filtro rojo";

    }


    if (filtro == "beisbol") {

        camara.className = "camara filtro-beisbol";
        nombre.innerHTML = "Filtro béisbol";

    }

}
