define(['./settings'],function (settings) {
	//Do setup work here
	var _registeredInputs = [];

    var _setInputs = function( inputs ){
    	// Register Inputs
    	for (var i = 0; i < inputs.length; i++) {
    	  var thisInput = inputs[i];
    	  if ((thisInput.id != "" && $(thisInput.id).length) && settings.input[thisInput.type] !== undefined) 
    	  	_registeredInputs.push({
	    	    type: thisInput.type,
	    	    conf: bt.inputTypes[thisInput.type],
	    	    jobj: $(thisInput.id)
	    	});
    	}

    	return _registeredInputs;
    }

	return {
		setInputs : _setInputs
	}
});