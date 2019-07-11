

document.addEventListener("DOMContentLoaded", function () {

    var parse = location.search.split('sid=')[1].split('&token='),
        sid = parse[0],
        token = parse[1];

    document.getElementById('sid').src = `https://api.vk.com/captcha.php?sid=${sid}&s=1`;


    document.getElementById('send').addEventListener('click', function() {
        
        var req = new XMLHttpRequest(),
            temp = '185014513|0|0|537311|4e7ad67d38|png|380652|temp.png|5e368d6b8b840ed0039b97835bb79c09|e968cf46e030673ad66f52f07ca9edd3|',
            captcha_key = document.getElementById('captcha_key').value;

        req.open('GET', `https://api.vk.com/method/docs.save?file=${temp}&captcha_sid=${sid}&captcha_key=${captcha_key}&access_token=${token}&v=5.92`, true);
        
        req.onload = function () {
            var res = JSON.parse(req.responseText);

            if (res.error.error_code === 14) {
                document.getElementById('sid').src = res.error.captcha_img;
                sid = res.error.captcha_sid;
                document.getElementById('captcha_key').value = '';
                return;
            }

            window.close();
        }

        req.send();
    
    }, false);


});

