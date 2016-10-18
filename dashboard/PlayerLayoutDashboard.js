'use strict';
$(function () {
// Replicant initialization
    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (newValue, oldValue) {
        if (typeof newValue !== 'undefined' && newValue != '') {
            var names = new Array();
           playerLayout_UpdateLayoutPanelWithTeams(newValue.teams);

        }
    });

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
