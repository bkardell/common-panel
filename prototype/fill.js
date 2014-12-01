/* Element.prototype.closest polyfill */
(function () {
    window.Element && function(ElementPrototype) {
        ElementPrototype.matches = ElementPrototype.matches || 
        ElementPrototype.mozMatchesSelector ||
        ElementPrototype.msMatchesSelector ||
        ElementPrototype.oMatchesSelector ||
        ElementPrototype.webkitMatchesSelector ||
        function (selector) {
            var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
     
            while (nodes[++i] && nodes[i] != node);
     
            return !!nodes[i];
        }
    }(Element.prototype);
}());

(function (ELEMENT, PREFIX) {
 ELEMENT.matches = ELEMENT.matches || ELEMENT[PREFIX + 'MatchesSelector'];

 ELEMENT.closest = ELEMENT.closest || function (selector) {
    var node = this;

    while (node) {
       if (node.matches(selector)) return node;
       else node = node.parentElement;
    }

    return null;
 };
})(
 Element.prototype,
 (getComputedStyle(document.documentElement).cssText.match(/-(moz|webkit|ms)-/) || [])[1] || ''
);

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */

window.matchMedia || (window.matchMedia = function() {
    "use strict";

    // For browsers that support matchMedium api such as IE 9 and webkit
    var styleMedia = (window.styleMedia || window.media);

    // For those that don't support matchMedium
    if (!styleMedia) {
        var style       = document.createElement('style'),
            script      = document.getElementsByTagName('script')[0],
            info        = null;

        style.type  = 'text/css';
        style.id    = 'matchmediajs-test';

        script.parentNode.insertBefore(style, script);

        // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
        info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

        styleMedia = {
            matchMedium: function(media) {
                var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

                // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                if (style.styleSheet) {
                    style.styleSheet.cssText = text;
                } else {
                    style.textContent = text;
                }

                // Test if media query is true or false
                return info.width === '1px';
            }
        };
    }

    return function(media) {
        return {
            matches: styleMedia.matchMedium(media || 'all'),
            media: media || 'all'
        };
    };
}());

/*! matchMedia() polyfill addListener/removeListener extension. Author & copyright (c) 2012: Scott Jehl. Dual MIT/BSD license */
(function(){
    // Bail out for browsers that have addListener support
    if (window.matchMedia && window.matchMedia('all').addListener) {
        return false;
    }

    var localMatchMedia = window.matchMedia,
        hasMediaQueries = localMatchMedia('only all').matches,
        isListening     = false,
        timeoutID       = 0,    // setTimeout for debouncing 'handleChange'
        queries         = [],   // Contains each 'mql' and associated 'listeners' if 'addListener' is used
        handleChange    = function(evt) {
            // Debounce
            clearTimeout(timeoutID);

            timeoutID = setTimeout(function() {
                for (var i = 0, il = queries.length; i < il; i++) {
                    var mql         = queries[i].mql,
                        listeners   = queries[i].listeners || [],
                        matches     = localMatchMedia(mql.media).matches;

                    // Update mql.matches value and call listeners
                    // Fire listeners only if transitioning to or from matched state
                    if (matches !== mql.matches) {
                        mql.matches = matches;

                        for (var j = 0, jl = listeners.length; j < jl; j++) {
                            listeners[j].call(window, mql);
                        }
                    }
                }
            }, 30);
        };

    window.matchMedia = function(media) {
        var mql         = localMatchMedia(media),
            listeners   = [],
            index       = 0;

        mql.addListener = function(listener) {
            // Changes would not occur to css media type so return now (Affects IE <= 8)
            if (!hasMediaQueries) {
                return;
            }

            // Set up 'resize' listener for browsers that support CSS3 media queries (Not for IE <= 8)
            // There should only ever be 1 resize listener running for performance
            if (!isListening) {
                isListening = true;
                window.addEventListener('resize', handleChange, true);
            }

            // Push object only if it has not been pushed already
            if (index === 0) {
                index = queries.push({
                    mql         : mql,
                    listeners   : listeners
                });
            }

            listeners.push(listener);
        };

        mql.removeListener = function(listener) {
            for (var i = 0, il = listeners.length; i < il; i++){
                if (listeners[i] === listener){
                    listeners.splice(i, 1);
                }
            }
        };

        return mql;
    };
}());


window.MediaQueryMappings = {
    queue: [],
    add: function (o) {
        var listener = function (evt) {  
            console.log("matched %s for preferredDisplayMode %s", o.mediaQuery, o.preferredDisplayMode); 
            o.mode = (evt.matches) ? "add" : "remove";
            MediaQueryMappings.queue.push(o);
            throttleManageClass(o.selector, o.preferredDisplayMode, o.mode); 
        };
        var mediaList = window.matchMedia(o.mediaQuery);
        mediaList.addListener(listener);
        listener(mediaList); /* already has matches */
    }
}; 

/**
* Helper functions for Selector specificity
* @type {Object}
*/
var specificity = {
    expressions: function(){
        var regExs = {
            pre: /\([^\)]+\)/,
            ids: /#[\d\w\-_]+/g,
            cls: /[\.:\[][^\.:\[+>]+/g,
            tag: /(^|[\s\+>])\w+/g
        };
        regExs.chop = [regExs.ids, regExs.cls, regExs.tag];
        return regExs;
    },
    /**
     * Calculates the specificity of a Selector
     * @return {Number} An hexadecimal value
     */
    calculate: function (selector) {
        var expressions = specificity.expressions();
        var s = selector.replace(expressions.pre,"");
        return parseInt(expressions.chop.map(function(p){
            var m = s.match(p);
            return m ? m.length.toString(16) : 0;
        }).join(''), 16);
    }
};

var throttleManageClassId;
var throttleManageClass = function () {
    if (throttleManageClassId) {
        window.clearTimeout(throttleManageClassId);
    }
    throttleManageClassId = setTimeout(function () {
        MediaQueryMappings.queue.sort(function (a, b) {
            return a.specificity > b.specificity ? 1 : (a.specificity < b.specificity) ? -1 : 0;
        });
        MediaQueryMappings.queue.forEach(function (o) {
            manageClass(o.selector, o.preferredDisplayMode, o.mode);
        });
        MediaQueryMappings.queue = [];
    });
}
// This approach doesn't deal with selector specificity, it's basically document order which means you could wind up with the
// wrong display type
var manageClass = function (selector, preferredDisplayMode, switcher) {
     Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function (el) {
        //el.classList[op](clazz);
        if (switcher === "add") {
            el.setAttribute("preferred-display", preferredDisplayMode, "secret");
        } else if (el.getAttribute("preferred-display") === preferredDisplayMode){
            el.removeAttribute("preferred-display", "secret");
        }
     });
};


/* Super minimal, not terribly efficent API for getting at the things you want */
var SimpleScanner = function (s) {
    var currentIndex = 0, s = s, isBad = false;
    this.context = {};
    this.hasMore = function () { 
        console.log("%d in %d",currentIndex,(s.length-1));
        return currentIndex < s.length -1; 
    };
    this.skipUntil = function (sub, consume) {
        var remaining = s.substring(currentIndex);
        var offset = remaining.search(sub);
        if (offset == -1) {
            throw new Error("Unable to find '" + sub + "' in '" + remaining + "'");
        }
        if (consume) { 
            currentIndex += offset + remaining.match(sub)[0].length;
        };
        return this;
    }
    this.captureUntil = function (sub, propName) {
        // Damn you RegExs
        var remaining = s.substring(currentIndex);
        var end = remaining.search(sub), rst;
        if (end === -1) {
            throw new Error("Unable to find '" + sub + "' in '" + remaining + "'");
        } 
        end += currentIndex;
        rst = s.substring(currentIndex, end);
        currentIndex = end + 1;
        this.context[propName] = rst.trim();
        return this
    }
    this.clearContext = function () {
        this.context = {};
    }
};

window.addEventListener("DOMContentLoaded", function () {
    var rules = [];
    /* this represents us getting source for this from somewhere...*/
    var srcEl = document.querySelector('[type="text/MediaQueryMappings"]');
    var src = (srcEl) ? srcEl.innerHTML : "";
    src.split("@media").forEach(function (chunk) {

        var scanner = new SimpleScanner(chunk);
        try {
            while (scanner.hasMore()) {
                ((scanner.context.query) ? scanner : scanner.captureUntil("{", "query"))
                    .captureUntil("{", "selector")
                    .skipUntil("--preferred-display:", true)
                    .captureUntil(";", "preferredDisplayMode").
                    skipUntil("}", true).
                    skipUntil(/\S/);


                /* I can grab those parsed things from the context */
                rules.push({
                    mediaQuery: scanner.context.query, 
                    selector: scanner.context.selector, 
                    specificity: specificity.calculate(scanner.context.selector),
                    preferredDisplayMode: scanner.context.preferredDisplayMode 
                });   
                scanner.context = { query: scanner.context.query };
            }
        } catch (e) {
            console.error(e);
        }
    });


    /* This is a problem... we have to wait for DCL if necessary and then search... upgrading should allow a check.. */
    //window.addEventListener("DOMContentLoaded", function () {
      rules.forEach(function (rule) {
        console.info(rule);
        MediaQueryMappings.add(rule);  
      });
}, false);

  
//}, false);
