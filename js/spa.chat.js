/*
spa.chat.js
Chat feature module for spa
*/

/*jslint  browser: true, continue: true,
  devel  : true, indent : 2,      maxerr      : 50,
  newcap : true, nomen  : true, plusplus      : true,
  regexp : true, sloppy : true, vars          : true,
  white  : true,
*/

/*global $, spa*/

spa.chat=(function () {
	//-----------------Begin Module Scope Variables------------
	var 
	configMap = {
		main_html : String()
		+'<div class="spa-chat">'
		  +'<div class="spa-chat-head">'
		    +'<div class="spa-chat-head-toggle">+</div>'
		    +'<div class="spa-chat-head-title">'
		      +'Chat'
		    +'</div>'
		  +'</div>'
		  +'<div class="spa-chat-closer">x</div>'
		  +'<div class="spa-chat-sizer">'
		  	+'<div class="spa-chat-list">'
		  		+'<div class="spa-chat-list-box"></div>'
		  	+'</div>'
		    +'<div class="spa-chat-msg">'
		    	+'<div class="spa-chat-msg-log"></div>'
		    	+'<div class="spa-chat-msg-in">'
		    		+'<form class="spa-chat-msg-form">'
			    		+'<input type="text"/>'
			    		+'<input type="submit" style="display:none"/>'
			    		+'<div class="spa-chat-msg-send">'
			    			+'send'
			    		+'</div>'
		    		+'</form>'
		    	+'</div>'
		    +'</div>'
		  +'</div>'
		+'</div>',
		settable_map : {
			slider_open_time : true,
			slider_close_time : true,
			slider_opened_em : true,
			slider_closed_em : true,
			slider_opened_title : true,
			slider_closed_title : true,

			chat_model : true,
			people_model : true,
			set_chat_anchor : true
		},

		slider_open_time : 250,
		slider_close_time : 250,
		slider_opened_em : 18,
		slider_closed_em : 2,
		slider_opened_title : 'Tap to close',
		slider_closed_title : 'Tap to open',
		slider_opened_min_em : 10,
		window_height_min_em : 20,

		chat_model : null,
		people_model : null,
		set_chat_anchor : null
	},
	stateMap = { 
		$append_target : null,
		position_type : 'closed',
		px_per_em : 0,
		slider_hidden_px : 0,
		slider_closed_px: 0,
		slider_opened_px : 0
	},
	jqueryMap = {},
	setJqueryMap, getEmSize, setPxSizes, setSliderPosition, onClickToggle, configModule, initModule, removeSlider ,handleResize,
	scrollChat, writeChat, writeAlert, clearChat, onTapToggle, onSubmitMsg, onTapList, onSetChatee, onUpdateChat, onListChange,
	onLogin, onLogout;
	//------------End Module Scope Variables-------------------

	//------------------Begin Utility Methods-------------------
	getEmSize = function(elem){
		return Number(getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]);
	};
	//------------------End Utility Methods-------------------

	//------------------Begin DOM Methods-------------------
	//Begin DOM method /setJqueryMap/
	setJqueryMap=function(){
		var $append_target = stateMap.$append_target,
		$slider = $append_target.find('.spa-chat');

		jqueryMap = {
			$slider : $slider,
			$head : $slider.find('.spa-chat-head'),
			$toggle : $slider.find('.spa-chat-head-toggle'),
			$title : $slider.find('.spa-chat-head-title'),
			$sizer : $slider.find('.spa-chat-sizer'),
			$list_box : $slider.find('.spa-chat-list-box'),
			$msg_log : $slider.find('.spa-chat-msg-log'),
			$msg_in : $slider.find('.spa-chat-msg-in'),
			$input : $slider.find('.spa-chat-input input[type=text]'),
			$send : $slider.find('.spa-chat-msg-send'),
			$form : $slider.find('.spa-chat-msg-form'),
			$window : $(window) 
		};
	};
	//End Dom method /setJqueryMap/

	//Begin DOM method /setPxSizes/
	setPxSizes = function(){
		var px_per_em, window_height_em, opened_height_em;

		px_per_em = spa.util_b.getEmSize(jqueryMap.$slider.get(0));
		window_height_em = Math.floor(
			(jqueryMap.$window.height()/px_per_em) +0.5
			);

		opened_height_em = window_height_em > configMap.window_height_min_em
		? configMap.slider_opened_em : configMap.slider_opened_min_em;

		stateMap.px_per_em  = px_per_em;
		stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em;
		stateMap.slider_opened_px = opened_height_em * px_per_em;

		jqueryMap.$sizer.css({
			height : (opened_height_em-2) * px_per_em
		});
	};
	//End DOM method /setPxSizes/

	//Begin Public method /setSliderPosition/
    //Example: spa.chat.setSliderPosition('closed');
    //Purpose : Move the chat slider to the requested position
    //Arguments: //*position_type - enum('closed', 'opened', or 'hidden')
    setSliderPosition=function(position_type, callback){
    	var 
    	height_px, animate_time, slider_title, toggle_text;

    	//position type of 'opened' is not allowed for anon user
    	//therefore we simply return false; the shell will fix the uri and try again
    	if(position_type === 'opened' && configMap.people_model.get_user().get_is_anon()){
    		return false;
    	}

    	//return true if slider already in requested position
    	if(stateMap.position_type===position_type){
    		if(position_type === 'opened'){
    			jqueryMap.$input.focus();
    		}
    		return true;
    	}

    	//prepare animate parameters
    	switch(position_type){
    		case 'opened':
    		height_px = stateMap.slider_opened_px;
    		animate_time=configMap.slider_open_time;
    		slider_title = configMap.slider_opened_title;
    		toggle_text = '=';
    		jqueryMap.$input.focus();
    		break;

    		case 'hidden':
    		height_px = 0;
    		animate_time = configMap.slider_open_time;
    		slider_title='';
    		toggle_text = '+';
    		break;

    		case 'closed':
    		height_px = stateMap.slider_closed_px;
    		animate_time = configMap.slider_close_time;
    		slider_title = configMap.slider_closed_title;
    		toggle_text = '+';
    		break;
    		//bail for unknown position
    		default : return false;
    	}

    	//animate slider position change
    	stateMap.position_type = '';
    	jqueryMap.$slider.animate(
    		{height : height_px},
    		animate_time,
    		function(){
    			jqueryMap.$toggle.prop('title', slider_title);
    			jqueryMap.$toggle.text(toggle_text);
    			stateMap.position_type = position_type;
    			if(callback){callback(jqueryMap.$slider);}
    		}
    		);
    	return true;
    };
	//End Public method /setSliderPosition/
	//------------------End DOM Methods-------------------

	//Begin private DOM methods to manage chat message
	scrollChat = function(){
		var $msg_log = jqueryMap.$msg_log;
		$msg_log.animate({
			scrollTop : $msg_log.prop('scrollHeight') - $msg_log.height()
		},150);
	};

	writeChat = function(person_name, text, is_user){
		var msg_class = is_user ? 'spa-chat-msg-log-me' : 'spa-chat-msg-log-msg';

		jqueryMap.$msg_log.append('<div class="'+msg_class+'">'
			+spa.util_b.encodeHtml(person_name)+ ': '
			+spa.util_b.encodeHtml(text)+'</div>');

		scrollChat();
	};

	writeAlert = function(alert_text){
		jqueryMap.$msg_log.append('<div class="spa-chat-msg-log-alert">'
									+spa.util_b.encodeHtml(alert_text)+'</div>');

		scrollChat();
	}

	clearChat = function(){jqueryMap.$msg_log.empty();};
	//End private DOM methods to manage chat message
	//------------------Begin Event Handlers-------------------
	onTapToggle = function(event){
		var set_chat_anchor = configMap.set_chat_anchor;
		if(stateMap.position_type==='opened'){
			set_chat_anchor('closed');
		}
		else if(stateMap.position_type==='closed'){
			set_chat_anchor('opened');
		}
		return false;
	};

	onSubmitMsg = function(event){
		var msg_text = jqueryMap.$input.val();
		if(msg_text.trim() === ''){return false;}
		configMap.chat_model.send_msg(msg_text);
		jqueryMap.$input.focus();
		jqueryMap.$send.addClass('spa-x-select');
		setTimeout( function(){
			jqueryMap.$send.removeClass('spa-x-select');
		},250);
		return false;
	};

	onTapList = function(event){
		var $tapped = $(event.elem_target), chatee_id;
		if(! $tapped.hasClass('spa-chat-list-name')){return false;}

		chatee_id = $tapped.attr('data-id');
		if(! chatee_id ){return false;}

		configMap.chat_model.set_chatee(chatee_id);
		return false;
	};

	onSetchatee = function(event, arg_map){
		var 
		new_chatee = arg_map.new_chatee, 
		old_chatee = arg_map.old_chatee;

		jqueryMap.$input.focus();

		if(! new_chatee){
			if(old_chatee){
				writeAlert(old_chatee.name + 'has left the chat');
			}
			else{
				writeAlert('Your friend has left the chat');
			}
			jqueryMap.$title.text('Chat');
			return false;
		}

		jqueryMap.$list_box
		.find('.spa-chat-list-name')
		.removeClass('spa-x-select')
		.end()
		.find('[data-id='+arg_map.new_chatee.id+']')
		.addClass('spa-x-select');

		writeAlert('Now chatting with '+ arg_map.new_chatee.name);
		jqueryMap.$title.text('Chat with '+arg_map.new_chatee.name);
		return true;
	};

	onListChange = function(event){
		var
		list_html = String(),
		people_db = configMap.people_model.get_db(),
		chatee = configMap.chat_model.get_chatee();

		people_db().each(function(person, idx){
			var select_class = '';
			if(person.get_is_anon() || person.getElementBy_is_user()){
				return true;
			}

			if(chatee && chatee.id === person.id){
				select_class = 'spa-x-select';
			}

			list_html 
			+= '<div class="spa-chat-list-name'
			+select_class+ ' " data-id="' +person.id + '">'
			+spa.util_b.encodeHtml(person.name)+'</div>';
		});

		if(!list_html){
			list_html = String()
			+'<div class="spa-chat-list-note">'
			+'To chat alone is the fate of all great souls...<br><br>'
			+'No one is online'
			+'</div>';
			clearChat();
		}

		//jqueryMap.$list_box.html(list_html);
		jqueryMap.$list_box.html(list_html);

	};
	//------------------End Event Handlers-------------------

	//------------------Begin Public Methods-------------------
	//------------------Begin Public Method /configModule/-------
	//Example : spa.chat.configModule({slider_open_em : 18});
	//Purpose: configure the module prior to initialization
	//Arguments:
	//  * set_chat_anchor - a callback to modify the URI anchor to inidcate opened or closed state.
	//    This callback must return false if the requested state cannot be met
	//  *chat_model - the chat model object provides methods to interact with our instant messaging
	//  *people_model - the people model object which provides methods to manage the list of people the model maintains
	//  *slider_* settings: all these are optional scalars. See maconfig.settable_map for a full list
	//  
	configModule=function(input_map){
		spa.util.setConfigMap({
			input_map : input_map,
			settable_map : configMap.settable_map,
			config_map : configMap
		});
		return true;
	};
	//------------------Begin Public Method /configModule/-------

	//---------------Begin Public Method /initModule/------------
	//Purpose : Initializes module
	//Arguments : 
	//  * $container the jquery element used by this feature
	//Returns : true
	//Throws : none
	//l
	initModule=function($append_target){
		$append_target.append(configMap.main_html);
		stateMap.$append_target = $append_target;
		setJqueryMap();
		setPxSizes();

		//initialize chat slider to default title and state
		jqueryMap.$toggle.prop('title', configMap.slider_closed_title);
		jqueryMap.$head.click(onClickToggle);
		stateMap.position_type = 'closed';

		return true;
	};
	//---------------End Public Method /initModule/------------

	//Begin Public Method /removeSlider/
    //Purpose :
    //  *Removes chatSlider DOM element
    //  *Reverts to initial state
    //  *Removes pointers to callbacks and other data
    //Returns : true
    removeSlider = function(){
    	//unwind initialization and state
    	//remove DOM container; this removes event bidings too
    	if(jqueryMap.$slider){
    		jqueryMap.$slider.remove();
    		jqueryMap = {};
    	}
    	stateMap.$append_target = null;
    	stateMap.position_type = 'closed';

    	//unwind key configurations
    	configMap.chat_model = null;
    	configMap.people_model = null;
    	configMap.set_chat_anchor = null;

    	return true;
    };
	//End Public Method /removeSlider/

	//Begin Public Method /handleResize/
    //Purpose: Given a window resize event, adjust the presentation provided by this module if needed
    //Actions: 
    //  If the window height: or width falls below a given threshold, resize the chat slider for the 
    //  reduced window size
    //Returns : Boolean
    //  *false - resize not considered
    //  *true - resize considered

    handleResize = function(){
    	//don't do anything if we don't have a slider container
    	if(!jqueryMap.$slider){return false;}

    	//recalculate the pixel size each time handleResize is called
    	setPxSizes();
    	if(stateMap.position_type==='opened'){
    		jqueryMap.$slider.css({height : stateMap.slider_opened_px});
    	}

    	return true;
    };
	//End Public Method /handleResize/
	//return public methods
	return {
		setSliderPosition : setSliderPosition, 
		configModule : configModule,
		initModule : initModule,
		removeSlider : removeSlider,
		handleResize : handleResize
	};
	//------------------End Public Methods-------------------
}());