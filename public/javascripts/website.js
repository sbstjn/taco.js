$(document).ready(function() {
	$('.timeago').each(function(index, element) {
		$(element).html(moment($(element).html()).from(moment()));
	});
});