
var BTN_ID = 'btn_fake_smile',
	PANEL_ID = 'sticker_panel',
	TMP_HREF = document.location.href,
	LENGHT_PACK = 0,
	NEED_RELOAD = false;


function parse_url() {
	var s = window.location.search;
	if (s.indexOf('sel=c') > -1) {
		return 'chat_id=' + s.split('sel=c')[1];
	} else if (s.indexOf('sel=') > -1) {
		return 'peer_id=' + s.split('sel=')[1];;
	}
}


function send_fake_sticker(token, attach) {
    var peer = parse_url(),
    	random_id = Date.now(),
    	api_version = '5.92',
    	SendRequest = new XMLHttpRequest();

    if (!peer) return;

    SendRequest.open('GET', `https://api.vk.com/method/messages.send?${peer}&attachment=${attach}&random_id=${random_id}&access_token=${token}&v=${api_version}`);

    SendRequest.onload = function () {
        var answer = JSON.parse(SendRequest.response);
        if (answer.error !== undefined) {
        	console.log('VK Fake Stickers:', answer.error.error_code, answer.error.error_msg);
    	}
    };

    SendRequest.send(); 
}


function first_place(a) {
	chrome.storage.local.get('sticker_pack', function(data) {
		var data = data.sticker_pack,
			index = null;

		for (var i in data) { 
			if (data[i][1] === a) { index = parseInt(i); break; }
		}

		if (index === null || data.length === index + 1) return;

		data.push(...data.splice(index, 1));
		chrome.storage.local.set({'sticker_pack': data});
		NEED_RELOAD = true;
	});
}


function reload_panel(p) {
	if (NEED_RELOAD) NEED_RELOAD = false;
	if (p.children.length > 0) while (p.firstChild) p.removeChild(p.firstChild);
	document.getElementById(PANEL_ID).scrollTop = 0;
}


function sticker_panel() {
	var p = document.getElementById(PANEL_ID);
	
	if (!p.style.display) {
		p.style.display = 'block';

		chrome.storage.local.get(['vkaccess_token', 'sticker_pack'], function(data) {

			if (data.vkaccess_token === undefined && data.sticker_pack === undefined || !Object.keys(data.sticker_pack).length) {
	            if (document.getElementById('no_sticker')) return;
	            
	            var div = document.createElement('div');
	            div.id = 'no_sticker';
	            document.getElementById(PANEL_ID).appendChild(div);
	            return;
        	}

        	if (data.sticker_pack.length != LENGHT_PACK || NEED_RELOAD || !p.children.length) reload_panel(p); else return;

        	var time = Date.now();

	        data.sticker_pack.forEach(function(a) {
	            var link = document.createElement('a'),
	            	img = document.createElement('img');

	            img.src = a[0];
	            link.appendChild(img);

	            if (a[2] > time) {
	            	var nw = document.createElement('span');
	            	nw.innerHTML = 'new';
	            	link.appendChild(nw);
	            }
	            
	            p.insertBefore(link, p.firstChild);

	            link.addEventListener('click', function() {
	            	send_fake_sticker(data.vkaccess_token, a[1]);
	            	first_place(a[1]);
	            }, false);

	        });

	        LENGHT_PACK = data.sticker_pack.length;

		});

	} else {
		p.style.display = ''; 
	}

}


function create_button() {
	var btn = document.getElementById(BTN_ID);
	
	if (!btn) {
		var div = document.getElementsByClassName('im_chat-input--buttons');
		if (!div.length) return;
	
	    var btn_sticker = document.createElement('span');
	    btn_sticker.id = BTN_ID;

	    var panel = document.createElement('div');
	    panel.id = PANEL_ID;
	    document.getElementsByClassName('im-chat-input')[0].appendChild(panel);

	    div[0].appendChild(btn_sticker);

		btn_sticker.addEventListener('click', function() {
			sticker_panel();
	    }, false);

		document.addEventListener('click', function(e) {
			if (e.target != btn_sticker && panel.style.display) panel.style.display = '';
		});
	}

}


document.addEventListener("DOMContentLoaded", function() {

	window.onload = function() {

	    var body = document.querySelector("body");
	    
	    if (document.location.href.indexOf('vk.com/im') > -1) create_button();

	    var observer = new MutationObserver(function(mutations) {
	        if (TMP_HREF != document.location.href) {
	        	TMP_HREF = document.location.href;
	        	if (document.location.href.indexOf('vk.com/im') > -1) create_button();
	        }
	    });

	    observer.observe(body, {childList: true, subtree: true});

	};

});

