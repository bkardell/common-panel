QUnit.config.autostart = false;

var verifyPanel = function (assert, el, opts) {
    var children = el.children,
        headerBox,
        contentBox,
        header,
        opts = opts || {},
        expectedPanelRole = (opts.isInSet) ? "presentation" : "group";

    assert.equal(
      el.getAttribute("role"),
      expectedPanelRole,
      "We expect role of a basic panel to be '" + expectedPanelRole + "'"
    );

    assert.equal(
      children.length,
      2,
      "there should be two child elements generated"
    );

    headerBox = children[0];
    contentBox = children[1];

    assert.ok(
      headerBox.classList.contains("common-panel-header-box"),
      "the first child should be common-panel-header-box"
    );

    assert.equal(
      headerBox.children.length,
      1,
      "the headerbox should contain 1 child, this allows for :before and :after styling"
    );

    header = headerBox.firstElementChild;

    assert.ok(
      header.hasAttribute("tabindex"),
      "the header should have a tab stop"
    );

    assert.equal(
      headerBox.getAttribute("role"),
      "presentation",
      "the role of the headerbox should be presentation"
    );

    assert.notOk(
      headerBox.hasAttribute("tabindex"),
      "the headerbox should not have a tab stop"
    );


    assert.equal(
      headerBox.children.length,
      1,
      "the headerbox should have exactly one child in the dom"
    );

    assert.ok(
      headerBox.firstElementChild.classList.contains("common-panel-header"),
      "the headerBox should container a header element"
    );

    assert.equal(
      headerBox.firstElementChild.children.length,
      4,
      "the headerbox should have exactly four children in the dom"
    );

    assert.ok(
      headerBox.firstElementChild.children[0].classList.contains("common-panel-icon"),
      "the headerbox contains a header whose first child is an icon slot"
    );

    assert.equal(
      headerBox.firstElementChild.children[0].innerHTML.trim(),
      "",
      "the icon slot is purely a decorative hook like a pseudo-element, it should be empty"
    );

    assert.ok(
      headerBox.firstElementChild.children[1].classList.contains("common-panel-title"),
      "the headerbox contains a header whose second child is the title slot"
    );


    /* TODO: maybe we should pass a specific expectation in */
    assert.ok(
      headerBox.firstElementChild.children[1].innerHTML.trim() != "",
      "the title slot should contain the title text, it shouldn't be empty"
    );

    /* TODO: we should really check to be sure it isn't visible but is available
    to a screen reader */
    assert.ok(
      headerBox.firstElementChild.children[2].classList.contains("visually-hidden"),
      "the headerbox contains a header whose first child is an icon slot"
    );

    assert.equal(
      headerBox.firstElementChild.children[2].innerHTML.trim(),
      "&nbsp;panel&nbsp;",
      "the panel title should announce that it is a 'panel' after reading the panel title"
    );

    assert.ok(
      headerBox.firstElementChild.children[3].classList.contains("common-panel-remove"),
      "the headerbox contains a header whose fourth child is an a remove button"
    );

    assert.equal(
      headerBox.firstElementChild.children[3].title,
      "Remove this panel",
      "the remove button should explain what it does in the title"
    );

    /* TODO: this should be passed in */
    assert[(opts.isRemovable) ? "notEqual" : "equal"](
      headerBox.firstElementChild.children[3].style.display,
      "none",
      "the remove button should be hidden via display"
    );

    assert.ok(
      contentBox.classList.contains("common-panel-content"),
      "the first child should be common-panel-content"
    );

    assert[opts.isInSet ? "equal" : "notEqual"](
      contentBox.getAttribute("role"),
      "tabpanel",
      "When part of a panelset, common-panel-content should have a role of 'tabpanel', otherwise none"
    );

    assert[opts.isExpandable ? "equal" : "notEqual"](
      contentBox.hasAttribute("aria-expanded"),
      "the aria-expanded attribute should be managed (or not) on the contentBox appropriately"
    );

    assert.ok(
      contentBox.hasAttribute("tabindex"),
      "the contentbox should have a tabstop"
    );


    /* TODO: we should really check to be sure it isn't visible but is available
    to a screen reader */
    assert.ok(
      contentBox.firstElementChild.classList.contains("visually-hidden"),
      "the contentbox's first child should be visually hidden but announce itself as 'panel content'"
    );

    /* TODO: add negative accessor/mutator DOM API verifications */
    assert.ok(typeof el.headerElement, "Panel should have a headerElement accessor");
    assert.ok(typeof el.contentElement, "Panel should have a contentElement accessor");
    assert.ok(typeof el.contentElement, "Panel should have a tabProxyElement accessor");
    assert.ok(typeof el.expansionState, "Panel should have a expansionState mutator");
    assert.ok(typeof el.toggleExpansionState, "Panel should have a toggleExpansionState method");

    /* TODO: add a test for what should happen if you call toggleExpansionState if the panel is not marked expandable? */

},
verifyPanelset = function (assert, panelset, opts) {
    var item,
      controlled,
      numPanels = opts.numPanels,
      selectedIndex = opts.selectedIndex || 0;

    assert.equal(
      panelset.getAttribute("role"),
      "tablist",
      "the role of a tabset should be tablist"
    );

    assert.notOk(
      panelset.hasAttribute("tabindex"),
      "the panelset element should not have a tab stop"
    );

    assert.ok(
      panelset.firstElementChild.classList.contains("common-panel-tabs"),
      "the first child of panelset should be common-panel-tabs"
    );

    assert.notOk(
      panelset.firstElementChild.hasAttribute("tabindex"),
      "common-panel-tabs should not have a tab stop"
    );

    assert.equal(
      panelset.firstElementChild.getAttribute("role"),
      "presentation",
      "the role of common-panel-tabs must be presentation"
    );

    // TODO: configure #tabs assertions
    assert.equal(
      panelset.firstElementChild.children.length,
      numPanels,
      "common-elements-tabs should contain 1 child per panel"
    );


    assert.equal(
      panelset.children.length,
      numPanels+1,
      "the panelset should have 1 common-panel per + 1 for common-panel-tabs"
    );

    /* verify a proper tab has been created for each one... */
    for (var i=0; i<panelset.firstElementChild.children.length; i++) {
      item = panelset.firstElementChild.children[i];
      assert.ok(
        item.classList.contains("common-panel-header-box"),
        "each child of common-element-tabs should be common-panel-header-box"
      );

      assert.notOk(
        item.hasAttribute("tabindex"),
        "common-panel-header-box should not have a tab stop"
      );

      assert.equal(
        item.getAttribute("role"),
        "presentation",
        "the role of a common-panel-header-box in common-element-tabs must be 'presentation'"
      );

      assert.equal(
        item.children.length,
        1,
        "each common-panel-header-box should have 1 child"
      );

      assert.ok(
        item.firstElementChild.classList.contains("common-panel-header"),
        "the first child of common-panel-heder-box should be common-panel-header"
      );

      assert.equal(
        item.firstElementChild.getAttribute("role"),
        "tab",
        "common-panel-header is a working 'tab' it must have this aria role"
       );


      assert.ok(
        item.firstElementChild.hasAttribute("tabindex"),
        "the common-panel-header should manage the tabindex attribute / potentially have a tabstop"
      );

      assert.ok(
        item.firstElementChild.hasAttribute("aria-controls"),
        "the common-panel-header should have an aria-controls attribute"
      );

      controlled = document.getElementById(item.firstElementChild.getAttribute("aria-controls"));

      assert.ok(
        controlled.classList.contains("common-panel-content"),
        "the common-panel-header should control a common-panel-content"
      );


      // todo: configure seleted
      if (i === selectedIndex) {
        assert.equal(
          item.firstElementChild.getAttribute("tabindex"),
          0,
          "selected element should have a tabindex of 0 allowing you to key in and out of it"
        );

        // TODO: revisit this in relation to the expansion state bug
        // https://github.com/bkardell/common-panel/issues/38
        // and https://github.com/bkardell/common-panel/issues/33
        assert.equal(
          panelset.children[i+1].getAttribute("expansion-state"),
          "opened",
          "the expansion state of the selected panel in a panelset should be 'opened'"
        );

        assert.ok(
          item.firstElementChild.hasAttribute("aria-selected"),
          "the selected tab should contain the aria-selected attribute"
        );
      } else {
        assert.equal(
            item.firstElementChild.getAttribute("tabindex"),
            -1,
            "unselected tab element should have a tabindex of -1 preventing tabs from keyboarding but allowing programatic control when keys are pressed"
          );

          // TODO: revisit this in relation to the expansion state bug
          // https://github.com/bkardell/common-panel/issues/38
          // and https://github.com/bkardell/common-panel/issues/33
          assert.equal(
            panelset.children[i+1].getAttribute("expansion-state"),
            "closed",
            "the expansion state of unselected panels in a panelset should be 'closed'"
          );
      }

      /* TODO: add negative accessor/mutator DOM API verifications */
      assert.ok(typeof panelset.activePanelElement, "Panel should have an activePanelElement accessor");
      assert.ok(typeof panelset.common_panels, "Panel should have a common_panels accessor");
      assert.ok(typeof panelset.selectNextTab, "Panel should have a selectNextTab method");
      assert.ok(typeof panelset.selectPreviousTab, "Panel should have a selectPreviousTab method");

      verifyPanel(assert, panelset.children[i+1], {isInSet: true});
    };
  };

// Lets just give it a whole second to load and upgrade everything...
setTimeout(function () {
  QUnit.test("basic panel test", function (assert) {
    verifyPanel(assert, document.querySelector("#basic-panel"));
  });

  QUnit.test("removable panel test", function (assert) {
    verifyPanel(assert, document.querySelector("#simple-removable"), {isRemovable: true});
  });

  QUnit.test("expandable panel test", function (assert) {
    verifyPanel(assert, document.querySelector("#simple-expandable"), {isExpandable: true});
  });

  QUnit.test("simple panelset test", function (assert) {
    verifyPanelset(assert, document.querySelector("#simple-panel-set"), {numPanels: 3});
  });

  QUnit.test("explicit expansion panelset test", function (assert) {
    verifyPanelset(assert, document.querySelector("#explicit-expansion-panelset"), {numPanels: 3, selectedIndex: 2});
  });

  QUnit.start();


}, 1000);