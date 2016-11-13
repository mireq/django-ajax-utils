(function(_) {
	_.pjax.autoRegister({
		bodyLoadingCls: 'loading',
		pjaxContainerId: 'main_content',
		extrajsBlock: 'extrajs',
		extrastyleBlock: 'extrastyle',
		titleBlock: 'head_title',
		onLoaded: function(response, url) {
			_.id('messages_container').innerHTML = '';
			var container = document.createElement('DIV');
			container.innerHTML = response.blocks.messages;
			var messages = _.tag(container, 'LI');
			_.forEach(messages, function(message) {
				_.messageShow({
					messageText: message.innerHTML,
					cls: message.className,
				});
			});
		}
	});
}(_utils));
