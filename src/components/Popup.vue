<template>
  <div>
    <div>
      <h3>{{title}}
        <button v-on:click="deletetemplist">{{clearButton}}</button>
      </h3>

      <br>

      <div ref="hello" id="requestform">

        <table v-bind:style="{width : 600+'px' }"  align="left">
          <tr>
            <td v-bind:style="{width : 150+'px' }">{{time}}</td>
            <td v-bind:style="{width : 400+'px' }">{{link}}</td>
          </tr>

          <tr v-for="(item, index) in tempList" :key="index">
            <td v-bind:style="{width : 150+'px' }">
              {{item.time}}
            </td>
            <td v-bind:style="{width : 280+'px' }">
              <a href="item.url" v-on:click="opennewtab(item.url)">{{show_standard_url(item.url)}}</a>
            </td>
            <td v-bind:style="{width : 150+'px' }">
              <button v-on:click="deletetemplistitem(index)">删除记录</button>
            </td>
            <!-- 多选框参考 https://www.cnblogs.com/li-sir/p/11445559.html -->
            <td>

            </td>

          </tr>
        </table>

      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Popup',
  data() {
    return{
      templist: [],
      templist2: [],
    }
  },
  mounted () {
    this.templist=[];

    console.log("mounted");
    this.select_all();
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


    defaultText () {
      return browser.i18n.getMessage('extName')
    },
    tempList(){
      return this.templist;
    }
  },
  methods: {
    //messaging https://developer.chrome.com/docs/extensions/mv3/messaging/
    //传递this的方法 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Arrow_functions
    async select_all(){
      var that = this;
      let response2=await chrome.runtime.sendMessage({
        message:"temp_select_all",
      },function (response){
        that.templist=[];
        if(response!=null){
          for (let i = 0; i < response.length; i++) {
            that.templist.push({url:response[i].url,time:response[i].time});
          }
        }
        else{
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
  },
}
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
