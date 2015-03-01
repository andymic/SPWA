/*
spa.shell.js
Shell module for spa
*/

/*jslint  browser: true, continue: true,
  devel  : true, indent : 2,      maxerr      : 50,
  newcap : true, nomen  : true, plusplus      : true,
  regexp : true, sloppy : true, vars          : true,
  white  : true,
*/

/*global $, spa*/

spa.shell=(function () {
	//-----------------Begin Module Scope Variables------------
	var 
	configMap={
		anchor_schema : {
			chat : { opened : true, closed : true}
		},
		main_html : String()
			+'<div class="spa-shell-head">'
		+'	<div class="spa-shell-head-logo"></div>'
		+'	<div class="spa-shell-head-acc"></div>'
		+'	<div class="spa-shell-head-search"></div>'
		+'</div>'
		+'<div class="spa-shell-main">'
		+'	<div class="spa-shell-main-nav"></div>'
		+'	<div class="spa-shell-main-content"></div>'
		+'</div>'
		+'<div class="spa-shell-foot"></div>'
		+'<div class="spa-shell-modal"></div>',

		chat_extend_time : 300,
		chat_retract_time : 300,
		chat_extend_height : 450,
		chat_retract_height : 15,
		chat_retracted_title : 'Click to retract',
		chat_extended_title : 'Click to extend',
		resize_interval : 200
	},
	stateMap={
		$container : undefined,
		anchor_map : {},
		resize_idto : undefined
	},
	jqueryMap={},
	copyAnchorMap, changeAnchorPart, onHashChange, setChatAnchor, setJqueryMap, toggleChat, onClickChat, onResize, initModule;
	//------------End Module Scope Variables-------------------

	//------------------Begin Utility Methods-------------------
	copyAnchorMap = function(){
		return $.extend(true, {}, stateMap.anchor_map);
	};
	//------------------End Utility Methods-------------------

	//------------------Begin DOM Methods-------------------
	//Begin DOM method /setJqueryMap/
	setJqueryMap=function(){
		var $container=stateMap.$container;
		jqueryMap={
			$container: $container,
			$chat : $container.find('.spa-shell-chat')
		};
	};

	//-----------------Begin DOM Method /toggleChat/-----------
	//Purpose  : Extends or retracts chat slider
	//Arguments :
	//*do_extend - if true, extends slider; if false retracts
	//*callback - optional function to execute at the end of animation
	//Settings :
	//  *chat_extend_time , chat_retract_time
	//  *chat_extend_height, chat_retract_height
	//Returns: boolean
	//  *true - slider animation activated
	//  *false - slider animation not activated
	//State : sets stateMap.is_chat_retracted
	//  *true - slider is retracted
	//  *false - slider is extended
	toggleChat= function(do_extend, callback){
		var
		px_chat_ht = jqueryMap.$chat.height(),
		is_open = px_chat_ht === configMap.chat_extend_height,
		is_closed = px_chat_ht === configMap.chat_retract_height,
		is_sliding = ! is_open && ! is_closed;

		//avoid race condition in case the slider is opening or closing
		if(is_sliding){ return false;}

		//Begin to extend chat slider
		if(do_extend){
			jqueryMap.$chat.animate(
			{height : configMap.chat_extend_height},
			configMap.chat_extend_time,
			function(){
				jqueryMap.$chat.attr(
					'title', configMap.chat_extended_title
					);
				stateMap.is_chat_retracted = false;
				if(callback){callback(jqueryMap.$chat);}
			}
	        );
	        return true;
		}
		//End extend chat slider

		//Begin retract chat slider
		jqueryMap.$chat.animate(
			{height : configMap.chat_retract_height},
			configMap.chat_retract_time,
			function(){
				stateMap.is_chat_retracted = true;
				if(callback){callback(jqueryMap.$chat);}
			}
	        );
		return true;
		//End retract chat slider
	};

	//-----------------End DOM Method /toggleChat/------------

	//-----------------Begin DOM Method /changeAnchorPart/
	//Purpose : Changes part of the URI anchor component
	//Arguments:
	//  *arg_map - The map describing what part of the URI anchor we want to change
	//Returns : boolean
	//  *true - the Anchor portion of the URI was updated
	//  *false - the Anchor portion of the URI could not be updated
	//Action : 
	//  The current anchor rep stored in stateMap.anchor_map.
	//  See uriAnchor for a discussion of encoding
	//  This method
	//    *Creates a copy of this map using copyAnchorMap().
	//    *Modifies the key-values using arg_map
	//     and dependent values in the encoding
	//    *Attempts to change the URI using uriAnchor
	//
	changeAnchorPart=function(arg_map){
		var anchor_map_revise = copyAnchorMap(),
		bool_return=true,
		key_name, key_name_dep;

		//Begin merge changes into anchor_map
		KEYVAL:
		for(key_name in arg_map){
			if(arg_map.hasOwnProperty(key_name)){
				//skip dependent keys during iteration
				if ( key_name.indexOf('_') === 0){continue KEYVAL;}
			

			//update independent key value
			anchor_map_revise[key_name] = arg_map[key_name];

			//update matching dependent key
			key_name_dep= '_'+key_name;
			if(arg_map[key_name_dep]){
				anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
			}
			else{
				delete anchor_map_revise[key_name_dep];
				delete anchor_map_revise['_s' + key_name_dep];
			}
		  }
	    }
	    //End merge changes into anchor map

	    //Begin attempt to update URI; revert if not successfull
	    try{
	    	$.uriAnchor.setAnchor(anchor_map_revise);
	    }
	    catch(error){
	    	//replace URI with existing state
	    	$.uriAnchor.setAnchor(stateMap.anchor_map,null, true);
	    	bool_return = false;
	    }
	    //End attempt to update URI
        
        return bool_return;
	};
	//-------------------End DOM Method /changeAnchorPart/
	//------------------End DOM Methods-------------------

	//------------------Begin Event Handlers-------------------

	//--------------------Begin Event Handler /onHashChange/-------------
	//Purpose : Handles the haschange event
	//Arguments:
	//  * event - jQuery event object
	//Settings : none
	//Returns : false
	//Action : 
	//    * Parses the URI anchor component
	//    * Compares proposed application state with current
	//    * Adjust the application only where proposed state
	//      differ from existing and is only allowed by anchor schema
	onHashChange = function(event){
		var 
		anchor_map_previous = copyAnchorMap(),
		anchor_map_proposed,
		_s_chat_previous, _s_chat_proposed,
		s_chat_proposed,
		is_ok=true;

		//attempt to parse anchor
		try{anchor_map_proposed = $.uriAnchor.makeAnchorMap();}
		catch ( error ){
			$.uriAnchor.setAnchor(anchor_map_previous, null, true);
			return false;
		}
		stateMap.anchor_map = anchor_map_proposed;

		//convenience vars
		_s_chat_previous = anchor_map_previous._s_chat;
		_s_chat_proposed = anchor_map_proposed._s_chat;

		//Begin adjust chat component if changed
		if(! anchor_map_previous || _s_chat_previous !== _s_chat_proposed){
			s_chat_proposed = anchor_map_proposed.chat;
			switch(s_chat_proposed){
				case 'opened' : 
				  is_ok=spa.chat.setSliderPosition('opened');
				break;
				case 'closed' :
				  is_ok=spa.chat.setSliderPosition('closed');
				 break;
				 default : 
				   toggleChat(false);
				   delete anchor_map_proposed.chat;
				   $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
			}
		}
		//End adjust chat component if changed


		//Begin revert anchor if slider change denied
		if(!is_ok){
			if(anchor_map_previous){
				$.uriAnchor.setAnchor(anchor_map_previous, null, true);
				stateMap.anchor_map = anchor_map_previous;
			}else{
				delete anchor_map_proposed.chat;
				$.uriAnchor.setAnchor(anchor_map_proposed, null, true);
			}
		}
		//End revert anchor if slider change denied 
		return false;
	};
	//--------------------End Event Handler /onHashChange/-------------
    
    //--------------------Begin Event Handler /onResize/-----------------
    onResize = function(){
    	if(stateMap.resize_idto){return true;}

    	spa.chat.handleResize();
    	stateMap.resize_idto = setTimeout(
    		function(){stateMap.resize_idto = undefined;},
    		configMap.resize_interval
    		);
    }
    //--------------------End Event Handler /onResize/-----------------
    //------------------Begin Event Handler /onClickChat/-------------------
	onClickChat=function(event){
		changeAnchorPart({
				chat : (stateMap.is_chat_retracted ? 'open' : 'closed')
			});
		return false;
	};
    //------------------End Event Handler /onClickChat/-------------------

	//------------------End Event Handlers-------------------

	//-------------------Begin Callbacks-----------------------
	//Begin callback method /setChatAnchor/
    //Example : setChatAnchor('closed');
    //Purpose : change the chat component of the anchor
    //Arguments : 
    //  *position_type - may be 'closed' or 'opened'
    setChatAnchor = function(position_type){
    	return changeAnchorPart({chat:position_type});
    };
	//End callback method /setChatAnchor/
    //-------------------End Callbacks-----------------------

	//------------------Begin Public Methods-------------------
	//---------------Begin Public Method /initModule/------------
	//Example : spa.shell.initModule($('#app_div_id'))
		initModule=function($container){
		//load HTML and map jQuery collections
		stateMap.$container=$container;
		$container.html(configMap.main_html);
		setJqueryMap();

		//test toggle
		//setTimeout(function(){toggleChat(true);},3000);
		//setTimeout(function(){toggleChat(false);}, 8000);

		//initialize chat slider and bind click handler
		stateMap.is_chat_retracted = true;
		jqueryMap.$chat
		  .attr('title', configMap.chat_retracted_title)
		  .click(onClickChat);

		//configure uriAnchor to use our Schema
		$.uriAnchor.configModule({
			schema_map : configMap.anchor_schema
		});

		//configure and initialize feature modules
		spa.chat.configModule({
			set_chat_anchor : setChatAnchor,
			chat_model : spa.model.chat,
			people_model : spa.model.people
		});
		spa.chat.initModule(jqueryMap.$container);
		//Handle URI anchor change events.
		//This is done /after/ all feature modules are configured
		//and initialized, otherwise they will not be ready to handle
		//the trigger event, which is used to ensure the anchor is considered on-load
		//
		$(window)
		.bind('resize', onResize)
		.bind('hashchange', onHashChange)
		.trigger('hashchange');
	};
	//---------------End Public Method /initModule/------------

	return { initModule : initModule};
	//------------------End Public Methods-------------------
}());