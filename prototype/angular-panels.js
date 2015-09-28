(function(angular) {
  "use strict";
  var lastUid = 0,
    nextUid = function() {
      return "-cp-" + (++lastUid);
    },
    ensureId = function(el) {
      el.id = el.id || nextUid();
    },
    find = function(scope, query) {
      ensureId(scope);
      return scope.querySelector("#" + scope.id + query);
    },
    findAll = function(scope, query) {
      ensureId(scope);
      return Array.prototype.slice.call(scope.querySelectorAll("#" + scope.id + query));
    },
    manageBooleanAttr = function(el, attr, condition) {
      if (condition) {
        el.setAttribute(attr, "true");
      } else if (el.hasAttribute(attr)) {
        el.removeAttribute(attr);
      }
    },
    FOCUS_DELAY = 50,
    templates = {
      tabset: "<div class=\"common-panel-tabs\" role=\"presentation\"></div>{{tabs}}<transclude-replace></ng-trasclude-replace>",
      tab: "<div class=\"common-panel-header-box\" role=\"presentation\"><div class=\"common-panel-header\" tabindex=\"0\"><i class=\"common-panel-icon\"></i><span class=\"common-panel-title\" ng-bind-html=\"title\"></span><button class=\"common-panel-remove\" title=\"Remove this panel\">x</button></div></div>",
      tabcontent: "<div class=\"common-panel-content\" tabindex=\"0\"><transclude-replace></transclude-replace></div>"
    },
    hideRemovable = function (el) {
      var btn = el.querySelector(".common-panel-remove");
      if (btn) {
        btn.style.display = "none";
      }
    },
    attachDescriptorBefore = function (element, description) {
        var descriptor = document.createElement("span");
        descriptor.classList.add("visually-hidden");
        descriptor.innerHTML = "&nbsp;" + description + "&nbsp;";
        element.parentElement.insertBefore(descriptor, element);
    },
    sheet = document.createElement("style");

  sheet.innerHTML = "@charset \"utf-8\";common-panel-set {  display: block;  margin-bottom: 20px;}common-panel-set .common-panel-header {  cursor: pointer;}common-panel {  display: block;  position: relative;  font-size: 13px;  font-family: Arial, Helvetica, sans-serif;  margin: 0;  padding: 0;  color: #000000;  background-color: #ffffff;  -webkit-border-radius: 0;  -moz-border-radius: 0;  -ms-border-radius: 0;  -o-border-radius: 0;  border-radius: 0;  border: 1px solid #cccccc;  border: 1px solid rgba(0, 0, 0, 0.3);  -webkit-box-shadow: 0 2px 2px 0 #cccccc;  -moz-box-shadow: 0 2px 2px 0 #cccccc;  box-shadow: 0 2px 2px 0 #cccccc;  -webkit-box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.175);  -moz-box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.175);  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.175);}common-panel:before,common-panel:after {  content: \" \";  display: table;}common-panel:after {  clear: both;}common-panel .common-panel-header {  font-size: 16px;  color: #000000;  font-weight: 700;  line-height: 20px;  padding: 10px 15px 10px 15px;  margin: 0;  background-color: #f7f7f7;  -webkit-border-radius: 0 0 0 0;  -moz-border-radius: 0 0 0 0;  -ms-border-radius: 0 0 0 0;  -o-border-radius: 0 0 0 0;  border-radius: 0 0 0 0;  border-bottom: 1px solid #bbbbbb;}common-panel > .common-panel-content {  margin: 0;  padding: 0;}common-panel .common-panel-remove {  -webkit-text-shadow: 1px 1px 1px #ffffff;  -moz-text-shadow: 1px 1px 1px #ffffff;  -ms-text-shadow: 1px 1px 1px #ffffff;  -o-text-shadow: 1px 1px 1px #ffffff;  text-shadow: 1px 1px 1px #ffffff;  opacity: 0.5;  filter: alpha(opacity=50);  font-family: Roboto, arial, sans-serif;  font-size: 20px;  position: absolute;  top: 10px;  right: 4px;  line-height: 20px;  font-weight: bold;  border: 0;  color: #000000;  background-color: transparent;}common-panel .common-panel-remove:hover {  opacity: 0.9;  filter: alpha(opacity=90);}common-panel[expansion-state]:not([expansion-state=\"opened\"]) > *:not(.common-panel-header-box) {  display: none;}common-panel[expansion-state] > .common-panel-header-box > .common-panel-header > span::after {  float: right;  content: \"\\25B8\";  font-size: 20px;}common-panel[expansion-state=\"opened\"] > .common-panel-header-box > .common-panel-header > span::after {  float: right;  content: \"\\25BE\";  font-size: 20px;}common-panel.borderless {  background-color: transparent;  -webkit-border-radius: 0;  -moz-border-radius: 0;  -ms-border-radius: 0;  -o-border-radius: 0;  border-radius: 0;  border: 0 solid #cccccc;  -webkit-box-shadow: none;  -moz-box-shadow: none;  box-shadow: none;}common-panel.borderless .common-panel-header {  padding: 10px 0 10px 0;  margin: 0;  background-color: transparent;  -webkit-border-radius: 0;  -moz-border-radius: 0;  -ms-border-radius: 0;  -o-border-radius: 0;  border-radius: 0;  border-bottom: 1px solid #bbbbbb;}common-panel[expansion-state=\"closed\"] > .common-panel-header-box > .common-panel-header {  border-bottom: 0;  -webkit-border-radius: 0;  -moz-border-radius: 0;  -ms-border-radius: 0;  -o-border-radius: 0;  border-radius: 0;}common-panel.minus-plus-panel[expansion-state] > .common-panel-header-box > .common-panel-header > span::after {  content: \"\\002B\";  font-size: 20px;}common-panel.minus-plus-panel[expansion-state=\"opened\"] > .common-panel-header-box > .common-panel-header > span::after {  content: \"\\2212\";  font-size: 20px;}common-panel[expansion-state=\"closed\"] .common-panel-header {  background-color: #f0f0f0;  margin: 0;  color: #000000;}common-panel[expansion-state=\"opened\"] .common-panel-header {  background-color: #f7f7f7;  margin: 0;  color: #000000;}.cp-visually-hidden {  position: absolute;  overflow: hidden;  clip: rect(0 0 0 0);  height: 1px;  width: 1px;  margin: -1px;  padding: 0;  border: none;}.common-panel-tabs {  *zoom: 1;  border-bottom: 1px solid #dddddd;  font-size: 13px;  font-family: Arial, Helvetica, sans-serif;  color: #000000;  background-color: transparent;  -webkit-border-radius: 0 0 0 0;  -moz-border-radius: 0 0 0 0;  -ms-border-radius: 0 0 0 0;  -o-border-radius: 0 0 0 0;  border-radius: 0 0 0 0;}.common-panel-tabs::before,.common-panel-tabs::after {  display: table;  line-height: 0;  content: \"\";  clear: both;}.common-panel-tabs .common-panel-header {  float: left;  margin-bottom: -1px;  border: 1px solid transparent;  line-height: 20px;  font-weight: 400;  margin-right: 2px;  padding: 8px 12px;  border-right-color: transparent;  -webkit-border-radius: 0 0 0 0;  -moz-border-radius: 0 0 0 0;  -ms-border-radius: 0 0 0 0;  -o-border-radius: 0 0 0 0;  border-radius: 0 0 0 0;}.common-panel-tabs .common-panel-header:hover,.common-panel-tabs .common-panel-header:focus {  background-color: #eeeeee;  border-color: #dddddd #dddddd #dddddd #dddddd;}.common-panel-tabs .common-panel-header[aria-selected],.common-panel-tabs .common-panel-header[aria-selected]:hover,.common-panel-tabs .common-panel-header[aria-selected]:focus {  background-color: #ffffff;  border-color: #dddddd #dddddd transparent;  border-style: solid;  border-width: 1px;  color: #00324b;  -webkit-border-radius: 0 0 0 0;  -moz-border-radius: 0 0 0 0;  -ms-border-radius: 0 0 0 0;  -o-border-radius: 0 0 0 0;  border-radius: 0 0 0 0;}.common-panel-tabs .common-panel-header .common-panel-remove {  -webkit-text-shadow: 1px 1px 1px #ffffff;  -moz-text-shadow: 1px 1px 1px #ffffff;  -ms-text-shadow: 1px 1px 1px #ffffff;  -o-text-shadow: 1px 1px 1px #ffffff;  text-shadow: 1px 1px 1px #ffffff;  opacity: 0.5;  filter: alpha(opacity=50);  font-family: Roboto, arial, sans-serif;  font-size: 20px;  position: absolute;  top: 10px;  right: 4px;  line-height: 20px;  font-weight: bold;  border: 0;  color: #000000;  background-color: transparent;}.common-panel-tabs .common-panel-header .common-panel-remove:hover {  opacity: 0.9;  filter: alpha(opacity=90);}common-panel-set[preferred-display=\"tabset\"] > common-panel {  border-top: 0;}common-panel-set[preferred-display=\"tabset\"] > common-panel > .common-panel-header-box > .common-panel-header {  display: none;}common-panel-set[preferred-display=\"tabset\"] > common-panel:not([expansion-state=\"opened\"]) {  display: none;}common-panel-set[preferred-display=\"tabset\"] > common-panel {  -webkit-border-radius: 0 0 0 0;  -moz-border-radius: 0 0 0 0;  -ms-border-radius: 0 0 0 0;  -o-border-radius: 0 0 0 0;  border-radius: 0 0 0 0;}common-panel-set:not([preferred-display]) .common-panel-header,common-panel-set[preferred-display=\"accordion\"] .common-panel-header {  background-color: #f0f0f0;  margin: 0;}common-panel-set:not([preferred-display]) .common-panel-header span,common-panel-set[preferred-display=\"accordion\"] .common-panel-header span {  overflow: hidden;  display: block;  -webkit-font-smoothing: antialiased;  -moz-osx-font-smoothing: grayscale;}common-panel-set:not([preferred-display]) .common-panel-header span::before,common-panel-set[preferred-display=\"accordion\"] .common-panel-header span::before {  display: inline-block;  font-style: normal;  font-weight: normal;  line-height: 1;  font-size: 14px;  width: 12px;  text-align: center;}common-panel-set:not([preferred-display]) .common-panel-header:hover,common-panel-set[preferred-display=\"accordion\"] .common-panel-header:hover {  text-decoration: none;}common-panel-set:not([preferred-display]) .common-panel-tabs,common-panel-set[preferred-display=\"accordion\"] .common-panel-tabs {  display: none;}common-panel-set:not([preferred-display]) > common-panel:not(:last-child),common-panel-set[preferred-display=\"accordion\"] > common-panel:not(:last-child) {  margin-bottom: -1px;}common-panel-set:not([preferred-display]) > common-panel > .common-panel-header span::before,common-panel-set[preferred-display=\"accordion\"] > common-panel > .common-panel-header span::before {  display: none;}common-panel-set:not([preferred-display]) > common-panel[expansion-state=\"opened\"] .common-panel-header,common-panel-set[preferred-display=\"accordion\"] > common-panel[expansion-state=\"opened\"] .common-panel-header {  background-color: #f7f7f7;  color: #000000;}common-panel-set[preferred-display=\"carousel\"] {  position: relative;}common-panel-set[preferred-display=\"carousel\"] > common-panel {  min-height: 200px;}common-panel-set[preferred-display=\"carousel\"] > common-panel > .common-panel-header-box > .common-panel-header span::after {  display: none;}common-panel-set[preferred-display=\"carousel\"] > common-panel .common-panel-header {  background-color: transparent;  border-bottom: 0;  color: #000000;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs {  display: block;  position: absolute;  z-index: 1;  bottom: 10px;  left: 90%;  right: 0;  border: 0;  background-color: transparent;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header {  background-color: #ccc;  border: 2px solid #aaa;  height: 6px;  margin-right: 2px;  -webkit-border-radius: 14px;  -moz-border-radius: 14px;  -ms-border-radius: 14px;  -o-border-radius: 14px;  border-radius: 14px;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header:hover,common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header:focus {  background-color: #ccc;  border-color: inherit;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header[aria-selected],common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header[aria-selected]:hover,common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header[aria-selected]:focus {  background-color: #fff;  border: 2px solid #000;}common-panel-set[preferred-display=\"carousel\"] > common-panel:not([expansion-state=\"opened\"]) {  display: none;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > * {  display: inline;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header > span {  display: none;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs .common-panel-remove {  display: none;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header {  padding: 1px 4px;}common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header[aria-selected],common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header[aria-selected]:hover,common-panel-set[preferred-display=\"carousel\"] > .common-panel-tabs > .common-panel-header-box > .common-panel-header[aria-selected]:focus {  -webkit-border-radius: 14px;  -moz-border-radius: 14px;  -ms-border-radius: 14px;  -o-border-radius: 14px;  border-radius: 14px;}.visually-hidden {  position: absolute;  overflow: hidden;  clip: rect(0 0 0 0);  height: 1px;  width: 1px;  margin: -1px;  padding: 0;  border: none;}";
  document.head.appendChild(sheet);

  angular.module("commonPanels", [])
    .directive("transcludeReplace", ["$log", function($log) {
      return {
        terminal: true,
        restrict: "EA",
        link: function($scope, $element, $attr, ctrl, transclude) {
          if (!transclude) {
            $log.error("orphan",
              "No parent directive that requires a transclusion found.");
            return;
          }
          transclude(function(clone) {
            if (clone.length) {
              $element.replaceWith(clone);
            } else {
              $element.remove();
            }
          });
        }
      };
    }])
    .directive("commonPanelSet", ["$interpolate", function($interpolate) {
      var _registerChild = function (ownElement, panelElement, tabElement) {
        var headerElement = panelElement.headerElement,
            contentElement = panelElement.contentElement,
            tabsContainer = find(ownElement, ">.common-panel-tabs");


        angular.element(tabsContainer).append(tabElement);

        if (!panelElement.hasAttribute("is-removable")) {
          hideRemovable(tabElement);
        }

        ownElement.setAttribute("role", "tablist");

        /* TODO: each of these has a related panel which needs wiring */
        panelElement.setAttribute("role", "presentation");
        headerElement.setAttribute("role", "presentation");
        contentElement.setAttribute("role", "tabpanel");
        tabElement.firstElementChild.setAttribute("role", "tab");

        // TODO: This seems bad, lets name the thing
        tabElement.firstElementChild.setAttribute("aria-controls", contentElement.id);

        // TODO: This seems bad, lets name the thing
        headerElement.firstElementChild.setAttribute("role", "tab");

        if (panelElement.getAttribute("expansion-state") === "opened") {
          ownElement.selectedIndex = ownElement.children.length-1;
        }
        tabElement.addEventListener("click", function() {
          // console.log("caught click %o", panelElement);
          ownElement.activePanelElement = panelElement;
        }, false);
        headerElement.addEventListener("click", function() {
          // console.log("caught click %o", panelElement);
          ownElement.activePanelElement = panelElement;
        }, false);


        // before the upgrade is finished this wont exist
        if (ownElement.common_panels) {
          if (panelElement.getAttribute("expansion-state") === "opened" || ownElement.common_panels.length === 1) {
            ownElement.activePanelElement = panelElement;
          } else {
            panelElement.expansionState = "closed";
          }
        }
      };
      return {
        restrict: "E",
        controller: ["$scope", "$element", function($scope, $element) {
          this.addPanel = function(panelElement, panelScope) {
            var ownElement = $element[0];
            var tab = angular.element($interpolate(templates.tab)(panelScope))[0];
            find(tab, ">* .common-panel-title").innerHTML = panelScope.title;
            _registerChild(ownElement, panelElement, tab);
          };
        }],
        link: function($scope, $element) {
          var ownElement = $element[0];
          ownElement.selectedIndex = ownElement.selectedIndex || -1;

          Object.defineProperties(ownElement, {
            common_panels: {
              get: function() {
                return findAll(this, ">common-panel");
              }
            },
            activePanelElement: {
              get: function() {
                // TOOD: add a .common_panels definition
                // TODO: best way to find the expanded element?
                return ownElement.common_panels[ownElement.selectedIndex];
              },
              set: function(panel) {
                var panels = ownElement.common_panels;
                ownElement.selectedIndex = panels.indexOf(panel);
                ownElement.selectedIndex = (ownElement.selectedIndex !== -1) ? ownElement.selectedIndex : 0;
                // setting a panel element active has a side effect of making siblings inactive...
                panels.forEach(function(curPanel, i) {
                  // console.log(curPanel);
                  curPanel.expansionState = (i === ownElement.selectedIndex) ? "opened" : "closed";
                });
              }
            },
            // TODO: maybe this shouldnt be an instance method, it is on original proto too
            setFocusForActivePanel: {
              value: function (force) {
                var headerElement, tabProxyElement, activePanelElement = this.activePanelElement;
                if (activePanelElement) {
                  headerElement = activePanelElement.headerElement;
                  tabProxyElement = activePanelElement.tabProxyElement;
                  // TODO: do we still need last set/mutations?
                  if (force || lastSet) {
                    if (headerElement.firstElementChild.offsetHeight !== 0) {
                      headerElement.firstElementChild.focus();
                    } else {
                      tabProxyElement.focus();
                    }
                  }
                }
              }
            },
            selectNextTab: {
              value: function () {
                var self = this, panels = this.common_panels;
                if (this.selectedIndex < panels.length-1) {
                  this.selectedIndex++;
                }
                this.activePanelElement = this.common_panels[this.selectedIndex];
                setTimeout(function() {
                  self.setFocusForActivePanel(true);
                }, FOCUS_DELAY);
              }
            },
            selectPreviousTab: {
              value: function () {
                var self = this;
                if (this.selectedIndex > 0) {
                  this.selectedIndex--;
                }
                this.activePanelElement = this.common_panels[this.selectedIndex];
                setTimeout(function() {
                  self.setFocusForActivePanel(true);
                }, FOCUS_DELAY);
              }
            }

            /* TODO:
                add selectNextTab / selectPreviousTab on ownElement + keydown listener for keyCode 37-40

                Add _registerChild? Not sure angular will like that or why you would use it
           figure that out, it is very similar to addPanel in the controller

           add _deregisterChild? Again, if there is cleanup to do, like the
           transferral of focus/selected index, etc
            */
          });
          ownElement.activePanelElement = findAll(ownElement, ">common-panel")[ownElement.selectedIndex];
          ownElement.addEventListener("keydown", function(evt) {
            // console.log("caught keys");
            if (document.activeElement.classList.contains("common-panel-header")){
              
              switch (evt.keyCode) {
  
                case 37:
                  // console.log("pressed left"); /* previous tab */
                  ownElement.selectPreviousTab();
                  break;
                case 38:
                  // console.log("pressed up");
                  ownElement.selectPreviousTab();
                  evt.preventDefault();
                  break;
                case 39:
                  // console.log("pressed right"); /* next tab */
                  ownElement.selectNextTab();
                  break;
                case 40:
                  // console.log("pressed down");
                  ownElement.selectNextTab();
                  evt.preventDefault();
                  break;
              }
            }
          });
          // TODO: add key handler here which calls selectNextTab or selectPreviousTab

        },
        template: templates.tabset,
        transclude: true
      };
    }])
    .directive("commonPanel", ["$interpolate", "$sce", function($interpolate, $sce) {
      return {
        require: "^?commonPanelSet",
        restrict: "E",
        scope: {
          /*,
           title: "@",
           expansion: "@expansionState", TODO: find out how to deal with boolean attrs
           removable: "@isRemovable"*/
        },
        controller: function() {
          // calculations controls management here?
        },
        transclude: true,
        template: templates.tab + templates.tabcontent,
        link: function(scope, element, attrs, commonPanelSetCtrl) {
          var ownElement = element[0],
            contentElement,
            headerElement,
            titleElement,
            isExpandable;

          Object.defineProperties(ownElement, {
            headerElement: {
              get: function() {
                return find(this, ">.common-panel-header-box");
              }
            },
            contentElement: {
              get: function() {
                return find(this, "> .common-panel-content");
              }
            },
            tabProxyElement: {
              get: function() {
                var ret;
                if (this.parentElement && this.parentElement.tagName === "COMMON-PANEL-SET") {
                  ret = find(this.parentElement, ">.common-panel-tabs>.common-panel-header-box>.common-panel-header[aria-controls=\"" + this.contentElement.id + "\"]");
                }
                return ret;
              }
            },
            expansionState: {
              set: function(state) {
                var evt,
                  contentElement = this.contentElement,
                  isOpen = "opened" === state,
                  tabProxyElement = this.tabProxyElement;

                this.setAttribute("expansion-state", state);
                manageBooleanAttr(contentElement, "aria-hidden", !isOpen);
                manageBooleanAttr(contentElement, "aria-expanded", isOpen);
                contentElement.setAttribute("tabindex", (isOpen) ? "0" : "-1");

                // TODO: Is there a 'more angular' way to do this? do we need to worry?
                if (tabProxyElement) {
                  manageBooleanAttr(tabProxyElement, "aria-selected", isOpen);
                  tabProxyElement.setAttribute("tabindex", (isOpen) ? "0" : "-1");
                }

                if (isOpen) {
                  evt = document.createEvent("CustomEvent");
                  evt.initCustomEvent("_activate", true, true, null);
                  this.dispatchEvent(evt);
                }
              }
            },
            toggleExpansionState: {
              value: function() {
                var current = this.getAttribute("expansion-state");
                var isClosedOrDefault = (current === null || current === "closed");
                // console.log("called toggle on " + this + " " + isClosedOrDefault);
                this.expansionState = (isClosedOrDefault) ? "opened" : "closed";
              }
            }
            /* TODO: add toggle expansion state and destructor which handles communication back up
            so panelset can manage focus/activation properly
            add
             */
          });
          ensureId(ownElement);
          ownElement.setAttribute("role", "group");

          contentElement = ownElement.contentElement;
          ensureId(ownElement.contentElement);

          headerElement = ownElement.headerElement;
          ensureId(ownElement.headerElement);

          attachDescriptorBefore(headerElement.querySelector(".common-panel-remove"), "panel");
          attachDescriptorBefore(contentElement.firstElementChild, "panel content");

          isExpandable = ownElement.hasAttribute("expansion-state");
          /* Tricky, this has to be kind of a 'non-element' else it is currently circular */
          findAll(contentElement, ">common-panel-title").forEach(function(potential) {
            titleElement = potential.parentElement.removeChild(potential);
          });

          scope.title = "";
          try {
           scope.title = $sce.trustAsHtml($interpolate(titleElement.innerHTML)(scope.$parent));
          } catch (e) {

          }
          // TODO: see if there is a way to map stupid boolean attributes
          scope.isRemovable = ownElement.hasAttribute("is-removable");

          // TODO: this is only relevent if the thing is expandable or is inside a panelset
          headerElement.firstElementChild.setAttribute("aria-controls", contentElement.id);
          scope.identifiers = {
            panel: ownElement.id,
            content: contentElement.id,
            header: headerElement.id
          };

          if (!scope.isRemovable) {
            hideRemovable(headerElement);
          }
          // wire up aria controls
          if (commonPanelSetCtrl) {
            // copy title into parent scope - TODO: +comment on why is the parent scope necessary here? iteration?
            scope.$parent.title = scope.title;
            commonPanelSetCtrl.addPanel(ownElement, scope.$parent);
          } else {
            //TODO: wire up expansion toggle?
            if (isExpandable || scope.isRemovable)
              headerElement.addEventListener("click", function(evt) {
                if (evt.target.matches(".common-panel-remove") ||
                  (evt.target.parentElement && evt.target.parentElement.matches(".common-panel-remove"))) {
                  ownElement.parentElement.removeChild(ownElement);
                } else if (ownElement.hasAttribute("expansion-state")) {
                  ownElement.toggleExpansionState();
                  ownElement.setAttribute(
                    "expansion-state", (ownElement.getAttribute("expansion-state") === "opened") ? "opened" : "closed"
                  );
                }
              }, false);

              if (isExpandable) {
                headerElement.addEventListener("keydown", function(evt) {
                    if (evt.keyCode === 32) {
                        ownElement.toggleExpansionState();
                    }
                }, false);
              }
            // TODO: clean this up? the angular boolean attribute stuff is weird



          }

          if (window.MediaQueryMappings && window.MediaQueryMappings.recalc) {
            setTimeout(function () {
              window.MediaQueryMappings.recalc();
            }, 10);
          }
        }
      };
    }]);

})(window.angular);
