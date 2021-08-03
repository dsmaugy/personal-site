const PLAY_ICON = "bi bi-play-circle-fill play-toggle"
const PAUSE_ICON = "bi bi-pause-circle-fill play-toggle"

var soundHash = [];
var nowPlayingID;

function artistButtonPress(source, songID) {
    let sound;

    if (soundHash[songID] != null) {
        sound = soundHash[songID]
    } else {
        sound = new Audio(source)
        sound.volume = 0.15
        soundHash[songID] = sound
        sound.onended = songEnded
    }

    let pauseCurrent = false
    if (nowPlayingID != null) {
        soundHash[nowPlayingID].pause()
        document.getElementById("play-toggle-" + nowPlayingID).className = PLAY_ICON
        pauseCurrent = true
    }

    if (nowPlayingID != songID) {
        sound.currentTime = 0
        nowPlayingID = songID

        document.getElementById("play-toggle-" + nowPlayingID).className = PAUSE_ICON
        sound.play()
    } else if (pauseCurrent) {
        nowPlayingID = null
    }

}

function songEnded() {
    document.getElementById("play-toggle-" + nowPlayingID).className = PLAY_ICON
    nowPlayingID = null
}