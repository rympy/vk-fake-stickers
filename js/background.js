

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


function adding_to_storage(link, attach) {
    chrome.storage.local.get('sticker_pack', function(data) {
        var data = data.sticker_pack,
            time = Date.now() + 300000;
        if (data) { data.push([link, attach, time]); } else { data = [[link, attach, time]]; }  
        chrome.storage.local.set({'sticker_pack': data});
    });
}



//--------------------------------------/ UPLOAD \--------------------------------------------
/* https://github.com/crea7or/vk.com-rehosting-in-docs/blob/master/upload.js */

function prepare_img(img) {
    var fname = img.split('/');
    var image = fname[fname.length - 1];
    if (image.indexOf('?') > -1) { image = image.slice(0, image.indexOf('?')); }
    if (image.indexOf('#') > -1) { image = image.slice(0, image.indexOf('#')); }
    if (image.indexOf('&') > -1) { image = image.slice(0, image.indexOf('&')); }
    return image;
}


function upload(imageUrl, accToken, rsize) {
    "use strict";

    var imageName = prepare_img(imageUrl);
    var api_version = '&v=5.92';
    var type = '&type=graffiti';
    var uploadHttpRequest = new XMLHttpRequest();
    
    uploadHttpRequest.onload = function () {

        var documentUploadServer = new XMLHttpRequest(),
            requestFormData,
            documentUploadRequest;

        documentUploadServer.open('GET', 'https://api.vk.com/method/docs.getMessagesUploadServer?access_token=' + accToken + type + api_version);

        documentUploadServer.onload = function () {

            var answer = JSON.parse(documentUploadServer.response);
            
            if (answer.error !== undefined) {
                chrome.storage.local.remove('vkaccess_token');
                show_notification('icon/error.png', 'Error', 'Ops. Something went wrong. Please try again!', 5000);
                return;
            }

            if (answer.response.upload_url === undefined) {
                show_notification('icon/error.png', 'Error', 'VKAPI Error: GetMessagesUploadServer!', 5000);
                return;
            }

            requestFormData       = new FormData();
            documentUploadRequest = new XMLHttpRequest();

            requestFormData.append("file", uploadHttpRequest.response, imageName);

            documentUploadRequest.open('POST', answer.response.upload_url, true);

            documentUploadRequest.onload = function () {

                var answer = JSON.parse(documentUploadRequest.response),
                    documentSaveRequest;

                if (answer.file === undefined) {
                    show_notification('icon/error.png', 'Error', 'Upload blob error!', 5000);
                    return;
                }

                documentSaveRequest = new XMLHttpRequest();

                documentSaveRequest.open('GET', 'https://api.vk.com/method/docs.save?file=' + answer.file + '&access_token=' + accToken + api_version);

                documentSaveRequest.onload = function () {
                    var answer = JSON.parse(documentSaveRequest.response);

                    if (answer.response.graffiti === undefined) {
                        show_notification('icon/error.png', 'Error', 'VKAPI Error: Docs.Save - no file in response!', 5000);
                        return;
                    }

                    adding_to_storage(imageUrl, `doc${answer.response.graffiti.owner_id}_${answer.response.graffiti.id}`);
                    show_notification(imageUrl, '+1 Стикер', 'Добавлен новый стикер');

                };

                documentSaveRequest.send();
            };

            documentUploadRequest.send(requestFormData);
        };

        documentUploadServer.send();
    };

    uploadHttpRequest.responseType = 'blob';

    if (imageUrl.indexOf('?extra=') > -1) {     // temp. solution
        var mes = (rsize !== undefined && rsize.enable) ? 'Сервер Cloudimage.io не сможет получить изображения из VK.\nЗагрузите этот стикер на хостинг изображений!' : 'Чтобы добавить, загрузите этот стикер на хостинг изображений!';
        show_notification('icon/error.png', 'Ошибка', mes, 5000);
        return;
    }

    if (rsize !== undefined && rsize.enable) {
        uploadHttpRequest.open('GET', `https://${rsize.token}.cloudimg.io/width/${rsize.size}/x/${imageUrl}`);
    } else {
        uploadHttpRequest.open('GET', imageUrl);
    }

    uploadHttpRequest.onerror = function () {
        var err = (rsize !== undefined && rsize.enable) ? 'Сервер Cloudimage.io вернул ошибку!' : 'Ошибка загрузки!';
        show_notification('icon/error.png', 'Ошибка', err, 5000);
    };

    uploadHttpRequest.send();
}


function getUrlParameterValue(url, parameterName) {
    "use strict";

    var urlParameters  = url.substr(url.indexOf("#") + 1),
        parameterValue = "",
        index,
        temp;

    urlParameters = urlParameters.split("&");

    for (index = 0; index < urlParameters.length; index += 1) {
        temp = urlParameters[index].split("=");

        if (temp[0] === parameterName) {
            return temp[1];
        }
    }

    return parameterValue;
}


function listenerHandler(authenticationTabId, imageSourceUrl, rsize) {
    "use strict";

    return function tabUpdateListener(tabId, changeInfo) {
        var vkError,
            vkAccessToken,
            vkAccessTokenExpiredFlag;

        if (tabId === authenticationTabId && changeInfo.url !== undefined && changeInfo.status === "loading") {

            if (changeInfo.url.indexOf('oauth.vk.com/blank.html') > -1) {
                authenticationTabId = null;
                chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                vkError = getUrlParameterValue(changeInfo.url, 'error_reason');
                
                if (vkError === 'user_denied') {
                    chrome.tabs.remove(tabId);
                    show_notification('icon/error.png', 'Error', 'Confirmation required!', 5000);
                    return;
                }

                vkAccessToken = getUrlParameterValue(changeInfo.url, 'access_token');

                if (vkAccessToken === undefined || vkAccessToken.length === undefined) {
                    chrome.tabs.remove(tabId);
                    show_notification('icon/error.png', 'Error', 'VK Auth Error: token = 0 or vkAccessToken = undefined', 5000);
                    return;
                }

                vkAccessTokenExpiredFlag = Number(getUrlParameterValue(changeInfo.url, 'expires_in'));

                if (vkAccessTokenExpiredFlag !== 0) {
                    chrome.tabs.remove(tabId);
                    show_notification('icon/error.png', 'Error', 'VK Auth Error: vkAccessTokenExpiredFlag != 0', 5000);
                    return;
                }

                chrome.storage.local.set({'vkaccess_token': vkAccessToken}, function () {
                    show_notification('icon/ok.png', 'Success', 'Authorization finished!', 5000);
                });

                upload(imageSourceUrl, vkAccessToken, rsize);

                chrome.tabs.remove(tabId);
            }
        }
    };
}

//--------------------------------------\ UPLOAD /-------------------------------------------


function getClickHandler() {
    "use strict";
	
    return function (info, tab) {

        var imageSourceUrl  = info.srcUrl,
            imageExt        = '.png';

        if (info.srcUrl.indexOf(imageExt) === -1) {
            show_notification('icon/error.png', 'Error', 'Ошибка расширения изображения!\nВыберите изображение в формате *.png', 3000);
            return;
        }
        
        chrome.storage.local.get(['APP_ID', 'RESIZE_IMG', 'vkaccess_token'], function (items) {

            if (items.APP_ID === undefined) {
                show_notification('icon/error.png', 'Ошибка', 'Укажите APPID в настройках расширения!', 5000);
                chrome.tabs.create({url: 'help.html', selected: true});
                return;
            }

            var vkCLientId           = items.APP_ID,
                vkRequestedScopes    = 'docs,messages,offline',
                vkAuthenticationUrl  = 'https://oauth.vk.com/authorize?client_id=' + vkCLientId + '&scope=' + vkRequestedScopes + '&redirect_uri=http%3A%2F%2Foauth.vk.com%2Fblank.html&display=page&response_type=token';

            if (items.vkaccess_token === undefined) {
                chrome.tabs.create({url: vkAuthenticationUrl, selected: true}, function (tab) {
                    chrome.tabs.onUpdated.addListener(listenerHandler(tab.id, imageSourceUrl, items.RESIZE_IMG));
                });
                return;
            }

            upload(imageSourceUrl, items.vkaccess_token, items.RESIZE_IMG);

        });
    };
}


chrome.contextMenus.create({
    "title": "Добавить стикер",
    "type": "normal",
    "contexts": ["image"],
    "onclick": getClickHandler()
});
