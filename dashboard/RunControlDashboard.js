
var lastItemSize = 0;
var blankSlateContainerHtml = $('#run-control-container').html();
// Initialize replicants we will use
var runDataArrayReplicant = nodecg.Replicant("runDataArray");
runDataArrayReplicant.on("change", function (oldValue, newValue) {
    if(typeof newValue !== 'undefined') {
        updateList(newValue);
    }
    else {
        $('#runItems').html('');
    }
});

function getPlayers(runData) {
    var playerString = '<tr> <td class="rowTitle">Runners</td>';
    $.each(runData.players, function(index, player) {
        if(index == 0) {
            playerString += '<td class="rowContent">' + player.names.international + '</td>' +
                '</tr>';
        }
        else {
            playerString += '<tr><td class="rowTitle"></td><td class="rowContent">' + player.names.international + '</td>' +
                '</tr>';
        }
    });
    return playerString;
}

function getRunBodyHtml(runData) {
    var players = getPlayers(runData);
    var bodyHtml = '<table class="table-striped">'+
                       players +
                       '<tr><td class="rowTitle">Estimate</td><td class="rowContent">' + runData.estimate + '</td></tr>' +
                       '<tr><td class="rowTitle">Category</td><td class="rowContent">' + runData.category + '</td></tr>' +
                       '<tr><td class="rowTitle">System</td><td class="rowContent">' + runData.system + '</td></tr>' +
                       '<tr><td class="rowTitle">Region</td><td class="rowContent">' + runData.region + '</td></tr>' +
                   '</table>';
    return bodyHtml;

}

function updateList(runData) {
    var htmlDescriptor = '';
    var buttonRemoveIDs = [];
    var buttonChangeIDs = [];

    if(lastItemSize == runData.length) {
        return;
    }

    $.each(runData, function(index, runData) {
        var buttonRemoveIDString = 'remove'+runData.runID;
        var buttonChangeIDString = 'change'+runData.runID;
        buttonRemoveIDs.push(buttonRemoveIDString);
        buttonChangeIDs.push(buttonChangeIDString);
        htmlDescriptor += '<div class="group" id="' +runData.runID+ '">' +
                              '<h3>' +runData.game+ ' (' +runData.category+ ')' +
                              '</h3>' +
                              '<div>' +
                                  getRunBodyHtml(runData) +
                                  '<button class="removeButton" id="'+buttonRemoveIDString+'"></button>' +
                                  '<button class="changeButton" id="'+buttonChangeIDString+'"></button>' +
                              '</div>' +
                          '</div>';
    });

    $('#run-control-container').html(blankSlateContainerHtml);
    $('#runItems').html(htmlDescriptor);

    $.each(buttonRemoveIDs, function(index, buttonID) {
        $('#'+buttonID).click(function() {
            var r = confirm("Do you really want to remove this run?");
            if(r) {
                removeRun(index);
            }
        });

        $('#'+buttonID).button({
            icons: {
                primary: "ui-icon-closethick"
            },
            text: false
        })
    });

    $.each(buttonChangeIDs, function(index, buttonID) {
        $('#'+buttonID).click(function() {
            var r = confirm("Edit not supported at this time");
            if(r) {
            }
        });

        $('#'+buttonID).button({
            icons: {
                primary: "ui-icon-pencil"
            },
            text: false
        })
    });

    $('#runItems')
        .accordion({
            header: "> div > h3",
            collapsible: true,
            active: false,
            heightStyle: "content"
        })
        .sortable({
            axis: "y",
            handle: "h3",
            stop: function( event, ui ) {
                // IE doesn't register the blur when sorting
                // so trigger focusout handlers to remove .ui-state-focus
                var sortedIDs = $('#runItems').sortable( "toArray" );
                var runContainer = runDataArrayReplicant.value;
                var newRunDataArray = [];
                $.each(sortedIDs, function(index, valueId) {
                    $.each(runContainer, function(index, valueRunData) {
                        if(valueRunData.runID == valueId) {
                            newRunDataArray.push(valueRunData);
                            return false;
                        }
                    });
                });
                runDataArrayReplicant.value = newRunDataArray;
                // Refresh accordion to handle new order
                $( this ).accordion( "refresh" );
            }
        });
    lastItemSize = runData.length;
}

function removeRun(ID) {
    var runContainer = runDataArrayReplicant.value;
    runContainer.splice(ID,1);
    runDataArrayReplicant.value = runContainer;
}
