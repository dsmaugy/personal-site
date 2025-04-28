let shouldPlay = false;
let trackMap = new Map();
let currentlyPlaying = null;

function carouselItemEntered(item) {
  let tooltipElement = item.getElementsByClassName("carousel-tooltip");
  let tooltipArea = document.getElementById("left-panel-tooltip");

  tooltipArea.innerHTML = tooltipElement[0].innerHTML;
}

function carouselItemLeft(item) {
  let tooltipArea = document.getElementById("left-panel-tooltip");

  tooltipArea.innerHTML = "";
}

document.body.addEventListener("htmx:beforeSend", function (e) {
  document.body.style.cursor = "wait";
});

document.body.addEventListener("htmx:afterSwap", function (e) {
  document.body.style.cursor = "default";
});

