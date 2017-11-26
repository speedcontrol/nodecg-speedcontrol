$(function () {
	var $forceRefreshIntermissionButton = $('#forceRefreshIntermissionButton');
    $forceRefreshIntermissionButton.button();

	$forceRefreshIntermissionButton.click(function () {
        nodecg.sendMessage("forceRefreshIntermission");
    });

	
    var $editModeRadio = $('input[name=enableEditMode]');
    var $backgroundTransparanceRadio = $('input[name=backgroundTransparency]');
    var toggle = false;

    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function (newVal, oldVal) {
        if (newVal != "" && typeof newVal != 'undefined') {
            if (newVal.editMode != null && newVal.editMode == true) {
				$('#enableEditModeOn')[0].checked = true;
				$('#enableEditModeRadios').buttonset('refresh');
				
            }
            if (newVal.backgroundTransparency != null && newVal.backgroundTransparency == true) {
				$('#backgroundTransparencyOn')[0].checked = true;
				$('#backgroundTransparencyRadios').buttonset('refresh');
            }
        }
    });

    function sceneLayout_CreateSceneLayoutConfiguration() {
        var configuration = {};
        configuration.backgroundTransparency = false;
        configuration.editMode = false;
        return configuration;
    }

    function sceneLayout_GetOrCreateSceneLayoutConfiguration() {
        var configuration = sceneLayoutConfigurationReplicant.value;
        if (typeof configuration !== 'undefined' && configuration != '') {
            return configuration;
        }
        else {
            return sceneLayout_CreateSceneLayoutConfiguration();
        }
    }

    // Initialization,will be ran once on load

    $("#enableEditModeRadios").buttonset();
    $("#backgroundTransparencyRadios").buttonset();

    $backgroundTransparanceRadio.change(function () {
        var configuration = sceneLayout_GetOrCreateSceneLayoutConfiguration();
        configuration.backgroundTransparency = $(this).val() == "On";
        sceneLayoutConfigurationReplicant.value = configuration;
    });

    $editModeRadio.change(function () {
        var configuration = sceneLayout_GetOrCreateSceneLayoutConfiguration();
        configuration.editMode = $(this).val() == "On";
        sceneLayoutConfigurationReplicant.value = configuration;
    });

    // If we are live, disable editmode
    if (nodecg.bundleConfig && (typeof nodecg.bundleConfig.live !== 'undefined' && nodecg.bundleConfig.live === true)) {
        $("#enableEditModeRadios").buttonset({disabled: true});
    }
})
