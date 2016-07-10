$(function() {
	var $editHostsButton = $('#editHostsButton');
	$editHostsButton.button();
	
	// Replicant initialization
    var hostsDataReplicant = nodecg.Replicant("hostsData", {defaultValue: []});
    hostsDataReplicant.on("change", function (oldValue, newValue) {
        if (typeof newValue !== 'undefined' && newValue != '') {
            hostLayout_UpdateLayoutPanel(newValue);
        }
		
		// Clears the sorting boxes if no hosts have been set.
		else if (typeof newValue !== 'Array' && newValue.length === 0) {
			$('#hostLayoutContainer').html('');
		}
    });

    function hostLayout_UpdateLayoutPanel(hosts) {
        var hostsSortableHTML = '<br>' +
            '<ul id="hostLayoutSortable">' +
            hostLayout_CreateHostListHtmlElements(hosts) +
            '</ul>';
        $('#hostLayoutContainer').html(hostsSortableHTML);
        $("#hostLayoutSortable").sortable({
            stop: function (event, ui) {
                // IE doesn't register the blur when sorting
                // so trigger focusout handlers to remove .ui-state-focus
                var sortedIDs = $('#hostLayoutSortable').sortable("toArray");
                var hostsContainer = hostsDataReplicant.value;
                var newHostDataArray = [];
                $.each(sortedIDs, function (index, valueId) {
                    $.each(hostsContainer, function (index, valueHostData) {
                        if (valueHostData.name == valueId) {
                            newHostDataArray.push(valueHostData);
                            return false;
                        }
                    });
                });
                hostsDataReplicant.value = newHostDataArray;
            }
        });

        $("#hostLayoutSortable").disableSelection();
    }

    function hostLayout_CreateHostListHtmlElements(hostArray) {
        var hostHTML = '';
        $.each(hostArray, function (index, value) {
            hostHTML += '<li class="ui-state-default" id="' + value.name + '">' + value.name + '</li>';
        });
        return hostHTML;
    }
});