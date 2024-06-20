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

function togglePreview() {
    shouldPlay = !shouldPlay;
    toggleButton = document.getElementById("spotify-preview-toggle");

    if (shouldPlay) {
        let links = document.getElementsByClassName("spotify-preview-link")
        for (let trackPreview of links) {
            let audioElement = new Audio(trackPreview.innerHTML);
            trackMap.set(trackPreview.innerHTML, audioElement);
        }

        toggleButton.style.background = "lightgreen";
    } else {
        toggleButton.style.background = "aliceblue";
    }
}

function previewSpotify(item) {
    if (shouldPlay) {
        let url = item.getElementsByClassName("spotify-preview-link")[0].innerHTML;
        currentlyPlaying = trackMap.get(url);
        currentlyPlaying.play();
    }
}

function stopSpotify() {
    if (currentlyPlaying !== null) {
        currentlyPlaying.pause();
    }
}

document.body.addEventListener("htmx:beforeSend", function(e) {
    document.body.style.cursor = "wait";
});

document.body.addEventListener("htmx:afterSwap", function(e) {
    document.body.style.cursor = "default";
});