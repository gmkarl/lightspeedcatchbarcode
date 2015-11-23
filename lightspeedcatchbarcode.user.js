// ==UserScript==
// @name         Lightspeed Register Barcode Catcher
// @namespace    https://github.com/gmkarl/lightspeedcatchbarcode/
// @version      0.1.8
// @description  Handles barcodes entered into the wrong place in the Lightspeed Register.
// @author       Karl Semich
// @match        https://*.merchantos.com/register.php*
// @grant        unsafeWindow
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
            if (evt.target == initialTarget && initialValue) {
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
    return true;
    
}, unsafeWindow, {cloneFunctions:true});

unsafeWindow.onclick = cloneInto(function(evt) {

    lastKeys = [];
    return true;

}, unsafeWindow, {cloneFunctions:true});

})();
