$(function () {
    var $editModeRadio = $('input[name=enableEditMode]');
    var $saveConfigurationButton = $('#saveConfigurationButton');
    var $revertToDefaultButton = $('#revertToDefaultButton');
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

    $("#enableEditModeRadios").buttonset();
    $("#backgroundTransparencyRadios").buttonset();
    $saveConfigurationButton.button({});
    $revertToDefaultButton.button({});

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

    $saveConfigurationButton.click(function () {
        nodecg.sendMessage("savePositionConfiguration");
    });

    $revertToDefaultButton.click(function () {
        if(confirm("Revert _ALL_ overlays positioning to the default CSS values?")) {
            nodecg.sendMessage("revertToDefault");
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
})


