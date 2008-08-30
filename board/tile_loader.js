// Uses XMLHttpRequest to get a json object from a URI
function JSONHttpRequest(URI, onResponse, method_opt, charset_opt) {
  var method = method_opt || 'GET';
  var charset = charset_opt || 'utf-8';
  
  var request = new XMLHttpRequest();
  request.open(method, URI, true);
  request.setRequestHeader("Content-Type", "application/json;charset=" + charset);
  
  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
      if (request.responseText) {
        onResponse( (JSON.parse(request.responseText))['body'] );
      }
    }
  }
  
  request.send(null);
}

var cachedMap;
function switchToMap(id) {
  int_id = parseInt(id);
  retrieveMap(int_id, function(map) {
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
function addTile(id, xTranslate, yTranslate) {
  var tileId = parseInt(id)
  
  queueHookForTile(tileId, function(tile){
    writeSVG( unescape(tile['svg']), document.getElementById('tiles'), ['tile', tile['name']], function(attr) {
      attr['transform'] = 'translate(' + (xTranslate * 100) + ',' + (yTranslate * 100) + ')';
      attr['id'] = 'tile:' + xTranslate + '.' + yTranslate;
      return attr;
    } );
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
  
  // If it's not retreived yet, but it's been requested, add our hook to the
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
    writeCSS( unescape(tile['css']) );
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

// importNode the parentNode to the document before running this!
function writeSVG(svgSource, parentNode, classes, attributesFunction) {
  var groupNode = document.createElementNS(SVG_NS, 'g');
  for (var klass = classes.length - 1; klass >= 0; klass--) {
    addSVGClass(groupNode, classes[klass])
  };
  
  if(attributesFunction != 'undefined') {
    var attributes = attributesFunction(new Array());
    for(var attribute in attributes) {
      groupNode.setAttributeNS(null, attribute, attributes[attribute]);
    };
  }
  parentNode.appendChild(groupNode);
  
  groupNode.appendChild( document.importNode(svgSourceToNode(svgSource), true) );
}