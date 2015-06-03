this.Element && function(ElementPrototype) {
	ElementPrototype.matches = ElementPrototype.matchesSelector ||
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

(function(document) {
    var lastUid = 0,
        nextUid = function() {
            return "-cp-" + (++lastUid);
        },
        manageBooleanAttr = function (el, attr, condition) {
            if (condition) {
                el.setAttribute(attr, "true");
            } else if (el.hasAttribute(attr)) {
                el.removeAttribute(attr);
            }
        },
        elFromString = function (str) {
            var temp = document.createElement("div");
            temp.innerHTML = str;
            return temp.firstElementChild;
        },
        FOCUS_DELAY = 50,
        find = function (scope, query) {
            return scope.querySelector("#" + scope.id + query);
        },
        findAll = function (scope, query) {
            return Array.prototype.slice.call(scope.querySelectorAll("#" + scope.id + query));
        };

    document.registerElement(
        "common-panel-set", {
            prototype: Object.create(
                HTMLElement.prototype, {
                    insertBefore: {
                        value: function (o, n) {
                            HTMLElement.prototype.insertBefore.call(this, o, n || null);
                        }
                    },
                    appendChild: {
                        value: function (n) {
                            HTMLElement.prototype.appendChild.call(this, n);
                        }
                    },
                    removeChild: {
                        value: function (n) {
                            HTMLElement.prototype.removeChild.call(this, n);
                        }
                    },
                    replaceChild: {
                        value: function (o, n) {
                            HTMLElement.prototype.replaceChild.call(this, o, n);
                        }
                    },
                    activePanelElement: {
                        get: function() {
                            return this.common_panels[this.selectedIndex];
                        },
                        set: function (panel) {
                            this.selectedIndex = this.common_panels.indexOf(panel);
                            // setting a panel element active has a side effect of making siblings inactive...
                            this.selectedIndex = (this.selectedIndex !== -1) ? this.selectedIndex : 0;
                            this.common_panels.forEach(function (curPanel, i) {
                                curPanel.expansionState = (i === this.selectedIndex) ? "opened" : "closed";
                            }, this);
                        }
                    },
                    /* TODO: can we just have a single +/- kind of thing? */
                    selectNextTab: {
                        value: function() {
                            var self = this;
                            if (this.selectedIndex < this.common_panels.length - 1) {
                                this.selectedIndex++;
                            }
                            this.activePanelElement = this.common_panels[this.selectedIndex];
                            setTimeout(function() { self.setFocusForActivePanel(true); }, FOCUS_DELAY);
                        }
                    },
                    selectPreviousTab: {
                        value: function() {
                            var self = this;
                            if (this.selectedIndex > 0) {
                                this.selectedIndex--;
                            }
                            this.activePanelElement = this.common_panels[this.selectedIndex];
                            setTimeout(function() { self.setFocusForActivePanel(true); }, FOCUS_DELAY);
                        }
                    },
                    // mutation observers should manage registration more effectively
                    _deregisterChildPanel: {
                        value: function (panelElement) {
                            var tabElement, tabsList;
                            if (panelElement === this.activePanelElement) {
                                this.common_panels.splice(this.selectedIndex, 1);
                                if (this.selectedIndex !== 0) {
                                    this.activePanelElement = this.common_panels[this.selectedIndex - 1];
                                } else {
                                    this.activePanelElement = this.common_panels[0];
                                }
                                tabElement = find(this, ">.common-panel-tabs>.common-panel-header-box>.common-panel-header[aria-controls=\"" + panelElement.contentElement.id + "\"]");
                                tabsList = find(this, ">.common-panel-tabs");
                                try {
                                    // TODO: Straighten out tab box / tab confusion
                                    tabElement.parentElement.parentElement.removeChild(tabElement.parentElement);
                                    panelElement.parentElement.removeChild(panelElement);
                                } catch (e) {
                                    console.error("Skipping %e", e);
                                }
                            }
                        }
                    },
                    _registerChildPanel: {
                        value: function (panelElement) {
                            var headerElement, contentElement, tabElement, ownIndex, tablistElement, existingTab;
                            // prevent duplicate registration
                            existingTab = find(this, ">.common-panel-tabs>[aria-controls=" + panelElement.contentElement.id + "]");

                            if (panelElement.parentElement === this && !existingTab) {
                                headerElement = panelElement.headerElement;
                                contentElement = panelElement.contentElement;
                                tabElement = headerElement.cloneNode(true);
                                //  Using header because qsa reports early (bug?) and you can get stuff before upgrade
                                findAll(this, ">common-panel>.common-panel-header-box>.common-panel-header").forEach(function (item, i) {
                                    if (item.parentElement.parentElement === panelElement) {
                                        ownIndex = i;
                                    }
                                    this.common_panels[i] = item.parentElement.parentElement;
                                }, this);

                                tabElement.firstElementChild.setAttribute("aria-controls", contentElement.id);
                                panelElement.setAttribute("role", "presentation");
                                headerElement.setAttribute("role", "presentation");
                                contentElement.setAttribute("role", "tabpanel");
                                headerElement.firstElementChild.setAttribute("role", "tab");
                                tabElement.firstElementChild.setAttribute("role", "tab");
                                tablistElement = find(this, ">.common-panel-tabs");
                                tablistElement.insertBefore(tabElement, tablistElement.children[ownIndex] || null);

                                // if the expansion state is explicitly open or this is the first panel we'd just set the panelElement to active
                                if (panelElement.getAttribute("expansion-state") === "opened" || this.common_panels.length === 1) {
                                    this.activePanelElement = panelElement;
                                } else {
                                    panelElement.expansionState = "closed";
                                }
                            }
                        }
                    },
                    createdCallback: {
                        value: function() {
                            var self = this;
                            var tabbarEl = elFromString("<div class=\"common-panel-tabs\" role=\"presentation\"></div>");
                            this.selectedIndex = -1;
                            this.common_panels = [];
                            this.id = this.id || nextUid(); // ensure it has an id
                            this.setAttribute("role", "tablist");

                            if (window.MutationObserver) {
                                var observer = new MutationObserver(function (mutations) {
                                    mutations.forEach(function(mutation) {
                                        var headerElement, tabProxyElement, activePanelElement;
                                        if (mutation.type === "attributes") {
                                            activePanelElement = self.activePanelElement;
                                            if (activePanelElement) {
                                                headerElement = activePanelElement.headerElement;
                                                tabProxyElement = activePanelElement.tabProxyElement;
                                            }
                                            if (headerElement && tabProxyElement) {
                                                lastSet = ([headerElement.firstElementChild, tabProxyElement.firstElementChild].indexOf(document.activeElement) !== -1);
                                                setTimeout(self.setFocusForActivePanel, FOCUS_DELAY);
                                            }
                                        }
                                        Array.prototype.slice.call(mutation.addedNodes).forEach(function (el) {
                                            if (el.tagName === "COMMON-PANEL") {
                                                // console.info("registering common-panel %s", el.id);
                                                self._registerChildPanel(el);
                                            }
                                        });
                                        Array.prototype.slice.call(mutation.removedNodes).forEach(function (el) {
                                            if (el.tagName === "COMMON-PANEL") {
                                                // console.info("DEREGISTER %e", el);
                                                self._deregisterChildPanel(el);
                                            }
                                        });

                                    });
                                });
                                observer.observe(this, {
                                    "attributes": true,
                                    "childList": true,
                                    "attributeFilter": ["preferred-display"]
                                });
                            }
                            this.insertBefore(tabbarEl, this.firstChild || null);


                            // IS the content focused or the tab or something in one of them or neither?!?
                            // YIKES!  the only ones we care about though really are the panel or the tab transfers
                            this.setFocusForActivePanel = function(force) {
                                var headerElement, tabProxyElement, activePanelElement = self.activePanelElement;
                                if (activePanelElement) {
                                    headerElement = activePanelElement.headerElement;
                                    tabProxyElement = activePanelElement.tabProxyElement;
                                }

                                // THIS WOULD BE BETTER AS A CHECK FOR ARIA HIDDEN ON THE TABLIST
                                if (force || lastSet) {
                                    if (headerElement.firstElementChild.offsetParent) {
                                        headerElement.firstElementChild.focus();
                                    } else {
                                        tabProxyElement.focus();
                                    }
                                }
                            };

                            // we want to attach a listener
                            this.addEventListener("click", function(evt) {
                                // TODO: this is crazy, too bound to underlying els, might make sense to let panel handle this?
                                if (evt.target.matches(".common-panel-remove") || evt.target.parentElement.matches(".common-panel-remove")) {
                                    var tabElement = evt.target.closest("[aria-controls]");
                                    var panelElement = self.querySelector("#" + tabElement.getAttribute("aria-controls"));
                                    self._deregisterChildPanel(panelElement);

                                    //TODO: these need bad help
                                } else if (evt.target.matches("[aria-controls]")) {
                                    self.activePanelElement = document.getElementById(evt.target.getAttribute("aria-controls")).parentElement;
                                } else if (evt.target.parentElement.matches("[aria-controls]")) {
                                    self.activePanelElement = document.getElementById(evt.target.parentElement.getAttribute("aria-controls")).parentElement;
                                } else if (evt.target.parentElement.parentElement.matches("[aria-controls]")) {
                                    self.activePanelElement = document.getElementById(evt.target.parentElement.parentElement.getAttribute("aria-controls")).parentElement;
                                }
                            }, false);

                            this.addEventListener("keydown", function(evt) {
                                /* jshint -W015 */
                                switch (evt.keyCode) {
                                    case 37:
                                        // console.log("pressed left"); /* previous tab */
                                        self.selectPreviousTab();
                                        break;
                                    case 38:
                                        // console.log("pressed up");
                                        self.selectPreviousTab();
                                        break;
                                    case 39:
                                        // console.log("pressed right"); /* next tab */
                                        self.selectNextTab();
                                        break;
                                    case 40:
                                        // console.log("pressed down");
                                        self.selectNextTab();
                                        break;
                                }

                            }, false);


                        }
                    }
                })
            });

    document.registerElement(
        "common-panel", {
            prototype: Object.create(
                HTMLElement.prototype, {
                    cloneNode: {
                        value: function () {
                            var clone = HTMLElement.prototype.cloneNode.call(this, true);
                            clone.id = nextUid();
                            clone.contentElement.id = nextUid();
                            clone.headerElement.firstElementChild.setAttribute("aria-controls", clone.contentElement.id);
                            if (this.parentElement) {
                                this.parentElement._registerChildPanel(clone);
                            }
                            return clone;
                        }
                    },
                    /* Todo, this isn't exactly the header element anymore, needs clarity */
                    headerElement: {
                        get: function () {
                            return find(this, ">.common-panel-header-box");
                        }
                    },
                    contentElement: {
                        get: function () {
                            return find(this, "> .common-panel-content");
                        }
                    },
                    tabProxyElement: {
                        get: function () {
                            var ret;
                            if (this.parentElement.tagName === "COMMON-PANEL-SET") {
                                ret = find(this.parentElement, ">.common-panel-tabs>.common-panel-header-box>.common-panel-header[aria-controls=\"" + this.contentElement.id + "\"]");
                            }
                            return ret;
                        }
                    },
                    expansionState: {
                        set: function (state) {
                            var evt, tabProxyElement;
                            var contentElement = this.contentElement;
                            var isOpen = "opened" === state;
                            this.setAttribute("expansion-state",  state);
                            manageBooleanAttr(contentElement, "aria-hidden", !isOpen);
                            manageBooleanAttr(contentElement, "aria-expanded", isOpen);
                            contentElement.setAttribute("tabindex", (isOpen) ? "0" : "-1");

                            // he should echo this to his parent/tab... shortcut the re-lookup of contentElement.id
                            if (this.parentElement.tagName === "COMMON-PANEL-SET") {
                                tabProxyElement = find(this.parentElement, ">.common-panel-tabs>.common-panel-header-box>.common-panel-header[aria-controls=\"" + contentElement.id + "\"]");
                                if (!tabProxyElement) {
                                    this.parentElement._registerChildPanel(this);
                                    tabProxyElement = find(this.parentElement, ">.common-panel-tabs>.common-panel-header-box>.common-panel-header[aria-controls=\"" + contentElement.id + "\"]");
                                }
                                manageBooleanAttr(tabProxyElement, "aria-selected", isOpen);
                                //tabProxyElement.setAttribute("tabindex", (isOpen) ? "0" : "-1");
                            }
                            if (isOpen) {
                                evt = document.createEvent("CustomEvent");
                                evt.initCustomEvent("_activate", true, true, null);
                                this.dispatchEvent(evt);
                            }
                        }
                    },
                    toggleExpansionState: {
                        value: function () {
                            var current = this.getAttribute("expansion-state");
                            var isClosedOrDefault = (current === null || current === "closed");
                            this.expansionState = (isClosedOrDefault) ? "opened" : "closed";
                        }
                    },
                    createdCallback: {
                        value: function() {
                            // nothing to do here
                            var self = this, containerPanelSetElement, tab, content, removableOptions, titleElement;
                            if (this.getAttribute("data-upgrade-state") !== "resolved") {
                                this.id = this.id || nextUid();
                                removableOptions = (this.hasAttribute("is-removable")) ? "" : " style=\"display: none\" aria-hidden=\"true\" ";

                                // remove the titles
                                findAll(this, ">common-panel-title").forEach(function (el) {
                                    titleElement = this.removeChild(el);
                                }, this);

                                // content is what's left
                                content = elFromString("<div class=\"common-panel-content\" id=\"" + nextUid() + "\" tabindex=\"0\">" + this.innerHTML + "</div>");

                                // aria-controls is only relevant when you are expandable
                                tab = elFromString(
                                    "<div class=\"common-panel-header-box\" role=\"presentation\"><div class=\"common-panel-header\" tabindex=\"0\">" +
                                    "<i class=\"common-panel-icon\"></i><span class=\"common-panel-title\"></span><button class=\"common-panel-remove\" title=\"Remove this panel\"" +
                                    removableOptions +
                                    ">&times;</button>" +
                                    "</div></div>"
                                );


                                this.setAttribute("role", "group");

                                // we have to be destructive to content, that is, we build the same thing based on serialization rather than keep the thing
                                // because without the ability to use shadow dom and projections, we HAVE to create new
                                this.innerHTML = "";
                                this.appendChild(tab);
                                this.appendChild(content);
                                find(this, ">.common-panel-header-box>.common-panel-header>.common-panel-title").appendChild(titleElement);

                                containerPanelSetElement = (this.parentElement && this.parentElement.tagName === "COMMON-PANEL-SET") ? this.parentElement : null;


                                if (this.hasAttribute("expansion-state") || containerPanelSetElement) {
                                    tab.firstElementChild.setAttribute("aria-controls", content.id);
                                    if (containerPanelSetElement) {
                                        containerPanelSetElement._registerChildPanel(this);
                                    } else {
                                        // we are making the whole thing clickable/adding a span to the title so that we can ::before and ::after
                                        tab.addEventListener("click", function () {
                                            tab.expansionState = "opened";
                                        }, false);
                                        this.addEventListener("keydown", function(evt) {
                                            if (evt.keyCode === 32) {
                                                tab.expansionState = "closed";
                                            }
                                        }, false);
                                    }
                                }


                                if (!containerPanelSetElement) {
                                    tab.addEventListener("click", function(evt) {
                                        if (evt.target.matches(".common-panel-remove") ||
                                            (evt.target.parentElement && evt.target.parentElement.matches(".common-panel-remove"))) {
                                            self.parentElement.removeChild(self);
                                        } else if (self.hasAttribute("expansion-state")){
                                            self.toggleExpansionState();
                                        }
                                    }, false);
                                }

                                if (window.MediaQueryMappings && window.MediaQueryMappings.recalc) {
                                    setTimeout(function () {
                                        window.MediaQueryMappings.recalc();
                                    }, 10);
                                }

                                // Useful for things like angular.js which will create a template and attempt to re-stamp this
                                // if we're not careful
                                this.setAttribute("data-upgrade-state", "resolved") ;
                            }
                        }
                    }
                })
            });

    document.registerElement(
        "common-panel-title", {
            prototype: Object.create(
                HTMLElement.prototype, {
                    createdCallback: {
                        value: function () {
                            /* not much to do here... */
                        }
                    }
                })
            });

}(document));
