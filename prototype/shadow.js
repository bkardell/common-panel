document.registerElement(
	"shade-root",
	{
		"prototype": Object.create({
			HTMLElement.prototype, {
				createdCallback: {
					value: function () {
						console.log("I made this.");
					}
				}
			}
		})
	}
);