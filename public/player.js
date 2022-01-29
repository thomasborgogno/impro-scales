const playPauseBtn = document.querySelector("#play_pause_btn")
const stopBtn = document.querySelector("#stop_btn")
const volumeBtn = document.querySelector("#volume_btn");
const playerDiv = document.querySelector("#player")

let audioCtx
try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  } catch (e) {
    throw "Could not instantiate AudioContext: " + e.message;
  }

// WaveSurfer initialization
var wavesurfer = WaveSurfer.create({
  audioContext: audioCtx,
  container: '#waveform',
  responsive: true,
  waveColor: 'grey',
  progressColor: '#2B6FAC',
  cursorColor: '#fff',
  barWidth: 2,
  height: 200,
  skipLength: 5,
});


// Functions
/**
 * Toggle play button
 */
 const togglePlay = () => {
  wavesurfer.playPause()
  const isPlaying = wavesurfer.isPlaying()
  if (isPlaying) {
    $("#play").hide();
    $("#pause").show();
    cursorStream();
  } else {
    $("#play").show();
    $("#pause").hide();
  }
}
/**
 * Stop playing
 */
 const stop = () => {
  wavesurfer.stop();
  $("#play").show();
  $("#pause").hide();
}
/**
 * Handles changing the volume slider input
 * @param {event} e
 */
const handleVolumeChange = e => {
  // Set volume as input value divided by 100
  // NB: Wavesurfer only excepts volume value between 0 - 1
  const volume = e.target.value / 100
  wavesurfer.setVolume(volume)
}
/**
 * Formats time as MM:SS
 * @param {number} seconds
 * @returns time as MM:SS
 */
const formatTimecode = seconds => {
  return new Date(seconds * 1000).toISOString().substr(14, 5)
}

/**
 * Toggles mute/unmute of the Wavesurfer volume
 * Also changes the volume icon and disables the volume slider
 */
const toggleMute = () => {
  wavesurfer.toggleMute()
  const isMuted = wavesurfer.getMute()
  if (isMuted) {
    $("#volOFF").show();
    $("#volON").hide();
    volumeSlider.disabled = true
  } else {
    $("#volON").show();
    $("#volOFF").hide();
    volumeSlider.disabled = false
  }
}
// --------------------------------------------------------- //

// Javascript Event listeners
playPauseBtn.addEventListener("click", togglePlay)
stopBtn.addEventListener("click", stop)
volumeBtn.addEventListener("click", toggleMute)
volumeSlider.addEventListener("input", handleVolumeChange)
// --------------------------------------------------------- //

// Wavesurfer event listeners
wavesurfer.on("ready", () => {
  // Set wavesurfer volume
  wavesurfer.setVolume(volumeSlider.value / 100)
  // Set audio track total duration
  const duration = wavesurfer.getDuration()
  totalDuration.innerHTML = formatTimecode(duration)
  $("#audioLoader").dimmer('hide');
  $("#emptyPlayer").hide();
  featureExtractor();
})

// not working, see github issues:
// wavesurfer.on('loading', function(perc) {})

// Sets the timecode current timestamp as audio plays
wavesurfer.on("audioprocess", () => {
  const time = wavesurfer.getCurrentTime()
  currentTime.innerHTML = formatTimecode(time)
})

// Resets the play button icon after audio ends
wavesurfer.on("finish", () => {
  $("#play").show();
  $("#pause").hide();
})


// keyboard event listener
$(document).on('keydown', function(e) {
  if(wavesurfer.isReady){
    var handled = false;
    if (e.key === ' ' || e.key === 'Spacebar') {
      handled = true;
      togglePlay();
    } else if (e.key === 'ArrowLeft') {
      handled = true;
      wavesurfer.skipBackward();
    } else if (e.key === 'ArrowRight') {
      handled = true;
      wavesurfer.skipForward();
    }
    if (handled) {
      e.preventDefault();
    }
  }
  
});
