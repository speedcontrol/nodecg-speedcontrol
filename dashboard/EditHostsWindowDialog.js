$(function() {
	$('#operationResult').html('');
	$('.clearInputs').button();
	
	// Replicant stuff for hosts data.
	var hostsDataReplicant = nodecg.Replicant("hostsData", {defaultValue: []});
	hostsDataReplicant.on("change", function(oldValue, newValue) {
		updateFieldsFromReplicant();
	});
	
	// What to do if the user clicks on the "X" button to clear a certain host's fields.
	$('.hostDetails .clearInputs').click(function() {
		// Get ID of container and use that to clear the relevant inputs.
		var containerID = $(this).parent().attr('id');
		$('#' + containerID + ' .hostNameInput').val('');
		$('#' + containerID + ' .hostTwitchInput').val('');
	});
	
	// Clears all the inputs if the "clear all" button is clicked.
	$('#clearAll').click(function() {
		$('.hostNameInput').val('');
		$('.hostTwitchInput').val('');
		$('#operationResult').html('All fields cleared.');
	});
	
	// Resets the fields back to what they were when the "cancel" button is clicked.
	$('#cancel').click(function() {
		updateFieldsFromReplicant();
		$('#operationResult').html('Reverted changes.');
	});
	
	// What to do when the "apply changes" button is clicked.
	$('#confirm').click(function() {
		var hostsData = [];
		
		// Loops through all the host fields.
		$(".hostDetails").each(function(index) {
			var name = $('.hostNameInput', this).val();
			var twitch = $('.hostTwitchInput', this).val();
			
			// If the name has been set, process this information.
			if (name !== '') {
				hostsData.push({
					name: name,
					twitch: twitch
				});
			}
		});
		
		// Update the replicant with the new data.
		hostsDataReplicant.value = hostsData;
		
		$('#operationResult').html('Changes saved successfully.');
	});
	
	// Used to reset/update the fields based on the value of the replicant.
	function updateFieldsFromReplicant() {
		// Clear all the boxes.
		$('.hostNameInput').val('');
		$('.hostTwitchInput').val('');
		
		// Go through the current value of the replicant and fill in the details from it into the fields.
		var hostsData = hostsDataReplicant.value;
		for (var i = 0; i < hostsData.length; i++) {
			$('#hostDetails' + (i+1) + ' .hostNameInput').val(hostsData[i].name);
			$('#hostDetails' + (i+1) + ' .hostTwitchInput').val(hostsData[i].twitch);
		}
	}
});