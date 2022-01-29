
function saveSession(){
  if (typeof(Storage) != "undefined") {
    localStorage.setItem(session.title, JSON.stringify(session));
    console.log('Saving session:');
    console.log(session);
    loadSessions();
  }
}

// session = JSON.parse(localStorage.getItem('https://www.youtube.com/watch?v=ZClaHBsmjsY'));

function loadSessions(){
  if (typeof(Storage) != "undefined") {

    // retrive sessions
    let list = JSON.parse(JSON.stringify(localStorage));
    console.log("Sessions:");
    console.log(list);

    // if there are session stored and the page is reloaded (empty session) or there are more than 1 sessions saved
    if( (jQuery.isEmptyObject(session)&&!jQuery.isEmptyObject(list)) || Object.keys(list).length>=2 ) {

      //print and show saved sessions
      let sessionStr = "";
      for(const name in list){
        if (name != 'undefined') {
          sessionStr += name + "\n";
        }
      }
      $('#storageSegmentContent').text(sessionStr);
      $('#storageSegment').show();
    
    } else {
      $('#storageSegment').hide();
    }
    
  }
}


// DOCUMENT READY
$(function (){
  loadSessions();
});

//  btns listener
$('#clear_storage_btn').on('click', function(){
  localStorage.clear();
  $('#storageSegmentContent').text("");
  $('#storageSegment').hide();
});