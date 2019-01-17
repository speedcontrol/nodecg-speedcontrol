'use strict';
$(() => {
	var $importSchedule = $('#importSchedule');
	var $loadScheduleData = $('#loadScheduleData');
	var $helpText = $('#loadHelpPrompt');
	var customData = nodecg.bundleConfig.schedule.customData || [];

	var scheduleImporting = nodecg.Replicant('horaroScheduleImporting');
	
	$loadScheduleData.button();
	$importSchedule.button({disabled: true});
	$helpText.html('Insert the Horaro schedule URL above and press the "Load Schedule Data" button to continue.');
	
	// Fill in URL box with default if specified in the config file.
	if (nodecg.bundleConfig && nodecg.bundleConfig.schedule && nodecg.bundleConfig.schedule.defaultURL)
		$('#scheduleURL').val(nodecg.bundleConfig.schedule.defaultURL);
	
	// Initial load of the schedule data so the user can select the correct columns.
	$loadScheduleData.click(() => {
		$('#columnsDropdownsWrapper').html('');
		
		nodecg.sendMessage('loadScheduleData', $('#scheduleURL').val(), (err, data) => {
			var columns = data.schedule.columns;
			$helpText.html('Select the correct columns that match the data type below, if the one auto-selected is wrong.<br><br>');
			
			// What a nice mess.
			var dropdownsHTML = '<div class="selectWrapper"><span class="selectName">Game:</span><span class="selectDropdown"><select class="columnOptions" id="gameColumns"></select></span></div>\
			<div class="selectWrapper"><span class="selectName">Game (Twitch):</span><span class="selectDropdown"><select class="columnOptions" id="gameTwitchColumns"></select></span></div>\
			<div class="selectWrapper"><span class="selectName">Category:</span><span class="selectDropdown"><select class="columnOptions" id="categoryColumns"></select></span></div>\
			<div class="selectWrapper"><span class="selectName">System:</span><span class="selectDropdown"><select class="columnOptions" id="systemColumns"></select></span></div>\
			<div class="selectWrapper"><span class="selectName">Region:</span><span class="selectDropdown"><select class="columnOptions" id="regionColumns"></select></span></div>\
			<div class="selectWrapper"><span class="selectName">Released:</span><span class="selectDropdown"><select class="columnOptions" id="releaseColumns"></select></span></div>\
			<div class="selectWrapper"><span class="selectName">Players:</span><span class="selectDropdown"><select class="columnOptions" id="playerColumns"></select></span></div>';
			
			// Add dropdowns for custom data as specified in the config.
			customData.forEach((customDataElem) => {
				if (customDataElem.key && customDataElem.name)
					dropdownsHTML += '<div class="selectWrapper"><span class="selectName">'+customDataElem.name+':</span><span class="selectDropdown"><select class="columnOptions" id="'+customDataElem.key+'Columns"></select></span></div>';
			});

			var playerSplitDropdown = $('<br><div class="selectWrapper"><span class="selectName">Split Players: <a href="#" title="This option dictates how the players in your relevant schedule column are split; check the README for more information.">?</a></span><span class="selectDropdown"><select id="playerSplitOption"></select></span></div>');
			$('#playerSplitOption', playerSplitDropdown).append($('<option>', {value: 0, text : 'vs/vs. [Teams]'}));
			$('#playerSplitOption', playerSplitDropdown).append($('<option>', {value: 1, text : 'Comma (,) [No Teams]'}));

			$('#columnsDropdownsWrapper').html(dropdownsHTML);
			$('#columnsDropdownsWrapper').append(playerSplitDropdown);
			
			// Adds a -1 N/A selection for if the column isn't on their schedule.
			$('#columnsDropdownsWrapper select.columnOptions').append($('<option>', { 
				value: -1,
				text : 'N/A'
			}));
			
			// Adds all other available columns as options to the dropdowns.
			$.each(columns, (i, column) => {
				$('#columnsDropdownsWrapper select.columnOptions').append($('<option>', {
					value: i,
					text : column
				}));
			});
			
			$importSchedule.button({disabled: false});
			
			// Here's where we try to lazily guess the correct columns using common names.
			var foundColumns = {
				game: false,
				category: false,
				system: false,
				region: false,
				release: false,
				player: false
			}
			for (var i = 0; i < columns.length; i++) {
				if (columns[i].toLowerCase().indexOf('game') >= 0 && !foundColumns.game) {
					$('#gameColumns').val(i);
					foundColumns.game = true;
				}
				
				if (columns[i].toLowerCase().indexOf('category') >= 0 && !foundColumns.category) {
					$('#categoryColumns').val(i);
					foundColumns.category = true;
				}
				
				if ((columns[i].toLowerCase().indexOf('system') >= 0 || columns[i].toLowerCase().indexOf('platform') >= 0 || columns[i].toLowerCase().indexOf('console') >= 0) && !foundColumns.system) {
					$('#systemColumns').val(i);
					foundColumns.system = true;
				}
				
				if (columns[i].toLowerCase().indexOf('region') >= 0 && !foundColumns.region) {
					$('#regionColumns').val(i);
					foundColumns.region = true;
				}

				if (columns[i].toLowerCase().indexOf('release') >= 0 && !foundColumns.release) {
					$('#releaseColumns').val(i);
					foundColumns.release = true;
				}
				
				if ((columns[i].toLowerCase().indexOf('player') >= 0 || columns[i].toLowerCase().indexOf('runner') >= 0) && !foundColumns.player) {
					$('#playerColumns').val(i);
					foundColumns.player = true;
				}

				customData.forEach((customDataElem) => {
					if (columns[i].toLowerCase().indexOf(customDataElem.name.toLowerCase()) >= 0 && !foundColumns[customDataElem.key]) {
						$(`#${customDataElem.key}Columns`).val(i);
						foundColumns[customDataElem.key] = true;
					}
				});
			}
		});
	});
	
	// This is all of the importing stuff that happens when the button is pressed.
	$importSchedule.click(() => {
		// The user must at least select something for the "Game" setting.
		if (parseInt($('#gameColumns').val()) < 0) {
			alert('At least the "Game" column must be set.');
			return;
		}
		
		// One last chance to cancel in case so people don't accidentally delete everything.
		if (!confirm('Importing will remove all the current runs added. Continue?'))
			return;

		// Get column numbers from the dropdowns selected by the user.
		var columnNumbers = {
			game: parseInt($('#gameColumns').val()),
			gameTwitch: parseInt($('#gameTwitchColumns').val()),
			category: parseInt($('#categoryColumns').val()),
			system: parseInt($('#systemColumns').val()),
			region: parseInt($('#regionColumns').val()),
			release: parseInt($('#releaseColumns').val()),
			player: parseInt($('#playerColumns').val()),
			playerSplit: parseInt($('#playerSplitOption').val()), // Hijacking this for setting the player split option.
			custom: {}
		};
		// Add the custom data stuff if needed.
		customData.forEach((customDataElem) => {
			if (customDataElem.key && customDataElem.name)
				columnNumbers.custom[customDataElem.key] = parseInt($('#'+customDataElem.key+'Columns').val());
		});

		nodecg.sendMessage('importScheduleData', columnNumbers, (err) => {
			// Triggers when finished.
			// Right now nothing extra needs to be done here.
		});
	});

	scheduleImporting.on('change', (newVal) => {
		if (newVal.importing) {
			// disable stuff
			$importSchedule.button({disabled: true, label: 'Importing... ('+newVal.item+'/'+newVal.total+')'});
			$('#columnsDropdownsWrapper').html('');
			$helpText.html('Schedule import currently in progress, please wait.');
			$loadScheduleData.button({disabled: true});
		}

		else if (!newVal.importing) {
			// enable stuff
			$importSchedule.button({disabled: true, label:'Import'});
			$('#columnsDropdownsWrapper').html('');
			$helpText.html('Insert the Horaro schedule URL above and press the "Load Schedule Data" button to continue.');
			$loadScheduleData.button({disabled: false});
		}
	});
});