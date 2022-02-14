let mic;
// global var getUserMedia mic stream
let gumStream;


// record native microphone input and do further audio processing on each audio buffer using the given callback functions
function startMicRecordStream(audioCtx, bufferSize, onProcessCallback, btnCallback) {
  // cross-browser support for getUserMedia
  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  window.URL =
    window.URL || window.webkitURL || window.mozURL || window.msURL;

  if (navigator.getUserMedia) {
    console.log("Initializing microphone audio...");
    navigator.getUserMedia(
      { audio: true, video: false },
      function(stream) {
        gumStream = stream;
        if (gumStream.active) {
          console.log(
            "Audio context sample rate = " + audioCtx.sampleRate
          );
          mic = audioCtx.createMediaStreamSource(stream);
          // We need the buffer size that is a power of two
          if (bufferSize % 2 != 0 || bufferSize < 4096) {
            throw "Choose a buffer size that is a power of two and greater than 4096";
          }
          // In most platforms where the sample rate is 44.1 kHz or 48 kHz,
          // and the default bufferSize will be 4096, giving 10-12 updates/sec.
          console.log("Buffer size = " + bufferSize);
          if (audioCtx.state == "suspended") {
            audioCtx.resume();
          }
          scriptNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
          // onprocess callback (here we can use essentia.js algos)
          scriptNode.onaudioprocess = onProcessCallback;

          mic.connect(scriptNode);
          scriptNode.connect(audioCtx.destination);

          if (btnCallback) {
            btnCallback();
          }
        } else {
          throw "Mic stream not active";
        }
      },
      function(message) {
        throw "Could not access microphone - " + message;
      }
    );
  } else {
    throw "Could not access microphone - getUserMedia not available";
  }
}

function stopMicRecordStream() {
  let recording = $('#play_mic_btn').hasClass("recording");
  if (recording) {
    $('#mic_ready').show();
    $('#mic_stop').hide();
    $('#currentNoteHeader').css({'color': 'black'});
    printCorrectNote();
    $('#currentNoteDiv').hide();

    console.log("Stopped recording ...");
    // stop mic stream
    gumStream.getAudioTracks().forEach(function(track) {
      track.stop();
    });
    $("#play_mic_btn").removeClass("recording");

    audioCtx.suspend().then(() => {
      mic.disconnect();
      scriptNode.disconnect();

      mic, scriptNode = null;
    });
  }
}

let noteBuffer = [];
const noteBufferSize = 3;
let silence = 0;
const silenceThreshold = 20;

// ScriptNodeProcessor callback function to extract pitchyin feature using essentia.js and plotting it on the front-end
function onRecordFeatureExtractor(event) {

  let audioBuffer = event.inputBuffer.getChannelData(0);
  let audioVectorBuffer = essentiaExtractor.arrayToVector(audioBuffer);

  // compute RMS for thresholding:
  const rms = essentiaExtractor.RMS(audioVectorBuffer).rms;
  // console.info(rms);
  if (rms >= 0.05) {
    if (silence) {
      silence = 0;
      // $('#currentNoteHeader').show();
    }
    const prevNote = mostFrequent(noteBuffer);

    // compute hpcp for overlapping frames of audio
    const hpcp = essentiaExtractor.hpcpExtractor(audioBuffer);

    const scaledHPCP = hpcp.map(i => 100*Math.tanh(Math.pow(i*0.5, 2)));
    // console.log(`scaled: ${scaledHPCP}`);
    noteBuffer.push( notes[indexOfMax(scaledHPCP)] );

    if (noteBuffer.length === noteBufferSize) {

      const currNote = mostFrequent(noteBuffer);

      if (currNote != prevNote) {
        if (jQuery.isEmptyObject(session)) { // if there isn't a song loaded, print just the current note
          printGenericNote(currNote);
        } else {
          ++session.statsArray[notes.indexOf(currNote)];
          if (session.scaleArray.includes(currNote)) {
            printCorrectNote(currNote);
          } else {
            printOutOfScaleNote(currNote);
          }
        }
      }
      noteBuffer.shift();

    } else while (noteBuffer.length >= noteBufferSize) {
      noteBuffer.shift();
    }

    // console.log(currentNote);
  } else {
    if(silence >= 0 && ++silence > silenceThreshold) {
      $('#currentNoteHeader').css({'color': 'black'});
      printCorrectNote();
      silence = -1;
    }
  }
}

// ON DOCUMENT READY
$(function () {

});

// BTN LISTENERS
$('#play_mic_btn').on('click', function(){

  let recording = $(this).hasClass("recording");
  if (!recording) {

    noteBuffer = [];
    loadStats();
    // start microphone stream using getUserMedia
    startMicRecordStream(
      audioCtx,
      bufferSize,
      onRecordFeatureExtractor, // essentia.js feature extractor callback function
      function() {
        // called when the promise fulfilled
        $("#play_mic_btn").addClass("recording");
        $('#mic_ready').hide();
        $('#mic_stop').show();
        // $("#play_mic_btn").prop("disabled", false);
      }
    );

    // start playing the song
    if (!wavesurfer.isPlaying()) {
      togglePlay();
    }

  } else {
    stopMicRecordStream();
    if (wavesurfer.isPlaying()) {
      togglePlay();
    }
    saveStats();
    saveSession();
  }
})