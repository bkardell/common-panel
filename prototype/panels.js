(function (registerElement) {
	var logErr = function (err) {
		if (console && console.err) {
			console.err(err);
		}
	}, 
	lastUid = Date.now(),
	nextUid = function (pref) {
		return (pref||"-cp-") + (++lastUid);
	};

	document.registerElement(
		"common-panel-set", {
			prototype: Object.create (
				HTMLElement.prototype, {
				createdCallback: { value: function () {
					var self = this;
					var tabbarEl = document.createElement("div");
					this.selectedIndex =  0;
					this.common_panels = [];
					
					/* Wrapping these so that they respond to changes to preferred display without losing focus */
					var oldSetAttr = this.setAttribute;
					var oldRemoveAttr = this.removeAttribute;
					var lastSet;
					this.setAttribute = function (key, value, symbolKey) {
						console.log("someone changed my preferred display");
						if (symbolKey === "secret") {
							var activePanel = self.getActivePanel();
							var header = activePanel.getHeader();
							var tab = document.getElementById(activePanel.getAttribute("aria-labeledby"));
							lastSet = ([header, tab].indexOf(document.activeElement) !== -1);
							oldSetAttr.call(self, key, value);
						} else {
							throw new TypeError();
						}
						setTimeout(setFocusForActivePanel, 50);
					};
					this.removeAttribute = function (key, symbolKey) {
						console.log("someone changed my preferred display");
						if (symbolKey === "secret") {
							var activePanel = self.getActivePanel();
							var header = activePanel.getHeader();
							var tab = document.getElementById(activePanel.getAttribute("aria-labeledby"));
							lastSet = ([header, tab].indexOf(document.activeElement) !== -1);
							oldRemoveAttr.call(self, key);
							setTimeout(setFocusForActivePanel,500);
						} else {
							throw new TypeError();
						}
					}


					tabbarEl.className = "common-panel-tabs";
					this.insertBefore(tabbarEl, this.firstChild);
					this.id = this.id || nextUid();

					tabbarEl.setAttribute("role", "tablist");

					this.getActivePanel = function () {
						return this.common_panels[this.selectedIndex];
					};

					this.selectNextTab = function () {
						if (self.selectedIndex < self.common_panels.length-1) {
							self.selectedIndex++;
						}
						self.selectTab(self.common_panels[self.selectedIndex]);
					}
					this.selectPreviousTab = function () {
						if (self.selectedIndex > 0) {
							self.selectedIndex--;
						}
						self.selectTab(self.common_panels[self.selectedIndex]);
					}

					this._addTab = function (tab) {
						var ref = document.querySelector("#" + tab.getAttribute("aria-controls"));

						// is this correct? more likely it should be tab content with this role
						// ref.setAttribute("role", "tabpanel");
						ref.getContent().setAttribute("role", "tabpanel");

						ref.setAttribute("aria-labeledby", tab.id);
						tab.setAttribute("role", "tab");
						if (ref.getAttribute("expansion-state") === "opened") {
							tab.setAttribute("expansion-state", "opened");
							ref.setAttribute("tabindex", "0");
							tab.setAttribute("tabindex", "0");
							self.selectedIndex = self.common_panels.length; /* todo: what about dynamically added? */
						} else {
							ref.setAttribute("expansion-state", "closed");
							tab.setAttribute("expansion-state", "closed");
							ref.setAttribute("tabindex", "-1");
							tab.setAttribute("tabindex", "-1");
						}
						
						if (!ref.hasAttribute("is-removable")) {
							//TODO: fix for nested cases
							tab.querySelector(".common-panel-remove").style.display = "none";
						}
						this.common_panels.push(ref);
						tabbarEl.appendChild(tab.cloneNode(true));
					};
					var setFocusForActivePanel = function () {
						var activePanel = self.getActivePanel();
						var header = activePanel.getHeader();
						var tab = document.getElementById(activePanel.getAttribute("aria-labeledby"));
						// IS the content focused or the tab or something in one of them or neither?!?
						// YIKES!  the only ones we care about though really are the panel or the tab transfers


						// THIS WOULD BE BETTER AS A CHECK FOR ARIA HIDDEN ON THE TABLIST
						if (lastSet) {						
							if (self.getAttribute("preferred-display") === "tabset") {
								tab.focus(); 
							} else {
								header.focus();
							}
						} 
					};

					this.selectTab = function (el) {
						var activePanelId = el.getAttribute("aria-controls") || el.id;
						// now we just have to figure out which ones to mark enabled or disabled
						var allMyPanels = Array.prototype.slice.call(self.querySelectorAll("#" + self.id + ">common-panel"));
						var allMyTabs =  Array.prototype.slice.call(tabbarEl.querySelectorAll("#" + self.id + ">.common-panel-tabs>div"));

						allMyPanels.forEach(function (panelEl) {
							var relatedTab = document.getElementById(panelEl.getAttribute("aria-labeledby"));
							if (panelEl.id === activePanelId) {
								// the panel itself is active / has expansion state
								panelEl.setAttribute("expansion-state", "opened");
								
								// but it is content that is hidden...
								panelEl.getContent().removeAttribute("aria-hidden");

								// "related" tab is a misnomer, there are two - this one is the true 'tab'
								relatedTab.setAttribute("aria-expanded", "true");
								relatedTab.setAttribute("aria-selected", "true");
								
								panelEl.setAttribute("tabindex", "0");
								relatedTab.setAttribute("tabindex", "0");
							} else {
								panelEl.setAttribute("expansion-state", "closed");
								
								panelEl.getContent().setAttribute("aria-hidden", true);
								
								relatedTab.setAttribute("aria-expanded", "false");
								relatedTab.removeAttribute("aria-selected");
								panelEl.setAttribute("tabindex", "-1");
								relatedTab.setAttribute("tabindex", "-1");
							}
						});
						allMyTabs.forEach(function (tabEl, i) {
							var relatedPanel = document.getElementById(tabEl.getAttribute("aria-controls"));
							if (tabEl.getAttribute("aria-controls") === activePanelId) {
								tabEl.setAttribute("expansion-state", "opened");
								tabEl.removeAttribute("aria-hidden");
								relatedPanel.setAttribute("aria-expanded", "true");
								self.activePanel = tabEl;
								relatedPanel.setAttribute("aria-selected", "true");
								self.selectedIndex = i;
							} else {
								tabEl.setAttribute("expansion-state", "closed");
								tabEl.setAttribute("aria-hidden", true);
								relatedPanel.setAttribute("aria-expanded", "false");
								relatedPanel.removeAttribute("aria-selected");
							}
						});
						// we need lastSet now...
						lastSet = self.activePanel;
						setTimeout(setFocusForActivePanel, 50);
					};

					// removing a panel should select the one before it if there are any or the one after it if none
					this.removePanel= function (el) {
						console.log("remove?");
					};

					// we want to attach a listener
					this.addEventListener("click", function (evt) {
						// this is crazy, too bound to underlying els
						if (evt.target.matches(".common-panel-remove") || evt.target.parentElement.matches(".common-panel-remove") ) {
							debugger;
							var tab = evt.target.closest("[aria-controls]");
							var panel = self.querySelector("#" + tab.getAttribute("aria-controls"));
							if (panel === self.getActivePanel()) {
								self.common_panels.splice(self.selectedIndex,1);
								if (self.selectedIndex !== 0) {
									self.selectTab(self.common_panels[self.selectedIndex-1]);
								} else {
									self.selectTab(self.common_panels[0]);
								}

							}
							panel.parentElement.removeChild(panel);
							tab.parentElement.removeChild(tab);


						} else if (evt.target.matches("[aria-controls]")) {
							self.selectTab(evt.target);
						} else if (evt.target.parentElement.matches("[aria-controls]")) {
							self.selectTab(evt.target.parentElement);
						} else if (evt.target.parentElement.parentElement.matches("[aria-controls]")) {
							self.selectTab(evt.target.parentElement.parentElement);
						}
					}, false);

					this.addEventListener("keydown", function (evt) {
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
								console.log("pressed right");	/* next tab */
								self.selectNextTab();
								break;
							case 40:
								console.log("pressed down");
								self.selectNextTab();
								break;
						}

					}, false);


					// we need to probably tweak the prototype or wrap the underlying
					// panel's so that when you set or remove the selected attribute
					// it echoes to the other...
				}
			}})
		});

	document.registerElement(
		"common-panel", {
			prototype: Object.create(
				HTMLElement.prototype,
				{
					createdCallback: { value: function () {
						// nothing to do here
						var self = this;
						var tab = document.createElement("div");
						var ownedBy = this.closest("common-panel-set")
						this.innerHTML = '<div class="common-panel-content" tabindex="0">' + this.innerHTML + '</div>'; 
						tab.className = "common-panel-header";
						this.id = this.id || nextUid();
						tab.setAttribute("aria-controls", this.id);
						tab.id = nextUid();
						this.getHeader = function () {
							return self.querySelector("#" + self.id + "> .common-panel-header"); 
						};
						this.getContent = function () {
							return self.querySelector("#" + self.id + "> .common-panel-content");
						};
						tab.innerHTML = '<i class="common-panel-icon"></i><span>' + this.getAttribute('title') + '</span><button class="common-panel-remove"><i></i></button>';
						if (ownedBy) {
							ownedBy._addTab(tab);
						} else {
							// we're making the whole thing clickable and 
							// adding a span to the title so that we can 
							// ::before and ::after
							tab.setAttribute("tabindex", 0);
							tab.expand = function () {
								var current;
								if (self.matches("[expansion-state]")) {
									current = self.getAttribute("expansion-state");
									self.setAttribute("expansion-state", (current === null || current === "closed") ? "opened" : "closed" );
									self.setAttribute("aria-expanded", (current === null || current === "false") ? "true" : "false" );
										
								}
							};
							tab.addEventListener("click", tab.expand, false);
							self.addEventListener("keydown", function (evt) {
								if (evt.keyCode === 32) {
									tab.expand();
								}
							}, false);
						}
						this.insertBefore(tab, this.firstChild);
						// we need .closest() here...

						if (!this.hasAttribute("is-removable")) {
							this.querySelector(".common-panel-remove").style.display = "none";
						} else if (!ownedBy) {
							tab.addEventListener("click", function (evt) {
								var panel;
								if (evt.target.matches(".common-panel-remove") || evt.target.parentElement.matches(".common-panel-remove")) {
									panel = evt.target.closest("common-panel");
									panel.parentElement.removeChild(panel);
								}
							}, false);
						}
					}}
				})
	});
}(document.registerElement));



