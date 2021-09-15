<template>
  <div>
    <div>
      <h3>{{title}}
        <a-button v-on:click="deletetemplist">{{clearButton}}</a-button>
      </h3>

      <h3>
        <a-input v-bind:style="{width : 70+'%' }" v-model="manul"></a-input>
        <a-button v-on:click="addtemplistitem">手动添加链接</a-button>
      </h3>

      <br>

      <div ref="hello" id="requestform">
        <table class="temptable" align="left" border="1">
          <tr>
            <td v-bind:style="{width : 12+'%' }">{{time}}</td>
            <td >{{link}}</td>
            <td v-bind:style="{width : 10+'%' }">{{operation}}&{{note}}</td>
          </tr>

          <tr v-for="(item, index) in tempList" :key="index">
            <td v-bind:style="{width : 12+'%' }">
              {{item.time}}
            </td>
            <td >
              <a href="item.url" v-on:click="opennewtab(item.url)">{{show_standard_url(item.url)}}</a>
              <div v-show="showURLPreview==1">
                <img :src="item.favicons">
                <label>{{item.title}}{{item.description}}</label>
              </div>

            </td>

            <td v-bind:style="{width : 35+'%' }">
              <a-button v-on:click="copyURL(item)" >复制URL</a-button>
              <a-button v-on:click="deletetemplistitem(index)">删除记录</a-button>
              <br>
              {{note}}:
              <a-input v-bind:style="{width : 95+'%' }" v-model="item.note" v-on:change="saveNote(item)"  type="text"></a-input>
            </td>

            <!-- 多选框参考 https://www.cnblogs.com/li-sir/p/11445559.html -->

          </tr>

        </table>

      </div>
    </div>
  </div>
</template>

<script>
import Clipboard from 'clipboard';
import { getLinkPreview, getPreviewFromContent } from "link-preview-js";

export default {
  name: 'Popup',
  data() {
    return{
      manul:"",//手动模式输入链接
      templist: [],
      templist2: [],
      autoCleaningTempTable:"0",
      showURLPreview:"0",
    }
  },
  async mounted () {
    this.templist=[];
    await this.read_config();
    await this.select_all();
  },
  computed: {
    title () {
      return browser.i18n.getMessage('popupTitle');
    },
    clearButton () {
      return browser.i18n.getMessage('popupclearButton');
    },
    time(){
      return browser.i18n.getMessage('time');
    },
    link(){
      return browser.i18n.getMessage('link');
    },
    operation(){
      return browser.i18n.getMessage('operation');
    },
    note(){
      return browser.i18n.getMessage('note');
    },


    defaultText () {
      return browser.i18n.getMessage('extName')
    },
    tempList(){
      return this.templist;
    }
  },
  methods: {
    async read_config(){
      var that = this;
      let config_read=await chrome.runtime.sendMessage({
        message:"config_read",
        name:"config"
      },function (response) {
        if(response!=null){
          that.autoCleaningTempTable=response.autoCleaningTempTable;
          that.showURLPreview=response.showURLPreview;

        }
      });
    },

    //messaging https://developer.chrome.com/docs/extensions/mv3/messaging/
    //传递this的方法 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Arrow_functions
    async select_all(){
      var that = this;
      let response2=await chrome.runtime.sendMessage({
        message:"temp_select_all",
      },async function (response) {
        that.templist = [];

        const zero = new Date(new Date(new Date().toLocaleDateString()).getTime());//当天时间0点

        if (response != null) {
          let temp=[]
          for (let i = 0; i < response.length; i++) {
            //惰性失效 清理过期时间超过1天的记录
            if(that.autoCleaningTempTable=="1"){
              let cur=new Date(new Date(new Date(response[i].time).toLocaleDateString()).getTime());//当天时间0点
              var date = cur.getTime() - zero.getTime();   //时间差的毫秒数
              var days=Math.floor(date/(24*3600*1000))
              if(days>=2){
                //删除过期的记录
                chrome.runtime.sendMessage({
                  message:"temp_delete",
                  url:response[i].url
                });
                continue;
              }
            }
            //将有效的记录加入列表并
            if(that.showURLPreview=="1"){
              //允许预览
              let preview=await that.getPreview(response[i].url);
              that.templist.push({url: response[i].url, time: response[i].time, note: response[i].note,title:preview.title,favicons:preview.favicons[0],description:preview.description});
            }
            else{
              //不允许预览
              that.templist.push({url: response[i].url, time: response[i].time, note: response[i].note,title:"",favicons:"",description:""});
            }
          }
          //按照时间进行排序 先加入的最小
          that.templist.sort(function (a,b){return a.time>b.time?1:-1});

        } else {
          console.log("response  null!");
        }

      });
    },

    gettemplist:async function () {
      await this.select_all();
    },
    deletetemplist:async function () {
      await chrome.runtime.sendMessage({
        message:"temp_delete_all",
      });
      this.templist=[];

    },
    deletetemplistitem:async function(index){
      let keyurl=this.templist[index].url;
      chrome.runtime.sendMessage({
        message:"temp_delete",
        url:keyurl
      });
      this.select_all();
    },
    opennewtab: function (url) {
      chrome.tabs.create({ url: url }, function (tab) {
      });

    },
    show_standard_url: function (url) {
      if (url.length<=60) {
        return url;
      }
      else {
        return url.substring(0,54)+"......"
      }
    },
    //复制url到剪切板
    copyURL:function (item){
      let url=item.url;
      console.log("print url:"+url);
      const clipboard = new Clipboard("#requestform", {
        // 点击copy按钮，直接通过text直接返回复印的内容
        text: () => new String(url),
      });
      // 通过传递DOM选择器，HTML元素或HTML元素列表实例化
      clipboard.on('success', (e) => {
        this.$message.success(`复制成功，内容为：${e.text}`);
        e.clearSelection();
        // 释放内存
        clipboard.destroy();
      });
      clipboard.on('error', () => {
        // 不支持复制
        this.$message.error('该浏览器不支持自动复制');
        // 释放内存
        clipboard.destroy();
      })
    },
    saveNote:function (item){
      chrome.runtime.sendMessage({
        message:"temp_update",
        url:item.url,
        time:item.time,
        note:item.note
      });
      this.select_all();
    },
    getPreview:async function (url){
      let response=await getLinkPreview(url);
      return response;
    },
    async addtemplistitem(){
      let url=this.manul;
      if(String(url).startsWith("http")||String(url).startsWith("https")){
        await chrome.runtime.sendMessage({
          message:"temp_insert",
          url:url
        });
        this.manul="";
        this.select_all();
      }
      else{
        alert("No URL exists!");
      }
    },

  },
}
</script>

<style scoped>
p {
  font-size: 20px;
}
.temptable{
  width:800px;
  height:75%;
  border:3px;
}
</style>
