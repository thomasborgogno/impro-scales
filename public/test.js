var signal = typedFloat32Array2Vec(myAppSettings.uploadAudioData);
//= audiovector


// audiodata è l'altro

function onFileUploadProcessRhythmCategory(signal) {

  if (myAppSettings.doPlot.beatTracker) {
      var beats = computBeatTrackerMultiFeature(signal);
      var dataObj = {
          ticks: beats,
      }
      plotTimeSeriesOverlayAudio(dataObj, myAppSettings.initiatePlot.beatTracker, myDataVizSettings.beatTracker, 'beattracker-div', 'BeatTrackerMultiFeature');
  }   
}


const computBeatTrackerMultiFeature = function(signal) {
  var ticks = new Module.VectorFloat();
  var confidence = 0.;
  Module.beatTrackerMultiFeature(signal, ticks, confidence);
  var beatTicks = vec2typedFloat32Array(ticks);
  console.log('confidence: ', confidence);
  // bad hack to free the vectors
  ticks.resize(0, 1);
  return beatTicks;
}

