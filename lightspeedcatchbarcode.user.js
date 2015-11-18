// ==UserScript==
// @name         Lightspeed Register Barcode Catcher
// @namespace    https://github.com/gmkarl/lightspeedcatchbarcode/
// @version      0.1
// @description  Handles barcodes entered into the wrong place in the Lightspeed Register.
// @author       Karl Semich
// @match        https://*.merchantos.com/register.php*
// ==/UserScript==

(function(){
'use strict';

var lastKeys = [];

function isNumeric(var evt) {
    return evt.charCode >= 48 && evt.charCode <= 57;
}

function isEnter(var evt) {
    return evt.keyCode == 13;
}

function toNumeric(var evt) {
    return evt.charCode - 48;
}

function isWrongTarget(evt) {
    var element = unsafeWindow.singleElementById('add_search_item_text');
    return element && evt.target && evt.target != element;
}

function isEAN(var digitArray) {
    var sum = 0;
    for (var i = 0; i < digitArray.length; ++i) {
        if ((digitArray.length-i)%2)
            sum += digitArray[i];
        else
            sum += digitArray[i];
    }
    return sum % 10 == 0;
}

function isBarcode(var digitArray) {
    return (digitArray.length == 8 || digitArray.length == 12 || digitArray.length == 13) && isEAN(digitArray);
}

function doItemSearch(var string) {
    window.eval(
        "var element = singleElementById('add_search_item_text');" +
        "element.value = '" + string + "';" +
        "merchantos.register.addItemSearch(element);"
    );
}

unsafeWindow.onkeypress = cloneInto(function(evt) {

    if (isNumeric(evt)) {
        lastKeys.push(toNumeric(evt));
        return true;
    }
    
    if (isEnter(evt) && isWrongTarget(evt)) {
        if (isBarcode(lastKeys)) {
            doItemSearch(lastKeys.join(""));
            lastKeys = [];
            return false;
        }
    }

    lastKeys = [];
    return true;
    
}, unsafeWindow, {cloneFunctions:true});

})();
