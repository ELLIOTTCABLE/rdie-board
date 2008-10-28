// Prepare everything for browsers with no console.
if (!window.console) window.console = {
  log: function() {},
  dir: function() {},
  dirxml: function() {},
  info: function() {},
  warn: function() {},
  time: function() {},
  timeEnd: function() {},
  error: function() {},
  debug: function() {},
  trace: function() {},
  count: function() {},
  group: function() {},
  groupEnd: function() {},
  assert: function() {},
  profile: function() {},
  profileEnd: function() {}
};

window.console.logLevel = 0

function clearElementById(id){
  var element = document.getElementById(id)
  for (var i = element.childNodes.length - 1; i >= 0; i--){
    removeElement(element.childNodes[i]);
  };
}

function removeElement(element){
  element.parentNode.removeChild(element);
}

function indexOf(val, array){
  for(var i = 0, l = array.length; i < l; i++) {
    if(array[i] == val) return i;
  }
  return null;
}

function arrayInclude(val, array){
  return indexOf(val, array) !== null;
}
function arrayHasValueAt(val, array){
  return array[val] !== 'undefined';
}

// These paired functions can add a class to the list of classes
// on an element.
function addClass(element, klass){
  if(element.className){
    var classes = element.className.split(' ');
    classes[classes.length] = klass;
    element.className = classes.join(' ');
  } else {
    // Won't work for the NS version, because SVG screws with the
    // className in odd ways - it's not a string, nor any sort of
    // object I can create.
    element.className
  }
}
function addSVGClass(element, klass){
  if(element.className){
    if(element.className.baseVal){
      var classes = element.className.baseVal.split(' ');
      classes[classes.length] = klass;
      element.className.baseVal = classes.join(' '); 
    } else {
      element.className.baseVal = klass;
    }
  } else {
    console.error('SVG element has no existing className: ' + element)
    // Won't work for the NS version, because SVG screws with the
    // className in odd ways - it's not a string, nor any sort of
    // object I can create.
    // element.className
  }
}

// http://tnlogy.blogspot.com/2008/02/innerhtml-but-for-svg.html
// Think innerHTML, for a SVG snippet in a string. Since we can't
// just paste raw string and let the browser handle it, we'll build
// an element ourselves. Things to note:
// * Parsed string's root element(s) *must* have the SVG xmlns attr!
// * Results of this function should be importNode'd for WebKit
function svgSourceToNode(svgSource) {
  // "application/xml" - FireFox likes, and WebKit likes
  // "image/svg+xml" - Semantic, and WebKit likes
  return new DOMParser().parseFromString(svgSource, "application/xml").documentElement;
}
