define(['./settings','boot/register'],function (settings,register) {
    //Do setup work here

    var el = [1,2,3,4];

    var _getElementByIndex = function(i){
    	console.log(i);
    	return el[i];
    }

    var _setTitle = function(title) {

	    var _title = (title !== void 0) ? title : "Require 2: "+_getElementByIndex(1) ;
  		window.title = title;
	}

    return {
        getElementByIndex : _getElementByIndex,
        setTitle : _setTitle

    }
});