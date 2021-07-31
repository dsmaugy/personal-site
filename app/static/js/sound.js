var soundHash = {};
var nowPlaying;

function playAudio(source) {
    let sound;

    if (source in soundHash) {
        sound = soundHash[source]
    } else {
        sound = new Audio(source)
        soundHash[source] = sound
    }

    let pauseCurrent = false
    if (nowPlaying) {
        soundHash[nowPlaying].pause()
        pauseCurrent = true
    }

    if (nowPlaying != source) {
        sound.currentTime = 0
        nowPlaying = source
        sound.play()
    } else if (pauseCurrent) {
        nowPlaying = null
    }

}