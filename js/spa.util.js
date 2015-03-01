/*
spa.util.js
General Javascript utilities for spa
*/

/*jslint  browser: true, continue: true,
  devel  : true, indent : 2,      maxerr      : 50,
  newcap : true, nomen  : true, plusplus      : true,
  regexp : true, sloppy : true, vars          : true,
  white  : true,
*/

/*global $, spa*/

spa.util = (function() {
	var makeError, setConfigMap;

	//Being public constructor /makeError/
	//A wrapper to create an error object
	makeError = function(name_text, msg_text, data){
		var error = new Error();
		error.name=name_text;
		error.message=msg_text;
		if(data){error.data=data;}
		return error;
	};
	//End public constructor makeError

	//Begin Public method /setConfigMap/
	//Purpose : Common code to set configs in feature module

	setConfigMap = function(arg_map){
		var
		 input_map = arg_map.input_map,
		 settable_map = arg_map.settable_map,
		 config_map = arg_map.config_map,
		 key_name, error;

		 for( key_name in input_map){
		 	if(input_map.hasOwnProperty(key_name)){
		 		if(settable_map.hasOwnProperty(key_name)){
		 			config_map[key_name] = input_map[key_name];
		 		}
		 		else{
		 			error = makeError('Bad Input', 'Setting config key|'+key_name+'| is not supported');
		 			throw error;
		 		}
		 	}
		 }
	};
	//End Public Method /setConfigMap/

	return {
		makeError : makeError,
		setConfigMap : setConfigMap
	};

}());