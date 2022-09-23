
var zoomConfig = {
  levels: [
      [
        { unit: "year", format: "%Y", step: 1},    
        { unit: "month", format: "%M", step: 1}
      ],
      [
        { unit: "year", format: "%Y", step: 1},    
        { unit: "month", format: "%M", step: 1}
      ],
      [
        { unit: "year", format: "%Y", step: 1},    
        { unit: "month", format: "%M", step: 3}
      ],
      [
        { unit: "year", format: "%Y", step: 1}
      ]
  ]
}


function myZoom(theObject) {
  var Level = gantt.ext.zoom.getCurrentLevel();
  if(Level<3){
    var Level=Level+1;
  }
  else{
    var Level=1;
  };
  gantt.ext.zoom.setLevel(Level);
  document.getElementById('bt_Zoom').textContent = 'Zoom ' + Level.toString();
  
}

function myFilterTout(theObject) {
gantt.clearAll();
gantt.load("/data");
}

function myFilterP1(theObject) {
  gantt.clearAll();
  gantt.load("/data/1");
}

function myFilterN1(theObject) {
  gantt.clearAll();
  gantt.load("/dataTest"); 
}

function myfilter(theObject) {
  gantt.clearAll();

  gantt.load("/datacoco/1")
}


