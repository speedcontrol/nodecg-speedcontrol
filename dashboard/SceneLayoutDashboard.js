$(function () {
    var $editModeRadio = $('input[name=enableEditMode]');
    var $backgroundTransparanceRadio = $('input[name=backgroundTransparency]');
    var toggle = false;

    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function (oldVal, newVal) {
        if (newVal != "" && typeof newVal != 'undefined') {
            if (newVal.editMode != null && newVal.editMode == true) {
                var radio = $('#enableEditModeOn');
                radio[0].checked = true;
                radio.button("refresh");
            }
            if (newVal.editMode != null && newVal.backgroundTransparency == true) {
                var radio = $('#backgroundTransparencyOn');
                radio[0].checked = true;
                radio.button("refresh");
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


