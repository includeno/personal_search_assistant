<template>
  <div class="mainpage">
    <div>
      <h3>{{title}}
      </h3>
      <div>
        <a-button v-on:click="deleteTemplist">{{clearButton}}</a-button>
        <a-divider type="vertical" />

        <a-button v-on:click="exportData()"><a-icon type="download" /> {{exportButton}} </a-button>
<!--        https://www.antdv.com/components/divider-cn/-->
        <a-divider type="vertical" />

        <a-upload
            name="file"
            :fileList="fileList"
            :beforeUpload="beforeUpload"
        >
          <a-button> <a-icon type="upload" /> {{importButton}} </a-button>
        </a-upload>
        <h3>
          <a-input v-bind:style="{width : 70+'%' }" v-model="manul"></a-input>
          <a-divider type="vertical" />
          <a-button v-on:click="addTemplistItem">手动添加链接</a-button>
        </h3>
      </div>



      <div ref="hello" id="requestform">
        <table class="temptable" align="left" border="1">
          <tr v-show="tempList.length!=0">
            <td v-bind:style="{width : 12+'%' }">{{time}}</td>
            <td >{{link}}</td>
            <td v-bind:style="{width : 10+'%' }">{{operation}}&{{note}}</td>
          </tr>

          <tr v-for="(item, index) in tempList" :key="index">
            <td v-bind:style="{width : 12+'%' }">
              {{item.time}}
            </td>
            <td >
              <a href="item.url" v-on:click="openNewTab(item.url)">{{show_standard_url(item.url)}}</a>
              <div v-show="showURLPreview==1">
                <img :src="item.favicons">
                <label>{{item.title}}{{item.description}}</label>
              </div>

            </td>

            <td v-bind:style="{width : 35+'%' }">
              <a-button v-on:click="copyURL(item)" >复制URL</a-button>
              <a-button v-on:click="deleteTemplistItem(index)">删除记录</a-button>
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

      fileList:[],//文件列表
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
      return browser.i18n.getMessage('popupClearButton');
    },
    importButton () {
      return browser.i18n.getMessage('popupImportButton');
    },
    exportButton () {
      return browser.i18n.getMessage('popupExportButton');
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
    //读取配置
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

    deleteTemplist:async function () {
      await chrome.runtime.sendMessage({
        message:"temp_delete_all",
      });
      this.templist=[];

    },
    deleteTemplistItem:async function(index){
      let keyurl=this.templist[index].url;
      chrome.runtime.sendMessage({
        message:"temp_delete",
        url:keyurl
      });
      this.select_all();
    },
    openNewTab(url) {
      chrome.tabs.create({ url: url }, function (tab) {
      });

    },
    show_standard_url(url) {
      if (url.length<=60) {
        return url;
      }
      else {
        return url.substring(0,54)+"......"
      }
    },
    //复制url到剪切板
    copyURL(item){
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
    },
    getPreview:async function (url){
      let response=await getLinkPreview(url);
      return response;
    },
    async addTemplistItem(){
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
    //upload参考  https://www.antdv.com/components/upload-cn/
    beforeUpload(file){
      var that=this;

      //只读取json文件
      if(file.type === 'application/json'){
        var reader = new FileReader();
        //将文件以文本形式读入页面
        reader.readAsText(file);
        reader.onload=async (result)=>{
          let array=JSON.parse((reader.result));
          for(let i=0;i<array.length;i++){

            let url=array[i].url;
            let note=array[i].note;
            let time=array[i].time;
            console.log("array[i]:"+JSON.stringify(array[i]));
            if(String(url).startsWith("http")||String(url).startsWith("https")){
              chrome.runtime.sendMessage({
                message:"temp_insert",
                url:url,
                note:note,
                time:time
              });

            }
          }
          that.fileList=[]
          that.select_all();
          return true;
        }
      }
      else{
        alert("file not exist!");
        return false;
      }
    },


    //文件下载 https://stackoverflow.com/questions/27120757/failed-to-execute-createobjecturl-on-url
    exportData(){
      let array=[];
      for(let i=0;i<this.templist.length;i++){
        array.push({url: this.templist[i].url, time: this.templist[i].time, note: this.templist[i].note});
      }
      let url=window.URL.createObjectURL(new Blob([JSON.stringify(array)], {type: "application/json"}))
      var a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      a.click();

      window.URL.revokeObjectURL(url);
      document.removeChild(a);
    },
  },
}
</script>

<style scoped>
.mainpage{
  height: auto;
  align-content: center;
}
p {
  font-size: 20px;
}
.temptable{
  width:800px;
  height:75%;
  border:3px;
}
</style>
