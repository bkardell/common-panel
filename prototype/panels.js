(function(registerElement) {
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

    registerElement(
        "common-panel-set", {
            prototype: Object.create(
                HTMLElement.prototype, {
                    activePanelElement: {
                        get: function() {
                            return this.common_panels[this.selectedIndex];
                        },
                        set: function (panel) {
                            this.selectedIndex = this.common_panels.indexOf(panel);
                            // setting a panel element active has a side effect of making siblings inactive...
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
                    _deregisterChildPanel: {
                        value: function (panelElement) {
                            var tabElement;
                            if (panelElement === this.activePanelElement) {
                                this.common_panels.splice(this.selectedIndex, 1);
                                if (this.selectedIndex !== 0) {
                                    this.activePanelElement = this.common_panels[this.selectedIndex - 1];
                                } else {
                                    this.activePanelElement = this.common_panels[0];
                                }
                                tabElement = find(this, ">.common-panel-tabs>.common-panel-header[aria-controls=\"" + panelElement.id + "\"]");
                                tabElement.parentElement.removeChild(tabElement);
                                panelElement.parentElement.removeChild(panelElement);
                            }
                        }
                    },
                    _registerChildPanel: {
                        value: function (panelElement) {
                            var headerElement, contentElement, tabElement, ownIndex, tablistElement;
                            if (panelElement.parentElement === this) {
                                headerElement = panelElement.headerElement;
                                contentElement = panelElement.contentElement;
                                tabElement = headerElement.cloneNode(true);
                                //  Using header because qsa reports early (bug?) and you can get stuff before upgrade
                                findAll(this, ">common-panel>.common-panel-header").forEach(function (item, i) {
                                    if (item.parentElement === panelElement) {
                                        ownIndex = i;
                                    }
                                    this.common_panels[i] = item.parentElement;
                                }, this);

                                contentElement.setAttribute("role", "tabpanel");
                                tabElement.setAttribute("role", "tab");
                                tablistElement = find(this, ">.common-panel-tabs");
                                tablistElement.insertBefore(tabElement, tablistElement.children[ownIndex]);

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
                            var tabbarEl = elFromString("<div class=\"common-panel-tabs\" role=\"tablist\"></div>");
                            this.selectedIndex = -1;
                            this.common_panels = [];
                            this.id = this.id || nextUid(); // ensure it has an id

                            var observer = new MutationObserver(function (mutations) {
                                mutations.forEach(function(mutation) {
                                    var headerElement, tabProxyElement, activePanelElement;
                                    console.log("MUTATION %s", mutation.type);
                                    if (mutation.type === "attributes") {
                                        activePanelElement = self.activePanelElement;
                                        if (activePanelElement) {
                                            headerElement = activePanelElement.headerElement;
                                            tabProxyElement = activePanelElement.tabProxyElement;
                                        }
                                        lastSet = ([headerElement, tabProxyElement].indexOf(document.activeElement) !== -1);
                                        console.log("last set: %o %o" + lastSet, document.activeElement);
                                        setTimeout(self.setFocusForActivePanel, FOCUS_DELAY);
                                    }
                                    Array.prototype.slice.call(mutation.addedNodes).forEach(function (el) {
                                        if (el.tagName === "COMMON-PANEL") {
                                            console.log("addded panel %o", el);
                                            self._registerChildPanel(el);
                                        }
                                    });
                                    Array.prototype.slice.call(mutation.removedNodes).forEach(function (el) {
                                        if (el.tagName === "COMMON-PANEL") {
                                            console.log("removed panel %o", el);
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

                            this.insertBefore(tabbarEl, this.firstChild);


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
                                    if (headerElement.offsetParent) {
                                        headerElement.focus();
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
                                        console.log("pressed left"); /* previous tab */
                                        self.selectPreviousTab();
                                        break;
                                    case 38:
                                        console.log("pressed up");
                                        self.selectPreviousTab();
                                        break;
                                    case 39:
                                        console.log("pressed right"); /* next tab */
                                        self.selectNextTab();
                                        break;
                                    case 40:
                                        console.log("pressed down");
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
                    headerElement: {
                        get: function () {
                            return find(this, ">.common-panel-header");
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
                                ret = find(this.parentElement, ">.common-panel-tabs>.common-panel-header[aria-controls=\"" + this.contentElement.id + "\"]");
                            }
                            return ret;
                        }
                    },
                    expansionState: {
                        set: function (state) {
                            var tabProxyElement;
                            var contentElement = this.contentElement;
                            var isOpen = "opened" === state;
                            this.setAttribute("expansion-state",  state);
                            manageBooleanAttr(contentElement, "aria-hidden", !isOpen);
                            manageBooleanAttr(contentElement, "aria-expanded", isOpen);
                            contentElement.setAttribute("tabindex", (isOpen) ? "0" : "-1");

                            // he should echo this to his parent/tab... shortcut the re-lookup of contentElement.id
                            if (this.parentElement.tagName === "COMMON-PANEL-SET") {
                                tabProxyElement = find(this.parentElement, ">.common-panel-tabs>.common-panel-header[aria-controls=\"" + contentElement.id + "\"]");
                                manageBooleanAttr(tabProxyElement, "aria-selected", isOpen);
                                tabProxyElement.setAttribute("tabindex", (isOpen) ? "0" : "-1");
                            }
                        }
                    },
                    toggleExpansionState: {
                        value: function () {
                            var current = this.getAttribute("expansion-state");
                            var isClosedOrDefault = (current === null || current === "closed");
                            this.setExpansionState((isClosedOrDefault) ? "opened" : "closed");
                        }
                    },
                    createdCallback: {
                        value: function() {
                            // nothing to do here
                            var containerPanelSetElement, tab, content, removableOptions;
                            this.id = this.id || nextUid();
                            removableOptions = (this.hasAttribute("is-removable")) ? "" : " style=\"display: none\" aria-hidden=\"true\" ";
                            content = elFromString("<div class=\"common-panel-content\" id=\"" + nextUid() + "\" tabindex=\"0\">" + this.innerHTML + "</div>");
                            tab = elFromString(
                                "<div class=\"common-panel-header\" tabindex=\"0\" aria-controls=\"" + content.id + "\">" +
                                "<i class=\"common-panel-icon\"></i><span>" + this.title + "</span><button class=\"common-panel-remove\" title=\"Remove this panel\"" +
                                removableOptions +
                                "><i></i></button>" +
                                "</div>"
                            );

                            // we have to be destructive to content, that is, we build the same thing based on serialization rather than keep the thing
                            // because without the ability to use shadow dom and projections, we HAVE to create new
                            this.innerHTML = "";
                            this.appendChild(tab);
                            this.appendChild(content);
                            containerPanelSetElement = this.closest("common-panel-set");

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

                            if (!containerPanelSetElement) {
                                tab.addEventListener("click", function(evt) {
                                    var panel;
                                    if (evt.target.matches(".common-panel-remove") || evt.target.parentElement.matches(".common-panel-remove")) {
                                        panel = evt.target.closest("common-panel");
                                        panel.parentElement.removeChild(panel);
                                    }
                                }, false);
                            }
                        }
                    }
                })
            });

}(document.registerElement));