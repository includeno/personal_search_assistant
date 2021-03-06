
let box = null;//定义注入的控件
let showFloatTitle=""
let floatTitleValid=""
let floatTitleInValid=""
let autoCleaningTempTable=""

//每当开启新网页时候就发送给后台当前网页的地址
chrome.runtime.sendMessage({
    message:"check_url",
    url:window.location.href
});
//从后台脚本读取数据库内的配置信息
async function config_read(){
    let config_read=await chrome.runtime.sendMessage({
        message:"config_read",
        name:"config"
    },function (response) {
        if(response!=null){
            showFloatTitle=response.showFloatTitle;
            floatTitleValid=response.floatTitleValid;
            floatTitleInValid=response.floatTitleInValid;
            autoCleaningTempTable=response.autoCleaningTempTable;
        }
    });
}

//鼠标移动到a标签时候标志的显示情况设置
function elementpos(event) {
    var dragtarget = document.getElementById('dragtarget');
    if (dragtarget != null&&showFloatTitle=="1") {
        if (currentelement != null && currentelement != '') {
            dragtarget.innerHTML=floatTitleValid;
        }
        else {
            dragtarget.innerHTML=floatTitleInValid;
        }
    }
}

var currentelement = null;
const bingdingkey = '192'

//测试案例1 谷歌商店 https://chrome.google.com/webstore/search/url?_category=extensions
//测试案例2 百度收藏夹 通过
//测试案例3 百度搜索结果 通过
function tag_a_event_over(event) {
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
window.onload =async function () {
    box = document.createElement('div');
    box.innerHTML = '<p draggable="true" id="dragtarget" color="green"></p>';
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
    });

    box.addEventListener('drag', function (event) {

    });

    box.addEventListener('dragstart', function (event) {
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

        }
        box.style.top = event.clientY + 'px';
    });

    document.body.appendChild(box);

    document.onkeyup = function (event) {
        var key = event.which;
        //console.log("onkeyup Key: " + String.fromCharCode(key) + "\nCharacter code: " + String(key) + " ");
        if (key == bingdingkey && currentelement != '' && (currentelement.startsWith("http") || currentelement.startsWith("https"))) {

            chrome.runtime.sendMessage({
                message:"temp_insert",
                url:currentelement,
            }, (response) => {
                //Got an asynchronous response with the data from the background

            });
        }

    };
    addListenerOfTag();
    await config_read();
    document.onmouseover = elementpos;

    //https://segmentfault.com/q/1010000009637450  https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver
    const container = document.body;
    container.addEventListener('DOMSubtreeModified', function () {
        //console.log("监听到页面变化");
        addListenerOfTag();
    }, false);
}