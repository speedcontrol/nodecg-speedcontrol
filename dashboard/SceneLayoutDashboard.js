var $editModeRadio = $('input[name=enableEditMode]');
var $saveConfigurationButton = $('#saveConfigurationButton');
var $revertToDefaultButton = $('#revertToDefaultButton');
var $backgroundTransparanceRadio = $('input[name=backgroundTransparency]');
var toggle = false;

var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
sceneLayoutConfigurationReplicant.on('change', function(oldVal, newVal) {
});

$("#enableEditModeRadios").buttonset();
$("#backgroundTransparencyRadios").buttonset();
$saveConfigurationButton.button({});
$revertToDefaultButton.button({});

$backgroundTransparanceRadio.change(function() {
    var configuration = getOrCreateSceneLayoutConfiguration();
    configuration.backgroundTransparency = $(this).val() == "On";
    sceneLayoutConfigurationReplicant.value = configuration;
});

$editModeRadio.change(function() {
    var configuration = getOrCreateSceneLayoutConfiguration();
    configuration.editMode = $(this).val() == "On";
    sceneLayoutConfigurationReplicant.value = configuration;
});

$saveConfigurationButton.click(function() {
    nodecg.sendMessage("savePositionConfiguration");
});

$revertToDefaultButton.click(function() {
    nodecg.sendMessage("revertToDefault");
});

function createSceneLayoutConfiguration() {
    var configuration = {};
    configuration.backgroundTransparency = false;
    configuration.editMode = false;
    return configuration;
}

function getOrCreateSceneLayoutConfiguration() {
    var configuration = sceneLayoutConfigurationReplicant.value;
    if(typeof configuration !== 'undefined') {
        return configuration;
    }
    else {
        return createSceneLayoutConfiguration();
    }
}
