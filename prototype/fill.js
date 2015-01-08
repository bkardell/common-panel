/* global window,document,console  */
(function() {
    window.MediaQueryMappings = {
        queue: [],
        add: function(o) {
            var listener = function(evt) {
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
        expressions: function() {
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
        calculate: function(selector) {
            var expressions = specificity.expressions();
            var s = selector.replace(expressions.pre, "");
            return parseInt(expressions.chop.map(function(p) {
                var m = s.match(p);
                return m ? m.length.toString(16) : 0;
            }).join(""), 16);
        }
    };

    var throttleManageClassId;
    var throttleManageClass = function() {
            if (throttleManageClassId) {
                window.clearTimeout(throttleManageClassId);
            }
            throttleManageClassId = setTimeout(function() {
                MediaQueryMappings.queue.sort(function(a, b) {
                    return a.specificity > b.specificity ? 1 : (a.specificity < b.specificity) ? -1 : 0;
                });
                MediaQueryMappings.queue.forEach(function(o) {
                    manageClass(o.selector, o.preferredDisplayMode, o.mode);
                });
                MediaQueryMappings.queue = [];
            });
        };
        // This approach doesn't deal with selector specificity, it's basically document order which means you could wind up with the
        // wrong display type
    var manageClass = function(selector, preferredDisplayMode, switcher) {
        Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function(el) {
            //el.classList[op](clazz);
            if (switcher === "add") {
                el.setAttribute("preferred-display", preferredDisplayMode, "secret");
            } else if (el.getAttribute("preferred-display") === preferredDisplayMode) {
                el.removeAttribute("preferred-display", "secret");
            }
        });
    };


    /* Super minimal, not terribly efficent API for getting at the things you want */
    var SimpleScanner = function(sv) {
        var currentIndex = 0,
            s = sv;
        this.context = {};
        this.hasMore = function() {
            console.log("%d in %d", currentIndex, (s.length - 1));
            return currentIndex < s.length - 1;
        };
        this.skipUntil = function(sub, consume) {
            var remaining = s.substring(currentIndex);
            var offset = remaining.search(sub);
            if (offset == -1) {
                throw new Error("Unable to find \"" + sub + "\" in \"" + remaining + "\"");
            }
            if (consume) {
                currentIndex += offset + remaining.match(sub)[0].length;
            }
            return this;
        };
        this.captureUntil = function(sub, propName) {
            // Damn you RegExs
            var remaining = s.substring(currentIndex);
            var end = remaining.search(sub),
                rst;
            if (end === -1) {
                throw new Error("Unable to find \"" + sub + "\" in \"" + remaining + "\"");
            }
            end += currentIndex;
            rst = s.substring(currentIndex, end);
            currentIndex = end + 1;
            this.context[propName] = rst.trim();
            return this;
        };
        this.clearContext = function() {
            this.context = {};
        };
    };

    window.addEventListener("DOMContentLoaded", function() {
        var rules = [];
        /* this represents us getting source for this from somewhere...*/
        var srcEl = document.querySelector("[type=\"text/MediaQueryMappings\"]");
        var src = (srcEl) ? srcEl.innerHTML : "";
        src.split("@media").forEach(function(chunk) {

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
                    scanner.context = {
                        query: scanner.context.query
                    };
                }
            } catch (e) {
                console.error(e);
            }
        });


        /* This is a problem... we have to wait for DCL if necessary and then search... upgrading should allow a check.. */
        //window.addEventListener("DOMContentLoaded", function () {
        rules.forEach(function(rule) {
            console.info(rule);
            MediaQueryMappings.add(rule);
        });
    }, false);
}());