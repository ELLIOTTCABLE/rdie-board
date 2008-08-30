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
    
    var yTranslate = (-( parseFloat(rows) / 2.0 ) + parseFloat(row) + 1) * -100.0;
    var cols = map[row].length;
    for (var col = rows - 1; col >= 0; col--) {
      
      var xTranslate = (-( parseFloat(cols) / 2.0 ) + parseFloat(col) + 1) * -100.0;
      var tiles = map[row][col].length;
      for (var tile = tiles - 1; tile >= 0; tile--) {
        // console.log(map[row][col][tile], xTranslate, yTranslate);
        addTile(map[row][col][tile], xTranslate, yTranslate);
      };
    };
  };
}

function addTile(id, xTranslate, yTranslate) {
  var intId = parseInt(id);
  
  retrieveTile( intId, function(tile) {
    // We write only the SVG here - any necessary CSS should be written by 
    // retrieveTile() if necessary.
    writeSVG( unescape(tile['svg']), document.getElementById('tiles'), ['tile', tile['name']], function(attr) {
      attr['transform'] = 'translate(' + xTranslate + ',' + yTranslate + ')';
      return attr;
    } );
  } );
}

// This will retrieve a tile as JSON, caching all previously requested
// tiles to save JHR requests. Due to the async nature of XHR and thus
// JHR, we can't return the tile itself - you have to pass a function
// to retrieveTile() documenting how you want to deal with the tile.
var cachedTiles = new Array();
function retrieveTile(id, onRetrieve) {
  var cachedTile = cachedTiles[ parseInt(id) ]
  if(cachedTile == 'undefined' || cachedTile == null) {
    
    // If we haven't been grabbed before, we need to add the tile to
    // the cache and add any relevant CSS to the page on retrieval and
    // then run the requested onRetrieve call once we JHR the tile.
    JSONHttpRequest(API_URI + '/tile/' + id, function(tile) {
      cachedTiles[ parseInt(tile['id']) ] = tile;
      writeCSS( unescape(tile['css']) );
      onRetrieve(tile);
    });
    
  } else {
    
    // If it's been cached before, no need to write the CSS - we'll
    // just run the call.
    onRetrieve( cachedTiles[parseInt(id)] );
    
  }
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
  var svgNode = document.createElementNS(SVG_NS, 'g');
  for (var klass = classes.length - 1; klass >= 0; klass--) {
    addSVGClass(svgNode, classes[klass])
  };
  
  if(attributesFunction != 'undefined') {
    var attributes = attributesFunction(new Array());
    for(var attribute in attributes) {
      svgNode.setAttributeNS(null, attribute, attributes[attribute]);
    };
  }
  parentNode.appendChild(svgNode);
  
  svgNode.appendChild( document.importNode(svgSourceToNode(svgSource), true) );
}