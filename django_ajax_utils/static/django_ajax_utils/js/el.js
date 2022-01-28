(function(_) {


function el(tagName) {
	var i, leni;
	var attrs = {};
	var contentIndex = 1;
	if (arguments.length > 1 && arguments[1].constructor === Object) {
		attrs = arguments[1];
		contentIndex = 2;
	}
	tagName = tagName.split(/(?=[\.#])/);
	var tag = document.createElement(tagName[0]);
	for (i = 1, leni = tagName.length; i < leni; i++) {
		var tagExtra = tagName[i];
		if (tagExtra[0] === '.') {
			tag.classList.add(tagExtra.slice(1));
		}
		else {
			tag.setAttribute('id', tagExtra.slice(1));
		}
	}

	for (var attrName in attrs) {
		if (Object.prototype.hasOwnProperty.call(attrs, attrName)) {
			tag.setAttribute(attrName, attrs[attrName]);
		}
	}

	for (i = contentIndex, leni = arguments.length; i < leni; i++) {
		var content = arguments[i];
		if (content === undefined) {
			continue;
		}
		if (typeof content === 'string') {
			tag.appendChild(document.createTextNode(content));
		}
		else {
			tag.appendChild(content);
		}
	}

	return tag;
}


_.el = el;


}(_utils));
