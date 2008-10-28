// Uses XMLHttpRequest to get a json object from a URI
function JSONHttpRequest(URI, onResponse, method_opt, charset_opt) {
  var method = method_opt || 'GET';
  var charset = charset_opt || 'utf-8';
  
  var request = new XMLHttpRequest();
  request.open(method, URI, true);
  request.setRequestHeader("Content-Type", "application/json;charset=" + charset);
  
  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200 && request.responseText) {
      onResponse( (JSON.parse(request.responseText))['body'] );
    }
  }
  
  request.send(null);
}

function retrieveMap(id, onRetrieve) {
  JSONHttpRequest(API_URI + '/map/' + id, onRetrieve);
}

var cachedMap;
function switchToMap(id) {
  console.info('processing map ' + id);
  console.info('queued for transfer...');
  var mapId = parseInt(id);
  
  retrieveMap(mapId, function(map) {
    console.info('...received!');
    clearElementById('tiles');
    cachedMap = map;
    writeMap(map);
  });
}

function writeMap(map) {
  console.log('writing map');
  var xTranslate;
  var yTranslate;
  
  var numRows = map.length;
  var queuedRows = new Array();
  for (var rowId = numRows - 1; rowId >= 0; rowId--) {
    var yTranslate = -(-( parseFloat(numRows) / 2 ) + parseFloat(rowId) + 1);
    
    // This is necessary due to JavaScript's weird handling of scope. It
    // returns a function that takes no arguments, but has the arguments it
    // needs embedded into it's scope.
    var rowWriter = (function(map, rowId, yTranslate) { return function() {
      console.group('writing row '+ rowId);
      writeRow(map[rowId], yTranslate);
      console.groupEnd();
    } })(map, rowId, yTranslate)
    
    queuedRows.push(rowWriter);
  };
  
  // Each writer block will execute the next one when it's done.
  var executeNextRowWriter = function() {
    rowWriter = queuedRows.pop();
    rowWriter();
    if (queuedRows.length > 0)
      setTimeout(executeNextRowWriter, 0);
  }
  
  executeNextRowWriter();
}

function writeRow(row, yTranslate) {
  var numTiles = row.length;
  for (var tileId = numTiles - 1; tileId >= 0; tileId--) {
    var xTranslate = -(-( parseFloat(numTiles) / 2 ) + parseFloat(tileId) + 1);
    writeTile(row[tileId], yTranslate, xTranslate);
  }
}

function writeTile(tile, yTranslate, xTranslate) {
  var numSlices = tile.length;
  for (var sliceId = numSlices - 1; sliceId >= 0; sliceId--) {
    writeSlice(tile[sliceId], yTranslate, xTranslate);
  }
}

function writeSlice(sliceId, yTranslate, xTranslate) {
  queueHookForSlice(sliceId, function(slice){
    console.info('writing slice '+sliceId+' ['+yTranslate+','+xTranslate+']');
    var gNode = gridNode(xTranslate, yTranslate);
    addSVGClass(gNode, slice['name']);
    writeSVG( unescape(slice['svg']), gNode );
  });
}

// Once loaded, all a slice's hook queue entries will be run, and any hook
// passed to this after that point will be run directly. The first hook passed
// to this causes the slice to be requested for loading.
// 
// Returnes the slice if it's already cached, true if it's already been queued,
// and false if this is the first time it's been requested.
// TODO: Figure out why this particular function runs so slow!
var queuedSlices = new Array();
var cachedSlices = new Array();
function queueHookForSlice(sliceId_opt, hook) {
  var sliceId = parseInt(sliceId_opt)
  // If we've already got the slice, just run the hook on it now.
  var cachedSlice = cachedSlices[sliceId];
  if(cachedSlice != 'undefined' && cachedSlice != null) {
    hook(cachedSlice);
    return cachedSlice;
  }
  
  // If it's not retreived yet, but it's been queued, add our hook to the
  // queue
  var sliceQueue = queuedSlices[sliceId];
  if(sliceQueue != 'undefined' && sliceQueue != null) {
    sliceQueue.push(hook);
    return true;
  }
  
  // If it's not been queued, we'll queue it now, and actually request the
  // slice.
  queuedSlices[sliceId] = new Array();
  queuedSlices[sliceId].push(hook);
  retrieveSlice( sliceId, function(slice) {
    runHooksForSlice(sliceId, slice);
  });
  
  return false;
}

function runHooksForSlice(sliceId, slice) {
  for (var i = queuedSlices[sliceId].length - 1; i >= 0; i--){
    queuedSlices[sliceId][i](slice);
  };
}

// This will retrieve a slice as JSON, caching all previously requested
// slices to save JHR requests. Due to the async nature of XHR and thus
// JHR, we can't return the slice itself - you have to pass a function
// to retrieveSlice() documenting how you want to deal with the slice.
function retrieveSlice(id, onRetrieve) {
  JSONHttpRequest(API_URI + '/slice/' + id, function(slice) {
    cachedSlices[ parseInt(slice['id']) ] = slice;
    if(slice['css']){ writeCSS( unescape(slice['css']) ) };
    onRetrieve(slice);
  });
}

function writeCSS(cssSource) {
  var styleNode = document.createElement('style');
  // var innerCSS = document.createTextNodeNs(SVG_NS, cssSource); // WTF? Why not the Ns version?
  var innerCSS = document.createTextNode(cssSource);
  styleNode.setAttribute('type', 'text/css');
  styleNode.appendChild(document.importNode(innerCSS, true));
  (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(styleNode);
}

function writeSVG(svgSource, parentNode) {
  var svgNode = svgSourceToNode(svgSource);
  parentNode.appendChild( document.importNode(svgNode, true) ); // For WebKit
}

// Returns the <g> object representing one 'grid tile', so actual graphical
// slices can be added to it. Creates said tile if necessary.
function gridNode(x, y) {
  var gNode = findGridNode(x, y);
  if(!gNode) {
    gNode = document.importNode( document.createElementNS(SVG_NS, 'g'), true );
    addSVGClass(gNode, 'tile');
    gNode.setAttributeNS(null, 'transform', 'translate('+(x * 100)+','+(y * 100)+')');
    gNode.setAttributeNS(null, 'id', 'tile:'+x+'.'+y);
    
    document.getElementById('tiles').appendChild(gNode)
  }
  
  return gNode;
}

function findGridNode(x, y) {
  document.getElementById('tile:' + x + '.' + y);
}

function removeGridNode(x, y) {
  var gNode = findGridNode(x, y)
  if(gNode) {
    removeElement(gNode);
  }
}