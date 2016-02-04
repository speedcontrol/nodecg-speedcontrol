'use strict';
$(function () {
// Replicant initialization
    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
        if (typeof newValue !== 'undefined' && newValue != '') {
            playerLayout_UpdateLayoutPanel(newValue);
        }
    });

    function playerLayout_UpdateLayoutPanel(runners) {
        var playersSortableHTML = '' +
            '<ul id="playerLayoutSortable">' +
            playerLayout_CreatePlayerListHtmlElements(runners) +
            '</ul>';
        $('#playerLayoutContainer').html(playersSortableHTML);
        $("#playerLayoutSortable").sortable({
            stop: function (event, ui) {
                // IE doesn't register the blur when sorting
                // so trigger focusout handlers to remove .ui-state-focus
                var sortedIDs = $('#playerLayoutSortable').sortable("toArray");
                var runnersContainer = runDataActiveRunRunnerListReplicant.value;
                var newRunnerDataArray = [];
                $.each(sortedIDs, function (index, valueId) {
                    $.each(runnersContainer, function (index, valueRunnerData) {
                        if (valueRunnerData.names.international == valueId) {
                            newRunnerDataArray.push(valueRunnerData);
                            return false;
                        }
                    });
                });
                runDataActiveRunRunnerListReplicant.value = newRunnerDataArray;
            }
        });

        $("#playerLayoutSortable").disableSelection();
    }

    function playerLayout_CreatePlayerListHtmlElements(runnerArray) {
        var runnerHtml = '';
        $.each(runnerArray, function (index, value) {
            runnerHtml += '<li class="ui-state-default" id="' + value.names.international + '">' + value.names.international + '</li>';
        });
        return runnerHtml;
    }
})
