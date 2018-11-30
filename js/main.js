

function delete_from_storage(e, a) {
    chrome.storage.local.get('sticker_pack', function(data) {
        var data = data.sticker_pack;  

        for (var i in data) { 
            if (data[i][1] === a) { data.splice(parseInt(i), 1); break; }
        }

        e.remove();
        chrome.storage.local.set({'sticker_pack': data});
    });
}


function stiker_pack_load() {
    chrome.storage.local.get({'sticker_pack': {}}, function(data) {

        if (!data.sticker_pack.length) {
            var div = document.createElement('div');
            div.id = 'no_sticker';
            document.getElementById('stickers').appendChild(div);
            div.addEventListener('click', function() { chrome.tabs.create({url: 'help.html', selected: true}); }, false);
            return
        }

        var data_sort = data.sticker_pack.sort(function (a, b) {
                if (a[2] > b[2]) return -1;
                if (a[2] < b[2]) return 1;
            });

        data_sort.forEach(function(a) {

            var div_stickers = document.getElementById('stickers'),
                div = document.createElement('div'),
                link = document.createElement('a'),
                img = document.createElement('img');

            img.src = a[0];

            div.appendChild(img);
            div.appendChild(link);
            div_stickers.appendChild(div);

            link.addEventListener('click', function() {
                delete_from_storage(div, a[1]);
            }, false);

        });

    });
}


document.addEventListener("DOMContentLoaded", function () {
    stiker_pack_load();
});
