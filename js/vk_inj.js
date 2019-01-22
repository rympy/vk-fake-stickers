
var BTN_ID = 'btn_fake_smile',
	PANEL_ID = 'sticker_panel',
	TMP_HREF = document.location.href,
	DUMP_DATA = JSON.stringify({editable:{sizes:{s:[],m:[]},label:'',href:''}}),
	LENGHT_PACK = 0,
	NEED_RELOAD = false;



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


function fix_media_preview() {
	document.getElementById('_im_media_preview').style.display = 'none';
	document.querySelector('button.im-send-btn_send').click();
	document.getElementById('_im_media_preview').style.display = 'block';
}


function sticker_panel() {
	var p = document.getElementById(PANEL_ID);
	
	if (!p.style.display) {
		document.querySelector('div._im_media_selector.im-chat-input--selector').click();	//fix chooseMedia

		p.style.display = 'block';

		chrome.storage.local.get(['sticker_pack'], function(data) {

			if (data.sticker_pack === undefined || !Object.keys(data.sticker_pack).length) {
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
	            	img = document.createElement('img'),
	            	owner_id = a[1].slice(3);

	            img.src = a[0];
	            link.appendChild(img);

	            link.setAttribute("onclick", `cur.chooseMedia('doc', '${owner_id}', ${DUMP_DATA});`);

	            if (a[2] > time) {
	            	var nw = document.createElement('span');
	            	nw.innerHTML = 'new';
	            	link.appendChild(nw);
	            }
	            
	            p.insertBefore(link, p.firstChild);

	            link.addEventListener('click', function() {
	            	fix_media_preview()
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

