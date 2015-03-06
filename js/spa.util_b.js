/*
*spa.util_b.js
*JavaScript browser utilities
*/


/*jslint  browser: true, continue: true,
  devel  : true, indent : 2,      maxerr      : 50,
  newcap : true, nomen  : true, plusplus      : true,
  regexp : true, sloppy : true, vars          : true,
  white  : true,
*/

/*global $, spa, getComputedStyle*/

spa.util_b=(function() {
    'use strict';
    //-------------------------Begin Module Scope Variables-------------------------
    var 
    configMap = {
    	regex_encode_html : /[&"'><]/g,
    	regex_encode_noamp : /["'><]/g,
    	html_enconde_map : {
    		'&' : '&#38;',
    		'"' : '&#34;',
    		"'" : '&#39;',
    		'>' : '&#62;',
    		'<' : '&#60;'
    	}
    },
    decodeHtml, encodeHtml, getEmSize;

    configMap.encode_noamp_map = $.extend(
    	{}, configMap.html_enconde_map
    	);

    delete configMap.encode_noamp_map['&'];
    //------------------------End Module Scope Variables----------------------------

    //------------------------Begin Utility Methods---------------------------------
    //Begin decodeHtml
    //Decodes html entities in a browser-friendly way
    //See http://stackoverflow.com/questions/1912501/\unescape-html-entities-in-javascript

    decodeHtml = function(str){
    	return $('<div/>').html(str || '').text();
    };
    //End decodeHtml

    //Begin encodeHtml
    //This is single pass encoder for html entities and handles an arbitrary number of characters

    encodeHtml = function(input_arg_str, exclude_amp){
    	var
    	input_str = String(input_arg_str),
    	regex, lookup_map;

    	if(exclude_amp){
    		lookup_map = configMap.encode_noamp_map;
    		regex = configMap.regex_encode_noamp;
    	}
    	else{
    		lookup_map = configMap.html_enconde_map;
    		regex = configMap.regex_encode_html;
    	}

    	return input_str.replace(regex,
    		function(match, name){
    			return lookup_map[match] || '';
    		});
    };
    //End encodeHtml

    //Begin getEmSize
    getEmSize = function(elem){
    	return Number(
    		getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]
    		);
    };
    //End getEmSize

    //------------------------End Utility Methods---------------------------------
	return {
		decodeHtml : decodeHtml,
		encodeHtml : encodeHtml,
		getEmSize : getEmSize
	};
}());