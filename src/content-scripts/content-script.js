console.log('Hello from the content-script')
let box = null;//定义注入的控件

function checkNotification() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }
        // check whether notification permissions have alredy been granted
    // Otherwise, ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                //new Notification("Request granted!");
            }
        });
    }
}

//每当开启新网页时候就发送给后台当前网页的地址
chrome.runtime.sendMessage({
    message:"check_url",
    url:window.location.href
});

function elementpos(event) {
    var dragtarget = document.getElementById('dragtarget');
    if (dragtarget != null) {
        if (currentelement != null && currentelement != '') {
            dragtarget.innerHTML='🐵';
        }
        else {
            dragtarget.innerHTML='🙈';
        }

    }

}

var currentelement = null;
const bingdingkey = '192'

//测试案例1 谷歌商店 https://chrome.google.com/webstore/search/url?_category=extensions
//测试案例2 百度收藏夹 通过
//测试案例3 百度搜索结果 通过
function tag_a_event_over(event) {
    //console.log('element=', event);

    if (event.srcElement != null && 'href' in event.srcElement) {
        currentelement = event.srcElement.href;
    }
    else if (event.relatedTarget != null && 'href' in event.relatedTarget) {
        currentelement = event.relatedTarget.href;
    }
    else if (event.target != null && 'href' in event.target) {
        currentelement = event.target.href;
    }
    else if (event.target.parentElement != null && 'href' in event.target.parentElement) {
        currentelement = event.target.parentElement.href;
    }
    else {
        //未找到
        console.log('未找到');
    }
    if (currentelement == null) {
        let temp = null;
        let ele = event.srcElement;
        while (ele != null) {
            ele = ele.parentElement;
            if (ele != null && ele.tagName == 'a') {
                temp = ele;
            }
        }
        if (temp != null) {
            currentelement = temp.href;
        }
    }
    if(currentelement != null){
        if(typeof currentelement =='string'){
            if(currentelement.indexOf('javascript:') != -1){
                currentelement = null;
            }
            else{
                currentelement = currentelement.replace(" ", "");
            }

        }

    }

}

function tag_a_event_out(event) {
    currentelement = null;
}

function addListenerOfTag() {
    var linkTags = document.getElementsByTagName("a");
    for (var i = 0; i < linkTags.length; i++) {

        //添加onmouseover事件
        linkTags[i].onmouseover = tag_a_event_over;
        linkTags[i].onmouseout = tag_a_event_out;
    }
}
window.onload = function () {
    box = document.createElement('div');
    box.innerHTML = '<p draggable="true" id="dragtarget" color="green">拖动改变位置</p>';
    box.id = 'mybox';

    box.draggable = "true";

    box.style.zIndex = '100000';
    box.style.color = "red"
    box.style.top = '50%';
    box.style.left = '0';
    box.style.position = 'fixed';

    //取消默认拖动限制
    box.addEventListener('dragover', function (event) {
        event.preventDefault();
        //console.log("dragover "+event.screenY);
    });

    box.addEventListener('drag', function (event) {

        //console.log("drag "+event.screenY);
    });

    box.addEventListener('dragstart', function (event) {

        //console.log("dragstart "+event.screenY);
    });

    box.addEventListener('dragend', function (event) {
        var screen_width = screen.availWidth;
        var screen_height = screen.availHeight;

        //https://www.cnblogs.com/jiangxiaobo/p/6593584.html
        if (event.clientX >= screen_width / 2 + 1) {
            //box.removeAttribute("style");
            box.style.left = '';
            box.style.right = '0';
            box.style.zIndex = '100000';
            //box.style.color = "red";
            box.style.position = 'fixed';
        }
        else {
            //box.removeAttribute("style");
            box.style.left = '0';
            box.style.right = '';
            box.style.zIndex = '100000';
            box.style.position = 'fixed';
            //box.style.color = "red";
        }
        box.style.top = event.clientY + 'px';
    });

    document.body.appendChild(box);

    document.onkeyup = function (event) {
        var key = event.which;
        //console.log("onkeyup Key: " + String.fromCharCode(key) + "\nCharacter code: " + String(key) + " ");
        if (currentelement == null) {
            //
            let a=1;
            a=2;
        }
        else if (key == bingdingkey && currentelement != '' && (currentelement.startsWith("http") || currentelement.startsWith("https"))) {

            chrome.runtime.sendMessage({
                message:"temp_insert",
                url:currentelement,
            }, (response) => {
                // 3. Got an asynchronous response with the data from the background
                console.log('收到', response);

            });
        }

    };
    addListenerOfTag();
    document.onmouseover = elementpos;

    //https://segmentfault.com/q/1010000009637450  https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver
    const container = document.body;
    container.addEventListener('DOMSubtreeModified', function () {
        //console.log("监听到页面变化");
        addListenerOfTag();
    }, false);
}