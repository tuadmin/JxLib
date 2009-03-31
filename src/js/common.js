// $Id$
/**
 * Class: Jx
 * Jx is a global singleton object that contains the entire Jx library
 * within it.  All Jx functions, attributes and classes are accessed
 * through the global Jx object.  Jx should not create any other
 * global variables, if you discover that it does then please report
 * it as a bug
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
 
/* firebug console supressor for IE/Safari/Opera */
window.addEvent('load', function() {
    if (!("console" in window) || !("firebug" in window.console)) {
        var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
        "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

        window.console = {};
        for (var i = 0; i < names.length; ++i) {
            window.console[names[i]] = function() {};
        }
    }
});
/* inspired by extjs, apparently removes css image flicker and related problems in IE 6 */
(function() {
    var ua = navigator.userAgent.toLowerCase();
    var isIE = ua.indexOf("msie") > -1,
        isIE7 = ua.indexOf("msie 7") > -1;
    if(isIE && !isIE7) {
        try {
            document.execCommand("BackgroundImageCache", false, true);
        } catch(e) {}
    }    
})();

/* Setup global namespace
 * If jxcore is loaded by jx.js, then the namespace and baseURL are
 * already established
 */
if (typeof Jx == 'undefined') {
    var Jx = {};
    //window.addEvent('domready', function(){
        var aScripts = document.getElementsByTagName('SCRIPT');
        for (var i=0; i<aScripts.length; i++) {
            var s = aScripts[i].src;
            var matches = /(.*[jx|js|lib])\/jxlib(.*)/.exec(s);
            if (matches && matches[0]) {
                /**
                 * Property: {String} baseURL
                 * This is the URL that Jx was loaded from, it is 
                 * automatically calculated from the script tag
                 * src property that included Jx.
                 *
                 * Note that this assumes that you are loading Jx
                 * from a js/ or lib/ folder in parallel to the
                 * images/ folder that contains the various images
                 * needed by Jx components.  If you have a different
                 * folder structure, you can define Jx's base
                 * by including the following before including
                 * the jxlib javascript file:
                 *
                 * (code)
                 * Jx = {
                 *    baseURL: 'some/path'
                 * }
                 * (end)
                 */ 
                 Jx.aPixel = document.createElement('img', {alt:'',title:''});
                 Jx.aPixel.src = matches[1]+'/a_pixel.png';
                 Jx.baseURL = Jx.aPixel.src.substring(0,
                     Jx.aPixel.src.indexOf('a_pixel.png'));
                
            }
        }
	   /**
        * Determine if we're running in Adobe AIR. If so, determine which sandbox we're in
        */
		var src = aScripts[0].src;
        if (src.contains('app:')){
		    Jx.isAir = true;
        } else {
		    Jx.isAir = false;
	    }
    //});
} 

/**
 * Method: applyPNGFilter
 *
 * Static method that applies the PNG Filter Hack for IE browsers
 * when showing 24bit PNG's.  Used automatically for img tags with
 * a class of png24.
 *
 * The filter is applied using a nifty feature of IE that allows javascript to
 * be executed as part of a CSS style rule - this ensures that the hack only
 * gets applied on IE browsers.
 *
 * The CSS that triggers this hack is only in the ie6.css files of the various
 * themes.
 *
 * Parameters:
 * object {Object} the object (img) to which the filter needs to be applied.
 */
Jx.applyPNGFilter = function(o)  {
   var t=Jx.aPixel.src;
   if( o.src != t ) {
       var s=o.src;
       o.src = t;
       o.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+s+"',sizingMethod='scale')";
   }
};

Jx.imgQueue = [];   //The queue of images to be loaded
Jx.imgLoaded = {};  //a hash table of images that have been loaded and cached
Jx.imagesLoading = 0; //counter for number of concurrent image loads 

/**
 * Method: addToImgQueue
 * Request that an image be set to a DOM IMG element src attribute.  This puts 
 * the image into a queue and there are private methods to manage that queue
 * and limit image loading to 2 at a time.
 *
 * Parameters:
 * obj - {Object} an object containing an element and src
 * property, where element is the element to update and src
 * is the url to the image.
 */
Jx.addToImgQueue = function(obj) {
    if (Jx.imgLoaded[obj.src]) {
        //if this image was already requested (i.e. it's in cache) just set it directly
        obj.element.src = obj.src;
    } else {
        //otherwise stick it in the queue
        Jx.imgQueue.push(obj);
        Jx.imgLoaded[obj.src] = true;
    }
    //start the queue management process
    Jx.checkImgQueue();
};

/**
 * Method: checkImgQueue
 *
 * An internal method that ensures no more than 2 images are loading at a time.
 */
Jx.checkImgQueue = function() {
    while (Jx.imagesLoading < 2 && Jx.imgQueue.length > 0) {
        Jx.loadNextImg();
    }
};

/**
 * Method: loadNextImg
 *
 * An internal method actually populate the DOM element with the image source.
 */
Jx.loadNextImg = function() {
    var obj = Jx.imgQueue.shift();
    if (obj) {
        ++Jx.imagesLoading;
        obj.element.onload = function(){--Jx.imagesLoading; Jx.checkImgQueue();};
        obj.element.onerror = function(){--Jx.imagesLoading; Jx.checkImgQueue();};
        obj.element.src = obj.src;
    }
};

/**
 * Method: createIframeShim
 * Creates a new iframe element that is intended to fill a container
 * to mask out other operating system controls (scrollbars, inputs, 
 * buttons, etc) when HTML elements are supposed to be above them.
 *
 * Returns:
 * an HTML iframe element that can be inserted into the DOM.
 */
Jx.createIframeShim = function() {
    return new Element('iframe', {
        'class':'jxIframeShim',
        'scrolling':'no',
        'frameborder':0
    });
};

/**
 * Class: Element
 *
 * Element is a global object provided by the mootools library.  The
 * functions documented here are extensions to the Element object provided
 * by Jx to make cross-browser compatibility easier to achieve.  Most of the
 * methods are measurement related.
 *
 * While the code in these methods has been converted to use MooTools methods,
 * there may be better MooTools methods to use to accomplish these things.
 * Ultimately, it would be nice to eliminate most or all of these and find the
 * MooTools equivalent or convince MooTools to add them.
 */
Element.implement({
    /**
     * Method: getBoxSizing
     * return the box sizing of an element, one of 'content-box' or 
     *'border-box'.
     *
     * Parameters: 
     * elem - {Object} the element to get the box sizing of.
     *
     * Returns:
     * {String} the box sizing of the element.
     */
    getBoxSizing : function() {
      var result = 'content-box';
      if (Browser.Engine.trident || Browser.Engine.presto) { 
          var cm = document["compatMode"];
          if (cm == "BackCompat" || cm == "QuirksMode") { 
              result = 'border-box'; 
          } else {
              result = 'content-box'; 
        }
      } else {
          if (arguments.length === 0) {
              node = document.documentElement; 
          }
          var sizing = this.getStyle("-moz-box-sizing");
          if (!sizing) { 
              sizing = this.getStyle("box-sizing"); 
          }
          result = (sizing ? sizing : 'content-box');
      }
      return result;
    },
    /**
     * Method: getContentBoxSize
     * return the size of the content area of an element.  This is the size of
     * the element less margins, padding, and borders.
     *
     * Parameters: 
     * elem - {Object} the element to get the content size of.
     *
     * Returns:
     * {Object} an object with two properties, width and height, that
     * are the size of the content area of the measured element.
     */
    getContentBoxSize : function() {
      var w = this.offsetWidth;
      var h = this.offsetHeight;
      var padding = this.getPaddingSize();
      var border = this.getBorderSize();
      w = w - padding.left - padding.right - border.left - border.right;
      h = h - padding.bottom - padding.top - border.bottom - border.top;
      return {width: w, height: h};
    },
    /**
     * Method: getBorderBoxSize
     * return the size of the border area of an element.  This is the size of
     * the element less margins.
     *
     * Parameters: 
     * elem - {Object} the element to get the border sizing of.
     *
     * Returns:
     * {Object} an object with two properties, width and height, that
     * are the size of the border area of the measured element.
     */
    getBorderBoxSize: function() {
      var w = this.offsetWidth;
      var h = this.offsetHeight;
      return {width: w, height: h}; 
    },
    
    /**
     * Method: getMarginBoxSize
     * return the size of the margin area of an element.  This is the size of
     * the element plus margins.
     *
     * Parameters: 
     * elem - {Object} the element to get the margin sizing of.
     *
     * Returns:
     * {Object} an object with two properties, width and height, that
     * are the size of the margin area of the measured element.
     */
    getMarginBoxSize: function() {
        var margins = this.getMarginSize();
        var w = this.offsetWidth + margins.left + margins.right;
        var h = this.offsetHeight + margins.top + margins.bottom;
        return {width: w, height: h};
    },
    
    /**
     * Method: setContentBoxSize
     * set either or both of the width and height of an element to
     * the provided size.  This function ensures that the content
     * area of the element is the requested size and the resulting
     * size of the element may be larger depending on padding and
     * borders.
     *
     * Parameters: 
     * elem - {Object} the element to set the content area of.
     * size - {Object} an object with a width and/or height property that is the size to set
     * the content area of the element to.
     */
    setContentBoxSize : function(size) {
        if (this.getBoxSizing() == 'border-box') {
            var padding = this.getPaddingSize();
            var border = this.getBorderSize();
            if (typeof size.width != 'undefined') {
                var width = (size.width + padding.left + padding.right + border.left + border.right);
                if (width < 0) {
                    width = 0;
                }
                this.style.width = width + 'px';
            }
            if (typeof size.height != 'undefined') {
                var height = (size.height + padding.top + padding.bottom + border.top + border.bottom);
                if (height < 0) {
                    height = 0;
                }
                this.style.height = height + 'px';
            }
        } else {
            if (typeof size.width != 'undefined') {
                this.style.width = size.width + 'px';
            }
            if (typeof size.height != 'undefined') {
                this.style.height = size.height + 'px';
            }
        }
    },
    /**
     * Method: setBorderBoxSize
     * set either or both of the width and height of an element to
     * the provided size.  This function ensures that the border
     * size of the element is the requested size and the resulting
     * content areaof the element may be larger depending on padding and
     * borders.
     *
     * Parameters: 
     * elem - {Object} the element to set the border size of.
     * size - {Object} an object with a width and/or height property that is the size to set
     * the content area of the element to.
     */
    setBorderBoxSize : function(size) {
      if (this.getBoxSizing() == 'content-box') {
        var padding = this.getPaddingSize();
        var border = this.getBorderSize();
        var margin = this.getMarginSize();
        if (typeof size.width != 'undefined') {
          var width = (size.width - padding.left - padding.right - border.left - border.right - margin.left - margin.right);
          if (width < 0) {
            width = 0;
          }
          this.style.width = width + 'px';
        }
        if (typeof size.height != 'undefined') {
          var height = (size.height - padding.top - padding.bottom - border.top - border.bottom - margin.top - margin.bottom);
          if (height < 0) {
            height = 0;
          }
          this.style.height = height + 'px';
        }
      } else {
        if (typeof size.width != 'undefined' && size.width >= 0) {
          this.style.width = size.width + 'px';
        }
        if (typeof size.height != 'undefined' && size.height >= 0) {
          this.style.height = size.height + 'px';
        }
      }
    },
    /**
     * Method: getPaddingSize
     * returns the padding for each edge of an element
     *
     * Parameters: 
     * elem - {Object} The element to get the padding for.
     *
     * Returns:
     * {Object} an object with properties left, top, right and bottom
     * that contain the associated padding values.
     */
    getPaddingSize : function () {
      var l = this.getNumber(this.getStyle('padding-left'));
      var t = this.getNumber(this.getStyle('padding-top'));
      var r = this.getNumber(this.getStyle('padding-right'));
      var b = this.getNumber(this.getStyle('padding-bottom'));
      return {left:l, top:t, right: r, bottom: b};
    },
    /**
     * Method: getBorderSize
     * returns the border size for each edge of an element
     *
     * Parameters: 
     * elem - {Object} The element to get the borders for.
     *
     * Returns:
     * {Object} an object with properties left, top, right and bottom
     * that contain the associated border values.
     */
    getBorderSize : function() {
      var l = this.getNumber(this.getStyle('border-left-width'));
      var t = this.getNumber(this.getStyle('border-top-width'));
      var r = this.getNumber(this.getStyle('border-right-width'));
      var b = this.getNumber(this.getStyle('border-bottom-width'));
      return {left:l, top:t, right: r, bottom: b};
    },
    /**
     * Method: getMarginSize
     * returns the margin size for each edge of an element
     *
     * Parameters: 
     * elem - {Object} The element to get the margins for.
     *
     * Returns:
     *: {Object} an object with properties left, top, right and bottom
     * that contain the associated margin values.
     */
    getMarginSize : function() {
      var l = this.getNumber(this.getStyle('margin-left'));
      var t = this.getNumber(this.getStyle('margin-top'));
      var r = this.getNumber(this.getStyle('margin-right'));
      var b = this.getNumber(this.getStyle('margin-bottom'));
      return {left:l, top:t, right: r, bottom: b};
    },
    /**
     * Method: getNumber
     * safely parse a number and return its integer value.  A NaN value 
     * returns 0.  CSS size values are also parsed correctly.
     *
     * Parameters: 
     * n - {Mixed} the string or object to parse.
     *
     * Returns:
     * {Integer} the integer value that the parameter represents
     */
    getNumber: function(n) {
      var result = n===null||isNaN(parseInt(n,10))?0:parseInt(n,10);
      return result;
    },
    /**
     * Method: getPageDimensions
     * return the dimensions of the browser client area.
     *
     * Returns:
     * {Object} an object containing a width and height property 
     * that represent the width and height of the browser client area.
     */
    getPageDimensions: function() {
        return {width: window.getWidth(), height: window.getHeight()};
    },
    
    /**
     * Method: descendantOf
     * determines if the element is a descendent of the reference node.
     *
     * Parameters:
     * node - {HTMLElement} the reference node
     *
     * Returns:
     * {Boolean} true if the element is a descendent, false otherwise.
     */
    descendantOf: function(node) {
        var parent = $(this.parentNode);
        while (parent != node && parent && parent.parentNode && parent.parentNode != parent) {
            parent = $(parent.parentNode);
        }
        return parent == node;
    },
    
    /**
     * Method: findElement
     * search the parentage of the element to find an element of the given
     * tag name.
     *
     * Parameters:
     * type - {String} the tag name of the element type to search for
     *
     * Returns:
     * {HTMLElement} the first node (this one or first parent) with the
     * requested tag name or false if none are found.
     */
    findElement: function(type) {
        var o = this;
        var tagName = o.tagName;
        while (o.tagName != type && o && o.parentNode && o.parentNode != o) {
            o = $(o.parentNode);
        }
        return o.tagName == type ? o : false;
    }
} );

/**
 * Class: Jx.ContentLoader
 * 
 * ContentLoader is a mix-in class that provides a consistent
 * mechanism for other Jx controls to load content in one of
 * four different ways:
 *
 * o using an existing element, by id
 *
 * o using an existing element, by object reference
 *
 * o using an HTML string
 *
 * o using a URL to get the content remotely
 *
 * Use the Implements syntax in your Class to add Jx.ContentLoader
 * to your class.
 */
Jx.ContentLoader = new Class ({
    /**
     * Property: contentIsLoaded
     *
     * tracks the load state of the content, specifically useful
     * in the case of remote content.
     */ 
    contentIsLoaded: false,
    /**
     * Method: loadContent
     *
     * triggers loading of content based on options set for the current
     * object.
     *
     * Parameters: 
     * element - {Object} the element to insert the content into
     *
     * Options:
     * content - {Mixed} content may be an HTML element reference, the
     *     id of an HTML element already in the DOM, or an HTML
     *     string that becomes the inner HTML of the element.
     * contentURL - {String} the URL to load content from
     *
     * Events:
     *
     * ContentLoader adds the following events to an object.  You can
     * register for these events using the addEvent method or by providing
     * callback functions via the on{EventName} properties in the options 
     * object
     *
     * contentLoaded - called when the content has been loaded.  If the content
     *     is not asynchronous then this is called before loadContent returns.
     * contentLoadFailed - called if the content fails to load, primarily
     *     useful when using the contentURL method of loading content.
     */     
    loadContent: function(element) {
        element = $(element);
        if (this.options.content) {
            var c;
            if (this.options.content.domObj) {
                c = $(this.options.content.domObj);
            } else {
                c = $(this.options.content);
            }
            if (c) {
                if (this.options.content.addTo) {
                    this.options.content.addTo(element);
                } else {
                    element.appendChild(c);                    
                }
                this.contentIsLoaded = true;                
            } else {
                element.innerHTML = this.options.content;
                this.contentIsLoaded = true;
            }
        } else if (this.options.contentURL) {
            this.contentIsLoaded = false;
            this.req = new Request({
                url: this.options.contentURL, 
                method:'get',
                update: element,
                onSuccess:(function(html) {
                    element.innerHTML = html;
                    this.contentIsLoaded = true;
					if (Jx.isAir){
						$clear(this.reqTimeout);
					}
                    this.fireEvent('contentLoaded', this);
                }).bind(this), 
                onFailure: (function(){
                    this.contentIsLoaded = true;
                    this.fireEvent('contentLoadFailed', this);
                }).bind(this),
                headers: {'If-Modified-Since': 'Sat, 1 Jan 2000 00:00:00 GMT'}
            });
            this.req.send();
            if (Jx.isAir) {
                var timeout = $defined(this.options.timeout) ? this.options.timeout : 10000;
                this.reqTimeout = this.checkRequest.delay(timeout, this);
            }
        } else {
            this.contentIsLoaded = true;
        }
        if (this.options.contentId) {
            element.id = this.options.contentId;
        }
        if (this.contentIsLoaded) {
            this.fireEvent('contentLoaded', this);
        }
    },
    
    processContent: function(element) {
        $A(element.childNodes).each(function(node){
            if (node.tagName == 'INPUT' || node.tagName == 'SELECT' || node.tagName == 'TEXTAREA') {
                if (node.type == 'button') {
                    node.addEvent('click', function(){
                        this.fireEvent('click', this, node);
                    });
                } else {
                    node.addEvent('change', function(){
                        this.fireEvent('change',node);
                    });
                }
            } else {
                if (node.childNodes) {
                    this.processContent(node);
                }
            }
        }, this);
    }
});


/**
 * It seems AIR never returns an XHR that "fails" by not finding the 
 * appropriate file when run in the application sandbox and retrieving a local
 * file. This affects Jx.ContentLoader in that a "failed" event is never fired. 
 * 
 * To fix this, I've added a timeout that waits about 10 seconds or so in the code above
 * for the XHR to return, if it hasn't returned at the end of the timeout, we cancel the
 * XHR and fire the failure event.
 *
 * This code only gets added if we're in AIR.
 */
if (Jx.isAir){
	Jx.ContentLoader.implement({
		/**
		 * Method: checkRequest()
		 * Is fired after a delay to check the request to make sure it's not
		 * failing in AIR.
		 */
		checkRequest: function(){
			if (this.req.xhr.readyState === 1) {
				//we still haven't gotten the file. Cancel and fire the
				//failure
				$clear(this.reqTimeout);
				this.req.cancel();
				this.contentIsLoaded = true;
				this.fireEvent('contentLoadFailed', this);
			}
		}
	});
}

/**
 * Class: Jx.AutoPosition
 * Mix-in class that provides a method for positioning
 * elements relative to other elements.
 */
Jx.AutoPosition = new Class({
    /**
     * Method: position
     * positions an element relative to another element
     * based on the provided options.  Positioning rules are
     * a string with two space-separated values.  The first value
     * references the parent element and the second value references
     * the thing being positioned.  In general, multiple rules can be
     * considered by passing an array of rules to the horizontal and
     * vertical options.  The position method will attempt to position
     * the element in relation to the relative element using the rules
     * specified in the options.  If the element does not fit in the
     * viewport using the rule, then the next rule is attempted.  If
     * all rules fail, the last rule is used and element may extend
     * outside the viewport.  Horizontal and vertical rules are
     * processed independently.
     *
     * Horizontal Positioning:
     * Horizontal values are 'left', 'center', 'right', and numeric values.
     * Some common rules are:
     * o 'left left' is interpreted as aligning the left
     * edge of the element to be positioned with the left edge of the
     * reference element.  
     * o 'right right' aligns the two right edges.  
     * o 'right left' aligns the left edge of the element to the right of
     * the reference element.  
     * o 'left right' aligns the right edge of the element to the left
     * edge of the reference element.
     *
     * Vertical Positioning:
     * Vertical values are 'top', 'center', 'bottom', and numeric values.
     * Some common rules are:
     * o 'top top' is interpreted as aligning the top
     * edge of the element to be positioned with the top edge of the
     * reference element.  
     * o 'bottom bottom' aligns the two bottom edges.  
     * o 'bottom top' aligns the top edge of the element to the bottom of
     * the reference element.  
     * o 'top bottom' aligns the bottom edge of the element to the top
     * edge of the reference element.
     * 
     * Parameters:
     * element - the element to position
     * relative - the element to position relative to
     * options - the positioning options, see list below.
     *
     * Options:
     * horizontal - the horizontal positioning rule to use to position the 
     *    element.  Valid values are 'left', 'center', 'right', and a numeric
     *    value.  The default value is 'center center'.
     * vertical - the vertical positioning rule to use to position the 
     *    element.  Valid values are 'top', 'center', 'bottom', and a numeric
     *    value.  The default value is 'center center'.
     * offsets - an object containing numeric pixel offset values for the object
     *    being positioned as top, right, bottom and left properties.
     */
    position: function(element, relative, options) {
        element = $(element);
        relative = $(relative);
        var hor = $splat(options.horizontal || ['center center']);
        var ver = $splat(options.vertical || ['center center']);
        var offsets = $merge({top:0,right:0,bottom:0,left:0}, options.offsets || {});
        
        var page;
        var scroll;
        if (!$(element.parentNode) || element.parentNode ==  document.body) {
            page = Element.getPageDimensions();
            scroll = $(document.body).getScroll();
        } else {
            page = $(element.parentNode).getContentBoxSize(); //width, height
            scroll = $(element.parentNode).getScroll();
        }
        var coords = relative.getCoordinates(); //top, left, width, height
        var size = element.getMarginBoxSize(); //width, height
        var left;
        var right;
        var top;
        var bottom;
        var n;
        if (!hor.some(function(opt) {
            var parts = opt.split(' ');
            if (parts.length != 2) {
                return false;
            }
            if (!isNaN(parseInt(parts[0],10))) {
                n = parseInt(parts[0],10);
                if (n>=0) {
                    left = n;                    
                } else {
                    left = coords.left + coords.width + n;
                }
            } else {
                switch(parts[0]) {
                    case 'right':
                        left = coords.left + coords.width;
                        break;
                    case 'center':
                        left = coords.left + Math.round(coords.width/2);
                        break;
                    case 'left':
                    default:
                        left = coords.left;
                        break;
                }                
            }
            if (!isNaN(parseInt(parts[1],10))) {
                n = parseInt(parts[1],10);
                if (n<0) {
                    right = left + n;
                    left = right - size.width;
                } else {
                    left += n;
                    right = left + size.width;
                }
                right = coords.left + coords.width + parseInt(parts[1],10);
                left = right - size.width;
            } else {
                switch(parts[1]) {
                    case 'left':
                        left -= offsets.left;
                        right = left + size.width;
                        break;
                    case 'right':
                        left += offsets.right;
                        right = left;
                        left = left - size.width;
                        break;
                    case 'center':
                    default:
                        left = left - Math.round(size.width/2);
                        right = left + size.width;
                        break;
                }                
            }
            return (left >= scroll.x && right <= scroll.x + page.width);
        })) {
            // all failed, snap the last position onto the page as best
            // we can - can't do anything if the element is wider than the
            // space available.
            if (right > page.width) {
                left = scroll.x + page.width - size.width;
            }
            if (left < 0) {
                left = 0;
            }
        }
        element.setStyle('left', left);
        
        if (!ver.some(function(opt) {
                var parts = opt.split(' ');
                if (parts.length != 2) {
                    return false;
                }
                if (!isNaN(parseInt(parts[0],10))) {
                    top = parseInt(parts[0],10);
                } else {
                    switch(parts[0]) {
                        case 'bottom':
                            top = coords.top + coords.height;
                            break;
                        case 'center':
                            top = coords.top + Math.round(coords.height/2);
                            break;
                        case 'top':
                        default:
                            top = coords.top;
                            break;
                    }
                }
                if (!isNaN(parseInt(parts[1],10))) {
                    var n = parseInt(parts[1],10);
                    if (n>=0) {
                        top += n;
                        bottom = top + size.height;
                    } else {
                        bottom = top + n;
                        top = bottom - size.height; 
                    }
                } else {
                    switch(parts[1]) {
                        case 'top':
                            top -= offsets.top;
                            bottom = top + size.height;
                            break;
                        case 'bottom':
                            top += offsets.bottom;
                            bottom = top;
                            top = top - size.height;
                            break;
                        case 'center':
                        default:
                            top = top - Math.round(size.height/2);
                            bottom = top + size.height;
                            break;
                    }                    
                }
                return (top >= scroll.y && bottom <= scroll.y + page.height);
            })) {
                // all failed, snap the last position onto the page as best
                // we can - can't do anything if the element is higher than the
                // space available.
                if (bottom > page.height) {
                    top = scroll.y + page.height - size.height;
                }
                if (top < 0) {
                    top = 0;
                }
            }
            element.setStyle('top', top);
            
            /* update the jx layout if necessary */
            var jxl = element.retrieve('jxLayout');
            if (jxl) {
                jxl.options.left = left;
                jxl.options.top = top;
            }
        }
});

/**
 * Class: Jx.Chrome
 * A mix-in class that provides chrome helper functions.  Chrome is the
 * extraneous visual element that provides the look and feel to some elements
 * i.e. dialogs.  Chrome is added inside the element specified but may
 * bleed outside the element to provide drop shadows etc.  This is done by
 * absolutely positioning the chrome objects in the container based on
 * calculations using the margins, borders, and padding of the jxChrome
 * class and the element it is added to.
 *
 * Chrome can consist of either pure CSS border and background colors, or
 * a background-image on the jxChrome class.  Using a background-image on
 * the jxChrome class creates four images inside the chrome container that
 * are positioned in the top-left, top-right, bottom-left and bottom-right
 * corners of the chrome container and are sized to fill 50% of the width
 * and height.  The images are positioned and clipped such that the 
 * appropriate corners of the chrome image are displayed in those locations.
 */
Jx.Chrome = new Class({
    /**
     * Property: chrome
     * the DOM element that contains the chrome
     */
    chrome: null,
    
    /**
     * Method: makeChrome
     * create chrome on an element.
     *
     * Parameters:
     * element - {HTMLElement} the element to put the chrome on.
     */
    makeChrome: function(element) {
        var c = new Element('div', {
            'class':'jxChrome'      
        });
        
        /* add to element so we can get the background image style */
        element.adopt(c);
        
        /* pick up any offset because of chrome, set
         * through padding on the chrome object.  Other code can then
         * make use of these offset values to fix positioning.
         */
        this.chromeOffsets = c.getPaddingSize();
        c.setStyle('padding', 0);
        
        /* get the chrome image from the background image of the element */
		/* the app: protocol check is for adobe air support */
        var src = c.getStyle('backgroundImage');
        if (!(src.contains('http://') || src.contains('https://') || src.contains('file://') || src.contains('app:/'))) {
            src = null;
        } else {
            src = src.slice(4,-1);
            /* this only seems to be IE and Opera, but they add quotes
             * around the url - yuck
             */
            if (src.charAt(0) == '"') {
                src = src.slice(1,-1);
            }

            /* and remove the background image */
            c.setStyle('backgroundImage', 'none');

            /* make chrome */
            ['TR','TL','BL','BR'].each(function(s){
                c.adopt(
                    new Element('div',{
                        'class':'jxChrome'+s
                    }).adopt(
                    new Element('img',{
                        'class':'png24',
                        src:src,
                        alt: '',
                        title: ''
                    }))
                );
            }, this);
        }
        if (!window.opera) {
            c.adopt(Jx.createIframeShim());
        }
        
        /* remove from DOM so the other resizing logic works as expected */
        c.dispose();    
        this.chrome = c;
    },
    /**
     * Method: showChrome
     * show the chrome on an element.  This creates the chrome if necessary.
     * If the chrome has been previously created and not removed, you can
     * call this without an element and it will just resize the chrome within
     * its existing element.  You can also pass in a different element from
     * which the chrome was previously attached to and it will move the chrome
     * to the new element.
     *
     * Parameters:
     * element - {HTMLElement} the element to show the chrome on.
     */
    showChrome: function(element) {
        element = $(element);
        if (!this.chrome) {
            this.makeChrome(element);
        }
        this.resizeChrome(element);
        if (element && this.chrome.parentNode !== element) {
            element.adopt(this.chrome);
        }
    },
    /**
     * Method: hideChrome
     * removes the chrome from the DOM.  If you do this, you can't
     * call showChrome with no arguments.
     */
    hideChrome: function() {
        if (this.chrome) {
            this.chrome.dispose();
        }
    },
    resizeChrome: function(o) {
        if (this.chrome && Browser.Engine.trident4) {
            this.chrome.setContentBoxSize($(o).getBorderBoxSize());
        }
    }
});

/**
 * Class: Jx.Addable
 * A mix-in class that provides a helper function that allows an object
 * to be added to an existing element on the page.
 */
Jx.Addable = new Class({
    addable: null,
    /**
     * Method: addTo
     * adds the object to the DOM relative to another element.  If you use
     * 'top' or 'bottom' then the element is added to the relative
     * element (becomes a child node).  If you use 'before' or 'after'
     * then the element is inserted adjacent to the reference node. 
     *
     * Parameters:
     * reference - {Object} the DOM element or id of a DOM element
     * to append the object relative to
     * where - {String} where to append the element in relation to the
     * reference node.  Can be 'top', 'bottom', 'before' or 'after'.
     * The default is 'bottom'.
     *
     * Returns:
     * the object itself, which is useful for chaining calls together
     */
    addTo: function(reference, where) {
        $(this.addable || this.domObj).inject(reference,where);
        this.fireEvent('addTo',this);
        return this;
    }
});