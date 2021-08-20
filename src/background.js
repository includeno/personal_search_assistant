//return current time
function get_now_time() {
    var now = new Date(),
        y = now.getFullYear(),
        m = now.getMonth() + 1,
        d = now.getDate();
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + now.toTimeString().substr(0, 8);
}

function show_message_from_locales(key){
    return browser.i18n.getMessage(key);
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    //监听打开新网页时候 网页的状态
    if (request.message == "check_url") {
        let record =await select_record(urlTableName,request.url);
        if(record==null){
            console.log("无记录/No record");
        }
        else {
            new Notification(
                show_message_from_locales('messageLevelAttention'), {
                    body: show_message_from_locales('notificationExistInURLTable'),
                    icon: 'http://images0.cnblogs.com/news_topic/firefox.gif',
                });
        }
    }
    else if (request.message == "config_write") {
        let config =await update_record(configTableName,{
            name:request.name,
            showFloatTitle:request.showFloatTitle,
            floatTitleValid:request.floatTitleValid,
            floatTitleInValid:request.floatTitleInValid,
            autoCleaningTempTable:request.autoCleaningTempTable,
        });
        sendResponse(config);
        if(config==null){
            console.log("无config记录");
        }
    }
    else if (request.message == "config_read") {
        let config =await select_record(configTableName,request.name);
        sendResponse(config);
    }
});

//监听url列表
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{

    if(request.message=="url_insert"){
        let record=insert_record(urlTableName,{
            url:request.url,
            time: get_now_time()
        });
        record.then(res=>{
            chrome.runtime.sendMessage({
                message:"url_insert_success",
                record:res,
            });
        });

    }
    else if(request.message=="url_select"){
        let record=select_record(urlTableName,request.url);
        record.then(res=>{
            chrome.runtime.sendMessage({
                message:"url_select_success",
                record:res,
            });
        })
    }
    else if(request.message=="url_update"){
        let record=update_record(urlTableName,request.url);
        record.then(res=>{
            chrome.runtime.sendMessage({
                message:"url_update_success",
                record:res,
            });
        })
    }
    else if(request.message=="url_delete"){
        let record=delete_record(urlTableName,request.url);
        record.then(res=>{
            chrome.runtime.sendMessage({
                message:"url_delete_success",
                record:res,
            });
        })
    }
});

//监听临时列表temp
chrome.runtime.onMessage.addListener( (request,sender,sendResponse)=>{

    if(request.message=="temp_insert"){
        let record=insert_record(tempTableName,{
            url:request.url,
            time: get_now_time()
        });

        record.then(res=>{
            chrome.runtime.sendMessage({
                message:"temp_insert_success",
                record:res,
            });
            sendResponse(res);
        })

    }
    //查询所有记录
    else if(request.message=="temp_select_all"){
        let records=select_all_records(tempTableName);

        records.then(res=>{
            sendResponse(res);
            console.log("select_all_records sendResponse!"+res.length);

        })
    }
    else if(request.message=="temp_select"){
        let record=select_record(tempTableName,request.url);

        record.then(res=>{
            chrome.runtime.sendMessage({
                message:"temp_select_success",
                record:res,
            });
            sendResponse(res);
        })
    }
    else if(request.message=="temp_update"){
        let record=update_record(tempTableName,request.url);

        record.then(res=>{
            chrome.runtime.sendMessage({
                message:"temp_update_success",
                record:res,
            });
            sendResponse(res);
        })
    }
    else if(request.message=="temp_delete"){
        let record=delete_record(tempTableName,request.url);

        record.then(res=>{
            chrome.runtime.sendMessage({
                message:"temp_delete_success",
                record:res,
            });
            sendResponse(res);
        })
    }
    //删除所有记录
    else if(request.message=="temp_delete_all"){
        let records=delete_all_records(tempTableName);

        records.then(res=>{
            chrome.runtime.sendMessage({
                message:"temp_delete_all_success",
            });
            sendResponse(res);
        })
    }

    return true;
})


// background.js
var db = null;
const dbName="Personal_Search_Assistant";
const urlTableName="urltable";//保存被无效的网页列表
const tempTableName="temptable";//保存临时列表
const configTableName="configtable";//保存临时列表

//表结构 url time
function create_database() {
    const request = window.indexedDB.open(dbName);
    request.onerror = function (event) {
        console.log("Problem opening DB.");
    }
    request.onupgradeneeded = function (event) {
        db = event.target.result;
        console.log("ObjectStore onupgradeneeded");
        let url_objectStore = db.createObjectStore(urlTableName, {
            keyPath: 'url'
        });
        //建立url列的唯一索引 确保没有重复url
        url_objectStore.createIndex("url", "url", { unique: true });
        url_objectStore.transaction.oncomplete = function (event) {
            console.log("URL ObjectStore Created.");
        }

        let temp_objectStore = db.createObjectStore(tempTableName, {
            keyPath: 'url'
        });
        //建立url列的唯一索引 确保没有重复url
        temp_objectStore.createIndex("url", "url", { unique: true });
        temp_objectStore.transaction.oncomplete = function (event) {
            console.log("Temp ObjectStore Created.");
        }

        let config_objectStore = db.createObjectStore(configTableName, {
            keyPath: 'name'
        });
        //建立url列的唯一索引 确保没有重复url
        config_objectStore.createIndex("name", "name", { unique: true });
        config_objectStore.transaction.oncomplete = function (event) {
            console.log("Config ObjectStore Created.");
        }
    }
    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("DB OPENED.");
        //初始化 默认配置
        insert_record(configTableName,{
            name:"config",
            showFloatTitle:"1",
            floatTitleValid:"🐵",
            floatTitleInValid:"🙈",
            autoCleaningTempTable:"1",
        });

        db.onerror = function (event) {
            console.log("FAILED TO OPEN DB.")
        }
    }
}

function insert_record(tableName,record) {
    if (db) {
        const insert_transaction = db.transaction(tableName,"readwrite");
        const objectStore = insert_transaction.objectStore(tableName);
        return new Promise((resolve, reject) => {
            insert_transaction.oncomplete = function () {
                console.log("ALL INSERT TRANSACTIONS COMPLETE.");
                if(tableName===urlTableName){
                    new Notification(
                        show_message_from_locales('messageLevelInfo'), {
                            body: show_message_from_locales('notificationAddingToURLTableSucceed'),
                            icon: 'http://images0.cnblogs.com/news_topic/firefox.gif',
                        });
                }
                if(tableName===tempTableName){
                    new Notification(
                        show_message_from_locales('messageLevelInfo'), {
                            body: show_message_from_locales('notificationAddingToTempTableSucceed'),
                            icon: 'http://images0.cnblogs.com/news_topic/firefox.gif',
                        });
                }
                resolve(true);
            }
            insert_transaction.onerror = function () {
                console.log("PROBLEM INSERTING RECORDS.")
                if(tableName===urlTableName) {
                    new Notification(
                        show_message_from_locales('messageLevelAttention'), {
                            body: show_message_from_locales('notificationExistInURLTable'),
                            icon: 'http://images0.cnblogs.com/news_topic/firefox.gif',
                        });
                }
                if(tableName===tempTableName){
                    new Notification(
                        show_message_from_locales('messageLevelAttention'), {
                            body: show_message_from_locales('notificationExistInTempTable'),
                            icon: 'http://images0.cnblogs.com/news_topic/firefox.gif',
                        });
                }
                resolve(false);
            }
            let request = objectStore.add(record);
            request.onsuccess = function () {
            }

        });
    }
}

function select_record(tableName,record) {
    if (db) {
        const get_transaction = db.transaction(tableName, "readonly");
        const objectStore = get_transaction.objectStore(tableName);
        return new Promise((resolve, reject) => {
            get_transaction.oncomplete = function () {
                console.log("ALL GET TRANSACTIONS COMPLETE.");
            }
            get_transaction.onerror = function () {
                console.log("PROBLEM GETTING RECORDS.");
            }
            let request = objectStore.get(record);
            request.onsuccess = function (event) {
                resolve(event.target.result);
            }
        });
    }
}
function select_all_records(tableName) {
    if (db) {
        const get_transaction = db.transaction(tableName, "readonly");
        const objectStore = get_transaction.objectStore(tableName);
        return new Promise((resolve, reject) => {
            get_transaction.oncomplete = function () {
                console.log("SELLECT ALL TRANSACTIONS COMPLETE.");
            }
            get_transaction.onerror = function () {
                console.log("PROBLEM GETTING RECORDS.");
            }
            let request = objectStore.getAll();
            request.onsuccess = function (event) {
                resolve(event.target.result);
            }
        });
    }
}

function update_record(tableName,record) {
    if (db) {
        const put_transaction = db.transaction(tableName, "readwrite");
        const objectStore = put_transaction.objectStore(tableName);
        return new Promise((resolve, reject) => {
            put_transaction.oncomplete = function () {
                console.log("ALL PUT TRANSACTIONS COMPLETE.");
                resolve(true);
            }
            put_transaction.onerror = function () {
                console.log("PROBLEM UPDATING RECORDS.")
                resolve(false);
            }
            objectStore.put(record);
        });
    }
}
function delete_record(tableName,url) {
    if (db) {
        const delete_transaction = db.transaction(tableName,"readwrite");
        const objectStore = delete_transaction.objectStore(tableName);
        return new Promise((resolve, reject) => {
            delete_transaction.oncomplete = function () {
                console.log("ALL DELETE TRANSACTIONS COMPLETE.");
                if(tableName===urlTableName){
                    new Notification(
                        show_message_from_locales('messageLevelInfo'), {
                            body: show_message_from_locales('notificationRemovingFromURLTableSucceed'),
                            icon: 'http://images0.cnblogs.com/news_topic/firefox.gif',
                        });
                }

                resolve(true);
            }
            delete_transaction.onerror = function () {
                console.log("PROBLEM DELETE RECORDS.")
                resolve(false);
            }
            objectStore.delete(url);
        });
    }
}
function delete_all_records(tableName) {
    if (db) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            let request = await select_all_records(tableName);
            console.log("ALL DELETE RECORDS TRANSACTIONS COMPLETE.");
            for (let i = 0; i < request.length; i++) {
                await delete_record(tableName, request[i].url);
            }
            resolve(true);
        });
    }
}
function readAll(tableName) {
    console.log("read all "+tableName);
    const transaction = db.transaction(tableName,"readwrite");
    const objectStore = transaction.objectStore(tableName);

    objectStore.openCursor().onsuccess = function (event) {
        let cursor = event.target.result;
        let data=[];
        if (cursor) {
            // console.log('cursor: ' + JSON.stringify(cursor.value));
            // console.log('URL: ' + cursor.value.url);
            // console.log('Time: ' + cursor.value.time);
            data.push(cursor.value);
            cursor.continue();
        } else {
            console.log('没有更多数据了！');
            return data;
        }
    };

}
create_database();

function setUpContextMenus() {

    chrome.contextMenus.create({
        title: show_message_from_locales("contextMenusAddingToURLTable"),
        id: "add",
        documentUrlPatterns: ["http://*/*", "https://*/*"],
        contexts: ['page'],
        onclick: function (info, tab) {
            // 注意不能使用location.href，因为location是属于background的window对象
            let response=insert_record(urlTableName,{
                url:tab.url,
                time:get_now_time()
            });


        }
    });
    chrome.contextMenus.create({
        title: show_message_from_locales("contextMenusRemoveFromURLTable"),
        id: "delete",
        documentUrlPatterns: ["http://*/*", "https://*/*"],
        contexts: ['page'],
        onclick: async function (info, tab) {
            // 注意不能使用location.href，因为location是属于background的window对象
            let response = await delete_record(urlTableName, tab.url);

        }
    });

    chrome.contextMenus.create({
        title: show_message_from_locales("contextMenusAddingToTempTable"),
        id: "temp",
        documentUrlPatterns: ["http://*/*", "https://*/*"],
        contexts: ['page'],
        onclick: async function (info, tab) {
            // 注意不能使用location.href，因为location是属于background的window对象

            let response = await insert_record(tempTableName, {
                url: tab.url,
                time: get_now_time()
            });

        }
    });

}
//每次都自动加载右键菜单
setUpContextMenus();
