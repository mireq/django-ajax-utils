(function(_) {

"use strict";

var current;

window.dumpVar = function(data) {
	var str = JSON.stringify(data, null, 4) + '\n';
	current.showOutput(str);
};

var runable = function(runElement) {
	var self = {};

	var runnableBlock = _.elem('DIV', {'class': 'runnable-block'});
	var actions = _.elem('DIV', {'class': 'actions'});
	var run = _.elem('A', {'class': 'run', 'href': '#', 'title': 'run'}, 'Run');
	var scriptOutput = _.elem('PRE', {'class': 'output'});
	scriptOutput.style.display = 'none';
	_.insertAfter(runnableBlock, runElement);
	actions.appendChild(run);
	runnableBlock.appendChild(actions);
	runnableBlock.appendChild(runElement);
	runnableBlock.appendChild(scriptOutput);

	self.code = runElement.textContent;

	self.run = function(event) {
		if (event !== undefined) {
			event.preventDefault();
		}
		scriptOutput.innerHTML = '';
		current = self;
		eval(self.code); // jshint ignore:line
		current = undefined;
		scriptOutput.style.display = 'block';
	};

	self.showOutput = function(code) {
		scriptOutput.appendChild(document.createTextNode(code));
	};

	_.bindEvent(run, 'click', self.run);

	return self;
};

var register = function(element) {
	var runElements = [];
	_.forEach(_.cls(element, 'run'), function(runElement) {
		if (runElement.tagName.toLowerCase() === 'pre') {
			runElements.push(runElement);
		}
	});
	_.forEach(runElements, function(runElement) {
		runable(runElement);
	});
};


_.onLoad(function(e) { register(e.memo); });


}(window._utils));
