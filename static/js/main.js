
function carouselItemEntered(item) {
    let tooltipElement = item.getElementsByClassName("carousel-tooltip");
    let tooltipArea = document.getElementById("left-panel-tooltip");

    tooltipArea.innerHTML = tooltipElement[0].innerHTML;
}

function carouselItemLeft(item) {
    let tooltipArea = document.getElementById("left-panel-tooltip");

    tooltipArea.innerHTML = "";
}