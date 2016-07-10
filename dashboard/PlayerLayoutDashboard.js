'use strict';
$(function () {
// Replicant initialization
    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    // runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
    //     if (typeof newValue !== 'undefined' && newValue != '') {
    //         playerLayout_UpdateLayoutPanel(newValue);
    //     }
    // });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
        if (typeof newValue !== 'undefined' && newValue != '') {
            var names = new Array();
            if( newValue.teams.length > 1 ) {
                playerLayout_UpdateLayoutPanelWithTeams(newValue.teams);
            }
            else {
                playerLayout_UpdateLayoutPanelWithRunners(newValue.players, names);
            }
        }
    });

    function playerLayout_UpdateLayoutPanelWithRunners(runners) {
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

    function playerLayout_UpdateLayoutPanelWithTeams(runners) {
        var playersSortableHTML = '' +
            '<ul id="playerLayoutSortable">' +
            playerLayout_CreateTeamListHtmlElements(runners) +
            '</ul>';
        $('#playerLayoutContainer').html(playersSortableHTML);
        $("#playerLayoutSortable").sortable({
            stop: function (event, ui) {
                // IE doesn't register the blur when sorting
                // so trigger focusout handlers to remove .ui-state-focus
                var sortedIDs = $('#playerLayoutSortable').sortable("toArray");
                var oldTeamArray = runDataActiveRunReplicant.value.teams;
                var newTeamArray = [];
                $.each(sortedIDs, function (index, valueId) {
                    $.each(oldTeamArray, function (index, team) {
                        if (team.name == valueId) {
                            newTeamArray.push(team);
                            return false;
                        }
                    });
                });
                runDataActiveRunReplicant.value.teams = newTeamArray;
            }
        });

        $("#playerLayoutSortable").disableSelection();
    }

    function playerLayout_CreateTeamListHtmlElements(teamArray) {
        var runnerHtml = '';
        $.each(teamArray, function (index, value) {
            runnerHtml += '<li class="ui-state-default" id="' + value.name + '">' + value.name + '</li>';
        });
        return runnerHtml;
    }

})
