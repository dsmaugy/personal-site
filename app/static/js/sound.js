var soundHash = {};
var nowPlaying;

function playAudio(source) {
    var sound;

    if (source in soundHash) {
        sound = soundHash[source]
    } else {
        sound = new Audio(source)
        soundHash[source] = sound
    }

    if (nowPlaying) {
        soundHash[nowPlaying].pause()
    }

    if (nowPlaying != source) {
        sound.currentTime = 0
        nowPlaying = source
        sound.play()
    }
}