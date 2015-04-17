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
      tabset: "<div class=\"common-panel-tabs\"></div>{{tabs}}<transclude-replace></ng-trasclude-replace>",
      tab: "<div class=\"common-panel-header-box\" role=\"presentation\"><div class=\"common-panel-header\" tabindex=\"0\"><i class=\"common-panel-icon\"></i><span class=\"common-paneltitle\"><common-panel-title>{{title}}</common-panel-title></span><button ng-show=\"isRemovable\" class=\"common-panel-remove\" title=\"Remove this panel\">×</button></div></div>",
      tabcontent: "<div class=\"common-panel-content\" tabindex=\"0\"><transclude-replace></transclude-replace></div>"
    };
  angular.module("commonPanels", [])
    .directive('transcludeReplace', ['$log', function($log) {
      return {
        terminal: true,
        restrict: 'EA',

        link: function($scope, $element, $attr, ctrl, transclude) {
          if (!transclude) {
            $log.error('orphan',
              'Illegal use of ngTranscludeReplace directive in the template! ' +
              'No parent directive that requires a transclusion found. ');
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
    .directive("commonPanelSet", function($interpolate) {
      return {
        restrict: "E",
        controller: function($scope, $element, $attrs) {
          this.addPanel = function(panelScope) {
            var ownElement = $element[0];
            ownElement.tabData = ownElement.tabData || [];
            ownElement.tabData.push(panelScope);
          };
        },
        link: function($scope, $element, $attrs, ngModel) {
          var ownElement = $element[0],
            tabsContainer = find(ownElement, ">.common-panel-tabs"),
            selectedIndex = 0;

          Object.defineProperties(ownElement, {
            common_panels: {
              get: function() {
                return findAll(this, '>common-panel');
              }
            },
            activePanelElement: {
              get: function() {
                // TOOD: add a .common_panels definition
                // TODO: best way to find the expanded element?
                return this.common_panels[selectedIndex];
              },
              set: function(panel) {
                var panels = this.common_panels;
                selectedIndex = panels.indexOf(panel);
                selectedIndex = (selectedIndex !== -1) ? selectedIndex : 0;
                // setting a panel element active has a side effect of making siblings inactive...
                panels.forEach(function(curPanel, i) {
                  console.log(curPanel);
                  curPanel.expansionState = (i === selectedIndex) ? "opened" : "closed";
                });
                // TODO: add key handling for keycode 32 / toggleExpansionState
                console.log(panels);
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
                    if (headerElement.firstElementChild.offsetParent) {
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
                if (selectedIndex < panels.length-1) {
                  selectedIndex++;
                }
                this.activePanelElement = this.common_panels[selectedIndex];
                setTimeout(function() { self.setFocusForActivePanel(true); }, FOCUS_DELAY);
              }
            },
            selectPreviousTab: {
              value: function () {
                var self = this;
                if (selectedIndex > 0) {
                  selectedIndex--;
                }
                this.activePanelElement = this.common_panels[selectedIndex];
                setTimeout(function() { self.setFocusForActivePanel(true); }, FOCUS_DELAY);
              }
            }

            /* TODO:
                add selectNextTab / selectPreviousTab on ownElement + keydown listener for keyCode 37-40

                Add _registerChild? Not sure angular will like that or why you'd use it
           figure that out, it's very similar to addPanel in the controller

           add _deregisterChild? Again, if there is cleanup to do, like the
           transferral of focus/selected index, etc
            */
          });
          console.log(">  %o", ownElement.tabData);
          ownElement.tabData.forEach(function(panelScope, i) {
            var panelElement = document.getElementById(panelScope.identifiers.panel),
              headerElement = document.getElementById(panelScope.identifiers.header),
              contentElement = document.getElementById(panelScope.identifiers.content),
              tabElement;


            console.log("this tab belongs to " + panelScope.identifiers.panel);
            angular.element(tabsContainer).append($interpolate(templates.tab)(panelScope));
            tabElement = tabsContainer.lastElementChild;

            /* TODO: each of these has a related panel which needs wiring */
            panelElement.setAttribute("role", "presentation");
            headerElement.setAttribute("role", "presentation");
            contentElement.setAttribute("role", "tabpanel");
            tabElement.setAttribute("role", "tab");

            // TODO: This seems bad, let's name the thing
            tabElement.firstElementChild.setAttribute("aria-controls", panelScope.identifiers.content);

            // TODO: This seems bad, lets name the thing
            headerElement.firstElementChild.setAttribute("role", "tab");

            if (panelElement.getAttribute("expansion-state") === "opened") {
              selectedIndex = i;
            }
            tabElement.addEventListener("click", function() {
              console.log("caught click %o", panelElement);
              ownElement.activePanelElement = panelElement;
            }, false);
            headerElement.addEventListener("click", function() {
              console.log("caught click %o", panelElement);
              ownElement.activePanelElement = panelElement;
            }, false);

          });

          ownElement.addEventListener("keydown", function(evt) {
            console.log("caught keys");
            switch (evt.keyCode) {

              case 37:
                // console.log("pressed left"); /* previous tab */
                ownElement.selectPreviousTab();
                break;
              case 38:
                // console.log("pressed up");
                ownElement.selectPreviousTab();
                break;
              case 39:
                // console.log("pressed right"); /* next tab */
                ownElement.selectNextTab();
                break;
              case 40:
                // console.log("pressed down");
                ownElement.selectNextTab();
                break;
            }
          });

          ownElement.activePanelElement = findAll(ownElement, '>common-panel')[selectedIndex];
          // TODO: add key handler here which calls selectNextTab or selectPreviousTab

        },
        template: templates.tabset,
        transclude: true
      };
    })
    .directive("commonPanel", function() {
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
                console.log("called toggle on " + this + " " + isClosedOrDefault);
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

          isExpandable = ownElement.hasAttribute("expansion-state");
          /* Tricky, this has to be kind of a 'non-element' else it is currently circular */
          findAll(contentElement, ">common-panel-title").forEach(function(potential) {
            titleElement = potential.parentElement.removeChild(potential);
          });

          scope.title = titleElement.innerHTML;

          // TODO: see if there is a way to map stupid boolean attributes
          scope.isRemovable = ownElement.hasAttribute("is-removable");

          // TODO: this is only relevent if the thing is expandable or is inside a panelset
          headerElement.firstElementChild.setAttribute("aria-controls", contentElement.id);
          scope.identifiers = {
            panel: ownElement.id,
            content: contentElement.id,
            header: headerElement.id
          };
          // wire up aria controls
          if (commonPanelSetCtrl) {
            //debugger;
            commonPanelSetCtrl.addPanel(scope);
          } else {
            //TODO: wire up expansion toggle?
            if (isExpandable || scope.isRemovable)
              headerElement.addEventListener("click", function(evt) {
                if (evt.target.matches(".common-panel-remove") ||
                  (evt.target.parentElement && evt.target.parentElement.matches(".common-panel-remove"))) {
                  ownElement.parentElement.removeChild(ownElement);
                } else if (ownElement.hasAttribute("expansion-state")) {
                  ownElement.toggleExpansionState();
                }

                ownElement.setAttribute(
                  "expansion-state", (ownElement.getAttribute("expansion-state") === "opened") ? "opened" : "closed"
                );
              }, false);

            // TODO: clean this up? the angular boolean attribute stuff is weird



          }

          //TODO: wire up media query listener?

        }
      }
    });

})(window.angular);