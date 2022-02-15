
// SESSION
let sessionsList = {};

function saveSession() {
  
  if (sessionsList === null) {
    sessionsList = {};
  }
  if (typeof (Storage) != "undefined") {
    sessionsList[session.title] = JSON.stringify(session);
    localStorage.setItem("sessionsList", JSON.stringify(sessionsList));
    console.log('Saving session:');
    console.log(sessionsList[session.title]);
    console.log("Sessions list:");
    console.log(sessionsList);
    printAllSessions();
  }

}

function deleteSession(title) {
  if (sessionsList[title]) {
    console.log("Deleting session: " + title);
    delete sessionsList[title];
  }
  if (typeof (Storage) != "undefined" && jQuery.isEmptyObject(session)) {
    localStorage.setItem("sessionsList", JSON.stringify(sessionsList));
  }
}

function printAllSessions() {

  showSessionRelatedThings();

  if (typeof (Storage) != "undefined") {

    // retrive sessions
    sessionsList = JSON.parse(localStorage.getItem("sessionsList"));

    // if there are session stored and the page is reloaded (empty session) or there are more than 1 sessions saved
    if (sessionsList === null) {
      sessionsList = {};
    }
    console.log("Sessions:");
    console.log(sessionsList);

    if ((jQuery.isEmptyObject(session) && !jQuery.isEmptyObject(sessionsList)) || Object.keys(sessionsList).length >= 2) {

      //clear the previous sessions list
      $('#sessionsList').empty();

      //print and show the new sessions list
      for (const title in sessionsList) {
        if (title != 'undefined') {
          addSessionItem(title);
        }
      }
      $('#storageSegment').fadeIn();

    } else {
      $('#storageSegment').fadeOut();
    }
  }
}

function loadSession(title) {
  console.log(title);
  session = {};

  if (!jQuery.isEmptyObject(sessionsList) && sessionsList[title] != null) {
    session = JSON.parse(sessionsList[title]);

  } else if (typeof (Storage) != "undefined") {
    // retrive session list
    sessionsList = JSON.parse(JSON.stringify(localStorage));

    if (!jQuery.isEmptyObject(sessionsList) && sessionsList[title] != null) {
      session = JSON.parse(sessionsList[title]);
    } 

  }
}

function addSessionItem(title) {
  var li = document.createElement("li");
  li.setAttribute('id', title);
  li.appendChild(document.createTextNode(title));
  $('#sessionsList').append(li);
}

// STATS

function saveStats() {
  if (typeof (Storage) != "undefined") {
    // save global stats
    localStorage.setItem("num_correct_notes", numCorrectNotes);
    localStorage.setItem("num_wrong_notes", numWrongNotes);
  }
}

function loadStats() {
  if (typeof (Storage) != "undefined") {

    // retrive or create global stats
    const correctNotes = parseInt(localStorage.getItem("num_correct_notes"));
    if (isNaN(correctNotes)) {
      saveStats();
    } else {
      numCorrectNotes = parseInt(localStorage.getItem("num_correct_notes"));
      numWrongNotes = parseInt(localStorage.getItem("num_wrong_notes"));
    }
    printStats();
    // if (!jQuery.isEmptyObject(storageList) && storageList[title] != null) {
    //   session = {};
    //   session = JSON.parse(storageList[title]);
    // }
  }
}


function showSessionRelatedThings() {

  if (jQuery.isEmptyObject(session)) {
    $('#delete_song_btn').fadeOut();
    $('#edit_tonal_btn').fadeOut();
    $('#tonalInfoDiv').fadeOut();
    $('#scaleStatsDiv').fadeOut();
    printScaleDisplay(true);
    wavesurfer.empty();
    $("#nowPlayingHeader").text("");

  } else {
    $('#delete_song_btn').fadeIn();
    $('#edit_tonal_btn').fadeIn();
    $('#tonalInfoDiv').fadeIn();
    $('#scaleStatsDiv').fadeIn();
  }
}

function updateFormScaleAndNotes(key, scaleName) {
  // console.log(key, scaleName);
  const scaleDesc = scales[scaleName]["description"];
  const scaleNotes = getScaleArray(key, scaleName).join(',\xa0\xa0 ');

  $('#modeDescriptionMessage').text(scaleDesc);
  $('#notesInKeyMessage').text(scaleNotes);
}


// DOCUMENT READY
$(function () {
  printAllSessions();
  loadStats();
});


//  btns listener
$('#sessionsList').on('click', async function (e) {
  if (e.target && e.target.matches('li')) {
    let title = e.target.innerText;
    stop();
    stopMicRecordStream();
    $('#modalOpenSongName').text(title);
    $('#openSessionModal').modal({ context: '#openSessionWrapper' }).modal('show');
    loadSession(title);
  }
});

$('#modal_load_session_btn').on('click', function () {
  newSession = false;
  showSessionRelatedThings();
  loadWaveform();
  chordsArray = Object.values(JSON.parse(session.chordsArray));
  ticksArray = Object.values(JSON.parse(session.ticksArray));
  console.log("Loading session:")
  console.log(session);
  clearCanvas();
  printVideoInfo();
  printFeatures();
});

$('#clear_storage_btn').on('click', function () {
  $('#deleteAllSessionsModal').modal('show');
});

$('#modal_delete_all_songs_btn').on('click', function () {
  stop();
  stopMicRecordStream();
  sessionsList = {};
  session = {};
  deleteSession("");
  printAllSessions();
});

$('#edit_tonal_btn').on('click', function () {
  // initialize the scales dropdown
  let dropdownScales = [];
  let selectedValue;
  $.each(scales, function (name) {
    let tmp = {};
    tmp.name = name;
    tmp.value = scales[name]["index"];
    tmp.description = scales[name]["type"];
    if (name === session.scaleName) selectedValue = tmp.value;
    dropdownScales.push(tmp);
  });

  $('.ui.scale.dropdown').dropdown({ 
    values: dropdownScales,
    onChange: function() {
      const scaleName = $(this).find('option:selected').text();
      const key = $('.ui.key.dropdown').find('option:selected').text();
      updateFormScaleAndNotes(key, scaleName);
    }    
  });

  $('.ui.scale.dropdown').dropdown('set selected', selectedValue.toString());
  
  // set up the form labels
  $('#song_title_input').val(session.title);
  
  $('.ui.key.dropdown select').val(notes.indexOf(session.key)).trigger('change');
  updateFormScaleAndNotes(session.key, session.scaleName);

  // shows the modal form
  $('#editSessionModal').modal({ context: '#editSessionWrapper' }).modal('show');
});


$('.ui.key.dropdown').dropdown({
  onChange: function(key) {
    const scaleName = $('.ui.scale.dropdown').find('option:selected').text();
    updateFormScaleAndNotes(notes[key], scaleName);
  }
});

$('#modal_save_edit_btn').on('click', function () {
  const newTitle = $('#song_title_input').val();
  if (newTitle != session.title) {
    deleteSession(session.title);
    session.title = newTitle;
    console.log(session);
  }

  session.key = $('.ui.key.dropdown').find('option:selected').text();
  session.scaleName = $('.ui.scale.dropdown').find('option:selected').text();
  session.scaleArray = getScaleArray(session.key, session.scaleName);
  session.statsArray = Array(12).fill(0);
  saveSession();
  printVideoInfo();
  printFeatures();
});


$('#delete_song_btn').on('click', function () {
  $('#modalDeleteSongName').text(session.title);
  $('#deleteSessionModal').modal('show');
});

$('#modal_delete_song_btn').on('click', function () {
  stop();
  stopMicRecordStream();
  const title = session.title;
  session = {};
  deleteSession(title);
  printAllSessions();
});


