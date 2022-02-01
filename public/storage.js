
function saveSession(){
  if (typeof(Storage) != "undefined") {
    localStorage.setItem(session.title, JSON.stringify(session));
    console.log('Saving session:');
    console.log(session);
    loadAllSessions();
  }
}

// session = JSON.parse(localStorage.getItem('https://www.youtube.com/watch?v=ZClaHBsmjsY'));

function loadAllSessions(){
  if (typeof(Storage) != "undefined") {

    // retrive sessions
    let storageList = JSON.parse(JSON.stringify(localStorage));
    console.log("Sessions:");
    console.log(storageList);

    // if there are session stored and the page is reloaded (empty session) or there are more than 1 sessions saved
    if( (jQuery.isEmptyObject(session)&&!jQuery.isEmptyObject(storageList)) || Object.keys(storageList).length>=2 ) {

      //clear the previous sessions list
      $('#sessionsList').empty();

      //print and show the new sessions list
      for(const title in storageList){
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
  if (typeof(Storage) != "undefined") {
    // retrive session list
    let storageList = JSON.parse(JSON.stringify(localStorage));

    if( !jQuery.isEmptyObject(storageList) ) {
      session = JSON.parse(storageList[title]);
    }
  }
}

function addSessionItem(title){
  var li = document.createElement("li");
  li.setAttribute('id', title);
  li.appendChild(document.createTextNode(title));
  $('#sessionsList').append(li);
}


// DOCUMENT READY
$(function (){
  loadAllSessions();
});


//  btns listener
$('#sessionsList').on('click', async function(e) {
  if (e.target && e.target.matches('li')) {
    let title = e.target.innerText;
    $('#modalName').text(title);
    $('.ui.basic.modal').modal({context:'#wrapper'}).modal('show');
    loadSession(title);
  }
});

$('#load_session_btn').on('click', function(){
  newSession = false;
  loadWaveform();
  printVideoInfo();
  printFeatures();
});

$('#clear_storage_btn').on('click', function(){
  localStorage.clear();
  $('#storageSegmentContent').text("");
  $('#storageSegment').fadeOut();
});