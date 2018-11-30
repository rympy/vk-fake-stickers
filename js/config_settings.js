
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


// -------------------------/ EXPORT / IMPORT SETTINGS \-----------------------------

function export_settings() {

    chrome.storage.local.get(null, function(data) {

        if (!Object.keys(data).length) {
            show_notification('icon/error.png', 'Ошибка', 'Нет данных');
            return;
        }
        
        var result = JSON.stringify(data);

        var url = 'data:base64,' + btoa(result);
        chrome.downloads.download({
            url: url,
            filename: 'VkFakeStickers_export.save'
        });

        show_notification('icon/ok.png', 'Внимание!', 'Никому не передавайте этот файл!', 3000); 
    });

}


function import_settings() {
    var input = document.createElement('input');
    input.type = 'file';
    
    input.onchange = _ => {
        var file = input.files[0];
        var reader = new FileReader();

        reader.onload = function() {
            try {
                var data = JSON.parse(atob(reader.result));
                chrome.storage.local.clear();
                chrome.storage.local.set(data);
                show_notification('icon/ok.png', 'Настройки', 'Настройки расширения успешно импортированы', 2000);
            } catch(e) {
                show_notification('icon/error.png', 'Настройки', 'Ошибка импорта', 2000);
            }
        }

        reader.readAsText(file)
    };

    input.click();
}

// -------------------------\ EXPORT / IMPORT SETTINGS /-----------------------------



document.addEventListener("DOMContentLoaded", function () {

    document.getElementById('import').addEventListener('click', function() {
        import_settings();
    }, false);

    document.getElementById('export').addEventListener('click', function() {
        export_settings();
    }, false);

});