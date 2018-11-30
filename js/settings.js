
function show_notification(icon, ttl, mss, tim) {
    tim = tim || 1500;
    chrome.notifications.create({
        type: 'basic',
        iconUrl: icon,
        title: ttl,
        message: mss
    }, function(nid) { 
        setTimeout(function () { chrome.notifications.clear(nid) }, tim); 
    });
}


var appid = 'appid';


function save_settings() {
    var value_apid = document.getElementById(appid).value;
    
    if (!value_apid.length) return;

    var on_size = document.getElementById('enable_size').checked,
        width_sticker = document.getElementById('width_sticker').value,
        token_id = document.getElementById('token').value,
        ws = width_sticker.length ? width_sticker : null,
        tkn = token_id.length ? token_id : null;

    if (ws === null || tkn === null) {
        on_size = false;
        ws = tkn = null;
    }

    var data = {
        APP_ID: value_apid,
        RESIZE_IMG: {
            enable: on_size,
            size: ws,
            token: tkn
        }
    }
    
    chrome.storage.local.set(data);
    show_notification('icon/ok.png', 'Настройки обновлены', `AppID: ${value_apid} | Resizing: ${data.RESIZE_IMG.enable}`, 2000);
}


document.addEventListener("DOMContentLoaded", function () {

    chrome.storage.local.get(['APP_ID', 'RESIZE_IMG'], function(data) {

        if (data.APP_ID !== undefined) {
            document.getElementById(appid).value = data.APP_ID;

            if (data.RESIZE_IMG !== undefined) {
                if (data.RESIZE_IMG.enable) {
                    document.getElementById('enable_size').checked = true;
                    document.getElementById('div_sz').style.display = 'block';
                }
                
                document.getElementById('width_sticker').value = data.RESIZE_IMG.size;
                document.getElementById('token').value = data.RESIZE_IMG.token;
            }
        }

    });

    document.getElementById('save').addEventListener('click', function() {
        save_settings();
    }, false);

    document.getElementById('enable_size').addEventListener('change', function() {
        var div_sz = document.getElementById('div_sz');
        if (this.checked) {
            div_sz.style.display = 'block';
        } else {
            div_sz.style.display = 'none';
        }
    }, false);

});
