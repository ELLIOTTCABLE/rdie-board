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

var cachedMap;
function switchToMap(id) {
  var mapId = parseInt(id);
  retrieveMap(mapId, function(map) {
    clearElementById('tiles');
    cachedMap = map;
    writeMap(map);
  });
}

function retrieveMap(id, onRetrieve) {
  JSONHttpRequest(API_URI + '/map/' + id, onRetrieve);
}

function writeMap(map) {
  var xTranslate;
  var yTranslate;
  
  var rows = map.length;
  for (var row = rows - 1; row >= 0; row--) {
    
    var yTranslate = -(-( parseFloat(rows) / 2 ) + parseFloat(row) + 1);
    var cols = map[row].length;
    for (var col = cols - 1; col >= 0; col--) {
      
      var xTranslate = -(-( parseFloat(cols) / 2 ) + parseFloat(col) + 1);
      var tiles = map[row][col].length;
      for (var tile = tiles - 1; tile >= 0; tile--) {
        // console.log(map[row][col][tile], xTranslate, yTranslate);
        addTile(map[row][col][tile], xTranslate, yTranslate);
      };
    };
  };
}

// Adds a new tile to the grid. Gets the tile from the server, and prints
// anything necessary to display it to the page.
function addTile(id, x, y) {
  var tileId = parseInt(id)
  
  queueHookForTile(tileId, function(tile){
    var gNode = gridNode(x, y);
    addSVGClass(gNode, tile['name']);
    writeSVG( unescape(tile['svg']), gNode );
  });
}

// Once loaded, all a tile's hook queue entries will be run, and any hook
// passed to this after that point will be run directly. The first hook passed
// to this causes the tile to be requested for loading.
// 
// Returnes the tile if it's already cached, true if it's already been queued,
// and false if this is the first time it's been requested.
// TODO: Figure out why this particular function runs so slow!
var queuedTiles = new Array();
function queueHookForTile(id, hook) {
  var tileId = parseInt(id)
  // If we've already got the tile, just run the hook on it now.
  var cachedTile = cachedTiles[tileId];
  if(cachedTile != 'undefined' && cachedTile != null) {
    hook(cachedTile);
    return cachedTile;
  }
  
  // If it's not retreived yet, but it's been queued, add our hook to the
  // queue
  var tileQueue = queuedTiles[tileId];
  if(tileQueue != 'undefined' && tileQueue != null) {
    tileQueue.push(hook);
    return true;
  }
  
  // If it's not been queued, we'll queue it now, and actually request the
  // tile.
  queuedTiles[tileId] = new Array();
  queuedTiles[tileId].push(hook);
  retrieveTile( tileId, function(tile) {
    runHooksForTile(tileId, tile);
  });
  
  return false;
}

function runHooksForTile(tileId, tile) {
  for (var i = queuedTiles[tileId].length - 1; i >= 0; i--){
    queuedTiles[tileId][i](tile);
  };
}

// This will retrieve a tile as JSON, caching all previously requested
// tiles to save JHR requests. Due to the async nature of XHR and thus
// JHR, we can't return the tile itself - you have to pass a function
// to retrieveTile() documenting how you want to deal with the tile.
var cachedTiles = new Array();
function retrieveTile(id, onRetrieve) {
  JSONHttpRequest(API_URI + '/tile/' + id, function(tile) {
    cachedTiles[ parseInt(tile['id']) ] = tile;
    if(tile['css']){ writeCSS( unescape(tile['css']) ) };
    onRetrieve(tile);
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
  parentNode.appendChild( document.importNode(svgNode, true) );
}

// Returns the <g> object representing one 'grid tile', so actual graphical
// tiles can be added to it. Creates said tile if necessary.
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