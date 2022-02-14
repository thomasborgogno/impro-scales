
// global var to load essentia.js core instance
let essentiaExtractor;
let isEssentiaInstance = false;
// buffer size microphone stream (bufferSize is high in order to make PitchYinProbabilistic algo to work)
// let bufferSize = 8192;
// let hopSize = 2048;
let bufferSize = 4096;
let hopSize = 512;
let chordConfidence = 0.75;

let session = {};
let newSession;
let audioData;

// let filePicker = document.getElementById('filePicker')
let chordsCursor = 0;
let chordsArray = [];
let ticksArray = [];

let scriptNode;

/*
const computeChords = function(audioVectorBuffer) {

  let hpcpPool = new essentiaExtractor.module.VectorVectorFloat();

  // audio frame => windowing => spectrum => spectral peak => spectral whitening => HPCP => ChordDetection
  let windowOut = essentiaExtractor.Windowing(
    audioVectorBuffer,
    true,
    bufferSize,
    "blackmanharris62"
  );

  let spectrumOut = essentiaExtractor.Spectrum(windowOut.frame, bufferSize);

  let peaksOut = essentiaExtractor.SpectralPeaks(
    spectrumOut.spectrum,
    0,
    4000,
    100,
    60,
    "frequency",
    audioCtx.sampleRate
  );

  let whiteningOut = essentiaExtractor.SpectralWhitening(
    spectrumOut.spectrum,
    peaksOut.frequencies,
    peaksOut.magnitudes,
    4000,
    audioCtx.sampleRate
  );

  let hpcpOut = essentiaExtractor.HPCP(
    peaksOut.frequencies,
    whiteningOut.magnitudes,
    true,
    500,
    0,
    4000,
    false,
    60,
    true,
    "unitMax",
    440,
    audioCtx.sampleRate,
    12
  );

  hpcpPool.push_back(hpcpOut.hpcp);

  let chordDetect = essentiaExtractor.ChordsDetection(hpcpPool, bufferSize, audioCtx.sampleRate);

  let chords = chordDetect.chords.get(0);
  
  let chordsStrength = chordDetect.strength.get(0);
    
  return {chord: chords, strength: chordsStrength};
};
*/


function getVideoInfo(videoURL) {
  let videoINFO;
  // get video info
  var infoURL = "https://www.youtube.com/oembed?url=" + videoURL + "&format=json"
  
  fetch(infoURL)
      .then(response => response.json()).then( json => videoINFO = json)
      .catch(error => console.error(error))
      .finally(() => {
        // save info in session
        session.title = videoINFO.title;
        session.channel = videoINFO.author_name;
        session.channelURL = videoINFO.author_url;
        printVideoInfo();
  });
}

function printVideoInfo(){
  // $('#vidTitleHeader').text(session.title);
  // $('#vidTitleHeader').attr('href', session.videoURL);
  // $('#vidAuthorHeader').text(session.channel);
  // $('#vidAuthorHeader').attr('href', session.channelURL);
}


async function fetchYoutubeAudio() {
  var videoURL = document.getElementById("input_yt_url").value;

  if(videoURL !== "") {
    session.videoURL = videoURL;
    getVideoInfo(videoURL);

    session.audioURL = "http://" + window.location.host + "/youtube/?link=" + videoURL;
    // console.log(session);
    loadWaveform();
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Empty field',
      text: 'Please insert a youtube link to load a song.'
    })  
  }
    // } else {
    //   $("#emptyPlayer").fadeIn();
    //   Swal.fire({
    //     icon: 'error',
    //     title: 'Error while fetching the audio',
    //     text: 'Please check the link or try with another link.'
    //   })  
    // }
}

// callback function which compute Chords and features of the audio and saves in the session
async function featureExtractor() {
  $('.text.loader').text('Analyzing audio track, please wait...')

  // load audio file from an url
  audioData = await essentiaExtractor.getAudioChannelDataFromURL(session.audioURL, audioCtx, 0);
  let signal = essentiaExtractor.arrayToVector(audioData);

  session.bpm = parseInt(essentiaExtractor.PercivalBpmEstimator(signal).bpm);

  let tonal = essentiaExtractor.TonalExtractor(signal);
  session.key = tonal.key_key;
  session.scaleName = tonal.key_scale === 'major' ? getObjectKeyByPrefix(scales, "Ionian") : getObjectKeyByPrefix(scales, "Aeolian");
  session.scaleArray = getScaleArray(session.key, session.scaleName);

  let ticks = await essentiaExtractor.BeatTrackerMultiFeature(signal).ticks;
  // let ticks = await essentiaExtractor.BeatTrackerDegara(signal).ticks;

  let hpcpPool = new essentiaExtractor.module.VectorVectorFloat();
  // Generate overlapping frames with given frameSize and hopSize
  let audioFrames = essentiaExtractor.FrameGenerator(audioData, bufferSize, hopSize);
  for (var i=0; i<audioFrames.size(); i++) {
    hpcpPool.push_back(essentiaExtractor.arrayToVector(essentiaExtractor.hpcpExtractor(essentiaExtractor.vectorToArray(audioFrames.get(i)))));
  }
  
  // let detChords = await essentiaExtractor.ChordsDetectionBeats(hpcpPool, ticks, 'starting_beat');
  let detChords = await essentiaExtractor.ChordsDetectionBeats(hpcpPool, ticks, 'interbeat_median');

  //print chords
  chordsArray = [];
  let chordsSet = new Set();
  ticksArray = [];
  for (var i=0; i<detChords.chords.size(); i++) {

    while(detChords.strength.get(i) < chordConfidence){
      ++i;
    }
    while( (chordsArray.length > 0 && detChords.chords.get(i) === chordsArray.at(-1)) || detChords.strength.get(i) < chordConfidence ) {
      // discard the current chord if it's equals to the previous or if it's too weak
      ++i;
    }
    
    if(i < detChords.chords.size()) {
      console.log(formatTimecode(ticks.get(i)) + "s:\t" + detChords.chords.get(i) + "\ts: " + parseInt(detChords.strength.get(i)*100));

      chordsSet.add(detChords.chords.get(i));
      chordsArray.push(detChords.chords.get(i));
      ticksArray.push(ticks.get(i));
    }
    
  }

  let chordsString = "";
  for(const c of chordsSet){
    chordsString += c + ", ";
  }
  session.chordsSet = chordsString.slice(0, -2);

  session.chordsArray = JSON.stringify(chordsArray);
  session.ticksArray = JSON.stringify(ticksArray);
  
  printFeatures();
  $('#loader').dimmer('hide');
  togglePlay();

  session.statsArray = Array(12).fill(0);
  saveSession();
}

function printFeatures(){

  $("#keyHeader").text(session.key);
  $('#bpmHeader').text(session.bpm + "bpm")
  $('#scaleHeader').text(session.scaleName);

  printStats();

  $("#nowPlayingHeader").text("Now playing: " + session.title)
  $("#nowPlayingHeader").attr('href', session.videoURL);

  printScaleDisplay();
  
  // $('#chordsSet').text(session.chordsSet);
  updateChords();
  $('#chordsDiv').fadeIn();
}

function updateChords() {
  // <-
  if(chordsCursor >= 1) $("#previousChordHeader").text(chordsArray[chordsCursor - 1]);
  else $("#previousChordHeader").text("");
  // |
  if(chordsCursor < chordsArray.length) $("#currentChordHeader").text(chordsArray[chordsCursor]);
  else $("#currentChordHeader").text("");
  // ->
  if(chordsCursor + 1 < chordsArray.length) $("#nextChordHeader").text(chordsArray[chordsCursor + 1]);
  else $("#nextChordHeader").text("");
}


// DOCUMENT READY
$(function () {
  // loads the WASM backend and runs the feature extraction

  if(audioCtx.sampleRate != 44100) {
    $('#sampleRateMsg').fadeIn();
  } else {
    $('#sampleRateMsg').fadeOut();
  }

  EssentiaWASM().then(function (essentiaWasmModule) {
    if (!isEssentiaInstance) {
      essentiaExtractor = new EssentiaExtractor(essentiaWasmModule);
      // settings specific to an algorithm
      // essentiaExtractor.profile.HPCP.nonLinear = true;
      // modifying default extractor settings
      essentiaExtractor.bufferSize = bufferSize;
      essentiaExtractor.hopSize = hopSize;
      essentiaExtractor.sampleRate = audioCtx.sampleRate;
      essentiaExtractor.profile.HPCP.normalized = 'none';
      essentiaExtractor.profile.HPCP.harmonics = 0;
      isEssentiaInstance = true;
    }
  });
});

// buttons listener
$('#load_audio_btn').on('click', function(){
  stop();
  clearCanvas();
  $("#keyHeader").text("");
  $('#scaleHeader').text("");
  $("#bpmHeader").text("");
  $("#chordsSet").text("");
  newSession = true;
  fetchYoutubeAudio();
});

$('.ui.accordion').accordion();

$('.message .close').on('click', function() {
  $(this).closest('.message').fadeOut();
});

$('#volume_btn').popup({ position: 'right center', hoverable: true });

$('.ui.toggle').checkbox({
  onChecked: function () { 
    printChordsLines(); 
    $('#chordsDisplay').fadeIn();
    $('#chordsDiv').css({'padding-bottom':'40px'});
    // $('#chordsSetSegment').fadeIn();
  },
  onUnchecked: function () { 
    clearCanvas(); 
    $('#chordsDisplay').fadeOut();
    $('#chordsDiv').css({'padding-bottom':'0px'});
    // $('#chordsSetSegment').fadeOut();
  }
});

// keyboard Enter event listener for link input
$('#input_yt_url').on('keydown', function(e) {

  if (e.key === 'Enter') {
    $('#load_audio_btn').trigger('click');
    e.preventDefault();
  }  
});