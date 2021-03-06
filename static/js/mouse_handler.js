var targetObject = null;

function getSvgLoc(svgElement,theEvent){
  var matrix = svgElement.getScreenCTM().inverse();
  var mouseX = matrix.a*theEvent.clientX+matrix.c*theEvent.clientY+matrix.e;
  var mouseY = matrix.b*theEvent.clientX+matrix.d*theEvent.clientY+matrix.f;
  var mouseLoc = new Array(mouseX,mouseY);
  return mouseLoc;
}

function mouseHandler(theEvent){
  if (theEvent == null) { theEvent = window.event; } 
  var target = theEvent.target != null ? theEvent.target : theEvent.srcElement;
  targetObject = target;
  
  // Let's see what was clicked. If it's a tile, then we need to (for now, at least)
  //  just drag the parent board's viewport. If it's the zoomer, we need to zoom.
  //parentNode = target.parentNode
  parentNode = target;
  while (parentNode) { // fail out if we've reached the document (document.parentNode == null)
    
    
    if (parentNode != document) { // Deal with the zoomer
      var klass = parentNode.getAttribute("class")
      if (parentNode.id === 'zoomer') {
        if(console.logLevel >= 4) console.info('clicked zoomer');
        map = document.getElementById('map')
        board = document.getElementById('board')
        handle = document.getElementById('zoomer_handle')
        
        mapZoomOK = true;
        mapStartViewBox = map.getAttribute('viewBox').split(' ').map(function(str){return parseInt(str);});
        // WHY DO I HAVE TO DO THIS!!!!!!!!!!!?!?!?!?
        mapViewBox = new Array(4);
        mapViewBox = mapStartViewBox.join(' ');
        mapViewBox = mapViewBox.split(' ').map(function(str){return parseInt(str);});
        mapZoomerStartMouseLoc = getSvgLoc(board,theEvent);
        
        mapZoomerStartWidth = parseInt(handle.getAttribute('width'));
        
        document.onmousemove = mapZoomMouseMoveHandler;
        document.onmouseup = mouseCleanupHandler;
      
      
      } else if ((klass) && klass.match('tile')) { // Deal with the dragging
        if(console.logLevel >= 4) console.info('clicked tile');
        
        map = document.getElementById('map');
        mapDragOK = true;
    
        mapStartViewBox = map.getAttribute('viewBox').split(' ').map(function(str){return parseInt(str);});
        // WHY DO I HAVE TO DO THIS!!!!!!!!!!!?!?!?!?
        mapViewBox = mapStartViewBox;
        mapDragStartMouseLoc = getSvgLoc(map,theEvent);
    
        document.onmousemove = mapDragMouseMoveHandler;
        document.onmouseup = mouseCleanupHandler;
        
      } // if/else if
      parentNode = parentNode.parentNode;
    } else {
      parentNode = null;
    }; // if parentNode != document
  }; // while
}; // function mouseHandler

function mapZoomMouseMoveHandler(theEvent){
  if(console.logLevel >= 5) console.info('zooming')
  if (theEvent == null) { theEvent = window.event }; 
  if (theEvent.button <= 1 && mapZoomOK){
    var mapZoomerMouseLoc = getSvgLoc(board,theEvent)
    
    // mapZoomerMoveDistance = mouseX - startX
    var mapZoomerAbsoluteMoveDistance = mapZoomerMouseLoc[0] - mapZoomerStartMouseLoc[0]
    mapZoomerDistance = Math.abs((mapZoomerMouseLoc[0] / 4) - 50)
    
    mapZoomerStartWidth
    mapZoomerStartDistance = mapZoomerStartWidth / 2
    mapZoomerDistanceDelta = mapZoomerDistance - mapZoomerStartDistance
    
    mapZoomerPercentDelta = (100 - mapZoomerDistanceDelta) / 100
    mapStartVisibleTiles = mapStartViewBox[2] / 100
    mapStartPercentageOverSlide = mapStartVisibleTiles / 10
    
    
    if (mapZoomerDistance > 5 && mapZoomerDistance < 38) {
      handle.setAttribute('x', (50 - mapZoomerDistance) + '%')
      handle.setAttribute('width', (mapZoomerDistance * 2) + '%')
      
      // mapViewBox = mapStartViewBox
      // WHY DOES THIS NOT ALIGN TO THE TILES!!!!!1!!1!!!?!?
      mapViewBox[2] = mapStartViewBox[2] * mapZoomerPercentDelta // X width
      mapViewBox[3] = mapViewBox[2] // Y width
      mapViewBox[0] = mapStartViewBox[0] + (mapStartViewBox[2] - mapViewBox[2]) / 2 // X start
      mapViewBox[1] = mapStartViewBox[1] + (mapStartViewBox[2] - mapViewBox[2]) / 2 // Y start
      
      map.setAttribute('viewBox',mapViewBox.join(' '))
    }
    console.log(((100 - mapZoomerDistanceDelta) / 100), mapViewBox)
    
    // mapViewBox[0] = mapStartViewBox[0] - mapZoomerMoveDistance[0]
    // mapViewBox[1] = mapStartViewBox[1] - mapZoomerMoveDistance[1]
    
    // map.setAttribute('viewBox',mapViewBox.join(' '))
  }
  return false;
}

function mapDragMouseMoveHandler(theEvent){
  if(console.logLevel >= 5) console.info('dragging')
  if (theEvent == null) { theEvent = window.event } 
  if (theEvent.button <= 1 && mapDragOK){
    var mapDragMouseLoc = getSvgLoc(map,theEvent)
    
    // viewBox[0] = mouseX - startX
    // viewBox[1] = mouseY - startY
    var mapDragDistance = new Array(2)
    mapDragDistance[0] = mapDragMouseLoc[0] - mapDragStartMouseLoc[0]
    mapDragDistance[1] = mapDragMouseLoc[1] - mapDragStartMouseLoc[1]
    
    mapViewBox[0] = mapStartViewBox[0] - mapDragDistance[0]
    mapViewBox[1] = mapStartViewBox[1] - mapDragDistance[1]
    
    map.setAttribute('viewBox',mapViewBox.join(' '))
  }
  return false;
}

function mouseCleanupHandler(theEvent){
  document.onmousemove=null;
  document.onmouseup=null;
  mapDragOK = false;
  mapZoomOK = false;
}

var mapZoomOK = false;
var mapDragOK = false;
var pastPosition = null;
document.onmousedown=mouseHandler;
mouseCleanupHandler(null);
