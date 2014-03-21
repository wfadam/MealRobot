// ==UserScript==
// @name       MealsInOneClick
// @namespace  http://sdss-te/
// @version    0.92
// @description  Order meals in one click
// @include      http://cvppasip01/SPAS/*
// @copyright  2013+, You
// ==/UserScript==

//------------ This is a copy-paste section [BEGIN]
/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path], domain)
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/
var docCookies = {
    getItem: function (sKey) {
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    
    
    removeItem: function (sKey, sPath, sDomain) {
        if (!sKey || !this.hasItem(sKey)) { return false; }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
        return true;
    },
    hasItem: function (sKey) {
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: /* optional method: you can safely remove it! */ function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
        return aKeys;
    }
};
//------------ This is a copy-paste section [END]

var MEAL_CODE_DEFAULT = 1;
var MEAL_NAME_DEFAULT = 2;
var TIME_OUT = 1000 + Math.random()*700;
var STEP_COUNT = 3;
var TRY_COUNT = 3;

var tt;
var step = 'step';
var lastVS = 'lastVS';
var kickOff = 'kickOff';
var tryOut = 'tryOut';

function shortViewState(){
    var vs = document.getElementById("__VIEWSTATE").value;
    return vs.substr(vs.length-16, vs.length);    
}

function nextWorkDay() {
    var datePool = document.getElementById('cmbTheDate');
    var hotDate = nextDate();
    
    if ( hotDate >= datePool.length ) {
    	return hotDate;   
    }
    
    var workDay = (new Date(datePool[hotDate].value)).getDay();
    switch( workDay ) {
        case 6://Sat
            return hotDate+2;
            break;
        case 0://Sun
            return hotDate+1;
            break;
        default:
            return hotDate;
            break;
    }

}

function nextDate() {

    return document.getElementById('cmbTheDate').selectedIndex + 1;
}

function theDate() {
    
    return document.getElementById('cmbTheDate').selectedIndex;
}

function makeRoom(){
    
    tb = document.getElementsByTagName("table")[0];
    tb.style.top = "120px";
    
}

function placeOrderBtn(isEnabled) {
    
    makeRoom();
    
    fm1 = document.getElementById("Form1");
    
    // the start button
    orderBtn = document.createElement('button');
    
    orderBtn.style.top = "80px";
    orderBtn.style.left = "16px";
    orderBtn.style.width = "700px";
    orderBtn.style.height = "32px";
    orderBtn.style.position = "absolute";
    orderBtn.onclick = j;
    orderBtn.disabled = ! isEnabled;
    if( isEnabled ) {
        orderBtn.innerHTML = "一 键 订 餐";
    }
    else{
        orderBtn.innerHTML = "努力订餐中...";
        
    }
    
    fm1.appendChild(orderBtn);
}

function placeCancelBtn() {
    makeRoom();
    
    fm1 = document.getElementById("Form1");
    
    // the cancel button
    cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = "重 置";
    cancelBtn.style.top = "80px";
    cancelBtn.style.left = "720px";
    cancelBtn.style.width = "335px";
    cancelBtn.style.height = "32px";
    cancelBtn.style.position = "absolute";
    cancelBtn.onclick = stopSaying;
    fm1.appendChild(cancelBtn);
}


function stopSaying() {
    if (typeof tt === 'number') {
        clearTimeout(tt);
    }
    
    placeOrderBtn(true);
    resetVars();
    return false;
}

function nextStep(){
    docCookies.setItem(step, parseInt(docCookies.getItem(step))+1);
}

function clickSubmit(){
    document.getElementById('cmdSubmit').click();
    console.log(" [ click done ] ");
}

function selectDate(dt) {
    
    if ( dt < document.getElementById('cmbTheDate').length ) {
        docCookies.setItem(tryOut, TRY_COUNT);
        console.log("meal DATE idx = " + dt);
        document.getElementById('cmbTheDate').selectedIndex = dt;
        clickSubmit();
    }
    else{
        clearTimeout(tt);
        placeOrderBtn(true);
        resetVars();
        alert("妈妈再也不用担心你饿肚子啦~~~！");
    }
    
}


function selectTime() {
    
    docCookies.setItem(tryOut, TRY_COUNT);
    console.log("meal TIME is set");
    document.getElementById('cmbMealCode').selectedIndex = MEAL_CODE_DEFAULT;
    clickSubmit();
    
}


function selectDish() {
    
    docCookies.setItem(tryOut, TRY_COUNT);
    console.log("meal NAME is set");
    document.getElementById('cmbMealName').selectedIndex = MEAL_NAME_DEFAULT;
    clickSubmit();
    
}


function resetVars(){
    docCookies.setItem(lastVS, shortViewState());
    console.log( "lastVS is reset to " + docCookies.getItem( lastVS ));  
    
    docCookies.setItem(step, 0);
    console.log( "step is reset to " + docCookies.getItem( step )); 
    
    docCookies.setItem(tryOut, TRY_COUNT);
    console.log( "tryOut is reset to " + docCookies.getItem( tryOut )); 
    
    if( docCookies.hasItem(kickOff) ) {
        docCookies.removeItem(kickOff);
    }
}

function j() {
    docCookies.setItem(kickOff, 1);
    docCookies.setItem(step, 1);
    if( confirm("确定要一次订完？") ){
        roll();
    }
    
    return false;
}

function roll() {
    tt = setTimeout( roll, TIME_OUT );
    
    if( parseInt(docCookies.getItem(tryOut)) === 0 ) {
        docCookies.setItem(tryOut, 4);
        docCookies.setItem(lastVS, "balabala");
        console.log( " Looks like you've reserved meal for " + theDate());
    }
    
    
    placeOrderBtn(false);
    placeCancelBtn();
    
    console.log(" >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> head");
    console.log( "step = " + parseInt(docCookies.getItem(step)));
    console.log( "  date = " + theDate());     
    console.log( "    lastVS = " + docCookies.getItem(lastVS));
    
    if(parseInt(docCookies.getItem(step)) === 1 ) { 
        docCookies.setItem(lastVS, shortViewState());
        console.log( "      currVS = " + shortViewState());
        selectTime();
        nextStep();
    }
    else if ( docCookies.getItem(lastVS) !== shortViewState() ){
        docCookies.setItem(lastVS, shortViewState());
        console.log( "      currVS 2= " + shortViewState());
        
        switch( parseInt(docCookies.getItem(step)) % STEP_COUNT ) {
            case 0:
                selectDate( nextWorkDay() );
                nextStep();
                break;
            case 1:
                selectTime();
                nextStep();
                break;
            case 2:
                selectDish();
                nextStep();
                break;            
        }
    }
        else{
            console.log("      left try count = " + docCookies.getItem(tryOut));
            docCookies.setItem(tryOut, parseInt(docCookies.getItem(tryOut)) - 1);
        }
}

if ( window.document.location.href.indexOf("Meal.aspx") > -1 ) {
    console.log("\n\n");
    console.log(">>" + window.document.location.href);
    
    placeOrderBtn(true);
    placeCancelBtn();
    
    if( docCookies.hasItem(kickOff) ) {
        roll();
    }
    else{
        resetVars();    
    }
    
}





