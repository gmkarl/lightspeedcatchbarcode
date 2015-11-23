// ==UserScript==
// @name         Lightspeed Register Barcode Catcher
// @namespace    https://github.com/gmkarl/lightspeedcatchbarcode/
// @version      0.2.1
// @description  Handles barcodes entered into the wrong place in the Lightspeed Register.
// @author       Karl Semich
// @match        https://*.merchantos.com/register.php*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function(){
'use strict';

var lastKeys = [];
var initialTarget;
var initialValue;

function isNumeric(evt) {
    return evt.keyCode >= 48 && evt.keyCode <= 57;
}

function isEnter(evt) {
    return evt.keyCode == 13;
}

function toNumeric(evt) {
    return evt.keyCode - 48;
}

function isWrongTarget(evt) {
    var element = unsafeWindow.singleElementById('add_search_item_text');
    return element && evt.target && evt.target != element;
}

function isEAN(digitArray) {
    var sum = 0;
    for (var i = 0; i < digitArray.length; ++i) {
        if ((digitArray.length-i)%2)
            sum += digitArray[i];
        else
            sum += digitArray[i] * 3;
    }
    return sum % 10 == 0;
}

function isUPCE(d) {
    if (d.length != 8)
        return false;
    if (d[0] != 0 && d[0] != 1)
        return false;

    var n;
    if (d[6] < 3)
        n = [d[0],d[1],d[2],d[6],0,   0,   0,0,d[3],d[4],d[5],d[7]];
    else if (d[6] == 3)
        n = [d[0],d[1],d[2],d[3],0,   0,   0,0,0,   d[4],d[5],d[7]];
    else if (d[6] == 4)
        n = [d[0],d[1],d[2],d[3],d[4],0,   0,0,0,   0,   d[5],d[7]];
    else if (d[6] > 4)
        n = [d[0],d[1],d[2],d[3],d[4],d[5],0,0,0,   0,   d[6],d[7]];

    if (isEAN(n)) {
        //lastKeys = n;
        return true;
    } else {
        return false;
    }
}

function isBarcode(digitArray) {
    return isUPCE(digitArray) || ((digitArray.length == 8 || digitArray.length == 12 || digitArray.length == 13) && isEAN(digitArray));
}

function doItemSearch(string) {
    window.eval(
        "var element = singleElementById('add_search_item_text');" +
        "element.value = '" + string + "';" +
        "merchantos.register.addItemSearch(element);"
    );
}

unsafeWindow.onkeydown = cloneInto(function(evt) {

    try {
        if (isNumeric(evt)) {
    
            if (lastKeys.length == 0) {
                initialTarget = evt.target;
                initialValue = initialTarget.value;
            }
    
            lastKeys.push(toNumeric(evt));
            return true;
        }
        
        if (isEnter(evt) && isWrongTarget(evt)) {
            if (isBarcode(lastKeys)) {
                console.log("Barcode entered into wrong field.");
                if (evt.target == initialTarget && initialValue !== undefined ) {
                    console.log("Returning field to original value of '" + initialValue + "'");
                    initialTarget.value = initialValue;
                }
                var barcode = lastKeys.join("");
                console.log("Performing itemsearch for " + barcode);
                doItemSearch(barcode);
                lastKeys = [];
                return false;
            }
        }

        lastKeys = [];
    } catch(e) {
        reportExceptionAsIssue(e, "onkeydown");
    }
    return true;
    
}, unsafeWindow, {cloneFunctions:true});

unsafeWindow.onclick = cloneInto(function(evt) {

    try {
        lastKeys = [];
    } catch(e) {
        reportExceptionAsIssue(e, "onclick");
    }
    return true;

}, unsafeWindow, {cloneFunctions:true});

// Submit a github issue about a thrown exception
var reportExceptionAsIssueRequest;
//var eventLog = [];
function reportExceptionAsIssue(error, label) {
    try {
        var issueTitle = label + ": " + error.toString();
        var issueStackTrace = error.stack;
        //var issueEventLog = eventLog.join("\n")
        //    .replace(/<select name=\\?"employee_id\\?"[^]*?<\/select>/g, "<!-- censored employee id -->");
        console.log(issueTitle);
        console.log("Stack trace:");
        console.log(issueStackTrace);
        //console.log("Event log:");
        //console.log(issueEventLog);
        try {
            if (document.getElementById("session_shop").innerHTML == "Test Store")
                return;
        } catch(e) {}
        reportExceptionAsIssueRequest = GM_xmlhttpRequest({
            url: "https://api.github.com/repos/gmkarl/lightspeedcatchbarcode/issues",
            method: "POST",
            headers: {
                "User-Agent": "lightspeedcatchbarcode",
                Accept: "application/vnd.github.v3+json",
                Authorization: "token be8980229117ea4298" + "497dc0f7f4af73ac24f040",
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                title: issueTitle,
                body: "Stack trace:\n```\n" + issueStackTrace + "\n```" //+ "\nEvent log:\n```\n" + issueEventLog + "\n```"
            }),
        });
    } catch(e) {
        console.log("exception in exception handler");
        console.log(e.toString());
        console.log(e.stack);
    }
}

})();
