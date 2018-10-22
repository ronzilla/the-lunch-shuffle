/**
 * Created by rtheis on 3/3/2016.
 */

var allUsersHash = new Map();
var currentFileText = "";
var groupAr = [];
var nextFileString = "";
var userNeedingAssignmentHash = new Map();
var userParameterNameAr = [];
var userParameterNamesToValuesHash = new Map();
var userToAssignedGroupHash = new Map();

function openFile(event) {
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function() {
        // Stash the file as a string
        currentFileText = reader.result;
    };
    reader.readAsText(input.files[0]);
};

function startShuffle() {
    // Actually shuffle

    var outputNode = document.getElementById('output');
    var statsNode = document.getElementById('stats');

    var fileString = currentFileText;
    fileString = fileString.replace(/\r\n/g, "\n");
    fileString = fileString.replace(/\r/g, "\n");

    var lineAr = fileString.split("\n");

    var headerLine = lineAr[0];
    headerLine = headerLine.replace(/#.*$/, "");        // Strip anything from # to the end
    headerLine = headerLine.replace(/\s*$/, "");        // remove whitespace from the end of the line
    var headerAr = headerLine.split("\t");              // headers
    userParameterNameAr = headerAr.slice(3);
    assignValuesForParameterNames();

    // Create the users
    createUsersToAssign(lineAr);

    // Figure out how many groups, people per group, and slightly-larger groups
    var userCount = userNeedingAssignmentHash.size;
    var peoplePerGroup = 0;
    var groupCount = 0;
    if (document.getElementById("peoplePerGroup").value > 0) {
        peoplePerGroup = parseInt(document.getElementById('peoplePerGroup').value);
        groupCount = Math.floor(userCount / peoplePerGroup);
    } else {
        groupCount = parseInt(document.getElementById('numberOfGroups').value);
        peoplePerGroup = Math.floor(userCount / groupCount);
    }
    var extraSizeCount = userCount - (peoplePerGroup * groupCount);     // How many groups will need 1 extra person?

    statsNode.innerText = "";
    statsNode.innerText += "People found in file: " + userCount + "\n";
    statsNode.innerText += "People per group: " + peoplePerGroup + "\n";
    statsNode.innerText += "Number of groups: " + groupCount + "\n";
    statsNode.innerText += "Groups with an extra person: " + extraSizeCount + "\n";

    // Create the groups
    createGroups(groupCount, peoplePerGroup, extraSizeCount);

    // Assign the users into groups
    var totalPoints = assignUsersToGroups();

    // Output the results to the page
    var outputString = getResultsString();
    outputNode.innerText = "";
    outputNode.innerText += "Total mismatch points (want to minimize this; click Shuffle to try again): " + totalPoints + "\n\n";
    outputNode.innerText += outputString;

    // Prepare the downloadable file for next time.
    nextFileString = getNextFileString(lineAr);
}

function assignUsersToGroups() {

    var totalPoints = 0;

    // Walk through each user, assigning to groups
    var userCount = userNeedingAssignmentHash.size;
    for (var onPartIdx = 0; onPartIdx < userCount; ++onPartIdx) {
        var randomNumber = Math.floor(userNeedingAssignmentHash.size * Math.random());

        // Walk through the hash keys iterator a random amount, until we get our target user.
        var iterator = userNeedingAssignmentHash.keys();
        for (var onRunThroughIdx = 0; onRunThroughIdx < randomNumber; ++onRunThroughIdx ) {
            iterator.next();
        }

        var userToMatchKey = iterator.next();
        var userToMatch = userNeedingAssignmentHash.get(userToMatchKey.value);

        // Figure out the best group for the user.
        var lowestGroup = null;
        var lowestGroupPoints = 999999;

        for (var onGroupIdx = 0; onGroupIdx < groupAr.length; ++onGroupIdx) {
            var group = groupAr[onGroupIdx];

            var groupUserPoints = getPointsForUser(group, userToMatch);
            if (groupUserPoints < lowestGroupPoints) {
                lowestGroup = group;
                lowestGroupPoints = groupUserPoints;
            }
            // Actually: let more-negative results be better, so if two people are in the same group on purpose
            //if (groupUserPoints == -1) {            // It's empty, just add our user.
            //    break;
            //}
        }

        // Add the user to the group.
        totalPoints += lowestGroupPoints;
        lowestGroup.userList.push(userToMatch);

        // Remove the user from the remaining participants.
        userNeedingAssignmentHash.delete(userToMatchKey.value);
        userToAssignedGroupHash.set(userToMatchKey.value, lowestGroup.groupNumber);
    }

    return totalPoints;
}

function createGroups(groupCount, peoplePerGroup, extraSizeCount) {

    groupAr = [];

    // Create the list of groups, named & sized.
    for (var onGroupNum = 1; onGroupNum <= groupCount; ++onGroupNum) {
        var groupSize = peoplePerGroup;
        if (onGroupNum <= extraSizeCount) {
            groupSize++;
        }

        var group = {
            name: "Group " + onGroupNum.toString(),
            groupNumber: onGroupNum.toString(),
            targetSize: groupSize,
            userList: []
        };
        groupAr.push(group);
    }
}

function createUsersToAssign(lineAr) {

    // Make sure these are empty
    allUsersHash.clear();
    userNeedingAssignmentHash.clear();

    // Walk through each line, creating users as we go. Start at line 1; line 0 is the header.
    for (var onLineIdx = 1; onLineIdx < lineAr.length; ++onLineIdx) {
        var line = lineAr[onLineIdx];
        line = line.replace(/#.*$/, "");                // Strip anything from # to the end
        line = line.trim();
        var userFields = line.split("\t");

        // If we've got enough fields, create a user
        if (userFields.length >= 3) {
            var user = {
                firstName: userFields[0],
                lastName: userFields[1],
                email: userFields[2],
                parameters: userFields.slice(3)            // All the fields after email
            };

            allUsersHash.set(userFields[2], user);
            userNeedingAssignmentHash.set(userFields[2], user);
        }
    }
}

function getPointsForUser(group, user) {
    // Return the points for a user in a given group

    if (group.userList.length >= group.targetSize) {
        return 999999;           // Group is full, won't work.
    } else if (group.userList.length == 0) {
        return -1;               // Group is empty, add away.
    }

    var points = 0;

    // walk through each user in the group, adding on points
    for (var onGroupUserIdx = 0; onGroupUserIdx < group.userList.length; ++onGroupUserIdx) {
        var groupUser = group.userList[onGroupUserIdx];

        // Walk through each parameter, adding points for each match.
        for (var onParameterIdx = 0; onParameterIdx < userParameterNameAr.length; ++onParameterIdx) {
            if (onParameterIdx >= user.parameters.length) {
                break;          // This user doesn't have all the parameters that others might, so stop processing.
            }

            // If this user's parameter wasn't blank, and if it matches the groupUser's parameter, they get (bad) points.
            if ((user.parameters[onParameterIdx].length > 0) && (user.parameters[onParameterIdx] == groupUser.parameters[onParameterIdx])) {
                var userParameterName = userParameterNameAr[onParameterIdx];
                var parameterValue = userParameterNamesToValuesHash.get(userParameterName);
                points += parameterValue;
            }
        }
    }

    return points;
}

function assignValuesForParameterNames() {
    // Given an array of user parameter names, assign values to them.

    for (var onParameterIdx = 0; onParameterIdx < userParameterNameAr.length; ++onParameterIdx) {
        var userParameterName = userParameterNameAr[onParameterIdx];
        userParameterName = userParameterName.trim();
        if (userParameterName.length == 0) {            // Empty means blank column
            userParameterNamesToValuesHash.set(userParameterName, 0);
            continue;
        }

        // Look for the points per user in the name of the parameter.
        var pointsForParameter = 5;
        var matched = userParameterName.match(/.*\((\-?\d+)\).*/);
        console.log("assignValuesForParameterNames: " + userParameterName + ": " + matched);
        if (matched) {
            pointsForParameter = parseInt(matched[1]);
        }

        // For each of the user parameters, how many points should we apply?
        userParameterNamesToValuesHash.set(userParameterName, pointsForParameter);
    }
}

function getResultsString() {
    // Output our matchups to the resultsNode DIV

    var output = "";
    for (var onGroupIdx = 0; onGroupIdx < groupAr.length; ++onGroupIdx) {
        var group = groupAr[onGroupIdx];

        output += group.name + ": \n";

        for (var onUserIdx = 0; onUserIdx < group.userList.length; ++onUserIdx) {
            var user = group.userList[onUserIdx];
            output += user.email + "\n";
        }

        output += "\n\n";
    }

    return output;
}

function getNextFileString(lineAr) {
    // Get a file representing our current values and our newly-assigned groups

    var fileString = "";

    // Create a file for next time
    var headerLine = lineAr[0];
    var dateString = getDateString();

    headerLine += "\tGroup_" + dateString + " (100)";

    fileString += headerLine + "\n";

    // Now go through the rest of the lines,
    for (var onLineIdx = 1; onLineIdx < lineAr.length; ++onLineIdx) {
        var line = lineAr[onLineIdx];
        line = line.replace(/#.*$/, "");                // Strip anything from # to the end
        line = line.trim();
        var userFields = line.split("\t");

        // If we've got enough fields, grab the user
        if (userFields.length >= 3) {
            var email = userFields[2];
            var user = allUsersHash.get(email);
            var outLine = "";

            if (user == null) {
                return "Weird error! couldn't retrieve a new user for line " + onLineIdx;
            }

            outLine = userFields[0] + "\t" + userFields[1] + "\t" + userFields[2];

            // Walk through each header field,
            for (var onParamIdx = 0; onParamIdx < userParameterNameAr.length; ++onParamIdx) {
                var userField = user.parameters[onParamIdx];
                if (userField == null) {
                    outLine += "\t";
                } else {
                    outLine += "\t" + userField;
                }
            }

            // The new group
            outLine += "\t" + userToAssignedGroupHash.get(user.email);

            fileString += outLine + "\n";
        } else {
            // Less than 3 fields...could be commented out, or a blank line. Just add back whatever was there originally.
            fileString += lineAr[onLineIdx] + "\n";
        }
    }

    return fileString;
}

function startDownload() {
    // Start the file download for the next shuffle
    var dateString = getDateString();
    var fileName = "shuffled_" + dateString + ".txt";

    download(fileName, nextFileString);
}

function download(filename, text) {
    // http://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    } else {
        pom.click();
    }
}

function getDateString() {
    // Return a YYYY_MM_DD string

    var today = new Date();
    var month = today.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var dayOfMonth = today.getDate();
    if (dayOfMonth < 10) {
        dayOfMonth = "0" + dayOfMonth;
    }

    return today.getFullYear() + "_" + month + "_" + dayOfMonth;
}