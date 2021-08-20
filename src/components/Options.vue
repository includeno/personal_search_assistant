<template>
  <div class="container">
    <table class="tablestyle">
      <br>

      <tr class="table_tr_style">
        <a-label>Show Float Title On Tabs </a-label>
        <a-input v-model="showFloatTitle" style="width: 300px"></a-input>
        <a-button type="primary" v-on:click="init_showFloatTitle()">
          Reset
        </a-button>
      </tr>
      <br>
      <tr class="table_tr_style">
        <a-label>Float Title When The Mouse Aims To Links </a-label>
        <a-input v-model="floatTitleValid" style="width: 300px"></a-input>
        <a-button type="primary" v-on:click="init_floatTitleValid()">
          Reset
        </a-button>
      </tr>
      <br>
      <tr class="table_tr_style">
        <a-label>Float Title When The Mouse Doesn't Aim To Links </a-label>
        <a-input v-model="floatTitleInValid" style="width: 300px"></a-input>
        <a-button type="primary" v-on:click="init_floatTitleInValid()">
          Reset
        </a-button>
      </tr>
      <br>
      <tr>
      <a-label>Auto Clean Previous Records When Starting A New Day </a-label>
      <a-select v-model="autoCleaningTempTable" style="width: 300px">
        <a-select-option value="1" selected>
          开/On
        </a-select-option>
        <a-select-option value="0">
          关/Off
        </a-select-option>
      </a-select>
      <a-button type="primary" v-on:click="init_autoCleaningTempTable()">
        Reset
      </a-button>
      </tr>

      <br>

      <tr>
        <a-button type="primary" v-on:click="init()">
          Reset All
        </a-button>
        &nbsp;
        <a-button type="primary" v-on:click="config_write()">
          Confirm
        </a-button>
      </tr>
    </table>


  </div>
</template>

<script>
export default {
  name: "Options",
  data(){
    return{
      showFloatTitle:"",//开关显示浮动图标
      floatTitleValid:"",//浮动图标内文字 开
      floatTitleInValid:"",//浮动图标内文字 关
      autoCleaningTempTable:"",//自动清理前一天的临时列表内容
    }
  },
  mounted() {
    this.config_read();
  },
  methods:{
    init(){
      this.init_showFloatTitle();
      this.init_floatTitleValid();
      this.init_floatTitleInValid();
      this.init_autoCleaningTempTable();

      this.config_write();
    },

    init_showFloatTitle(){
      this.showFloatTitle="1";
    },
    init_floatTitleValid(){
      this.floatTitleValid="🐵";
    },
    init_floatTitleInValid(){
      this.floatTitleInValid="🙈";
    },
    init_autoCleaningTempTable(){
      this.autoCleaningTempTable="1";
    },
    config_write(){
      var that=this;
      chrome.runtime.sendMessage({
        message:"config_write",
        name:"config",
        showFloatTitle:that.showFloatTitle,
        floatTitleValid:that.floatTitleValid,
        floatTitleInValid:that.floatTitleInValid,
        autoCleaningTempTable:that.autoCleaningTempTable,
      });
    },
    config_read(){
      var that=this;
      chrome.runtime.sendMessage({
        message:"config_read",
        name:"config"
      },function (response) {
        if(response!=null){
          that.showFloatTitle=response.showFloatTitle;
          that.floatTitleValid=response.floatTitleValid;
          that.floatTitleInValid=response.floatTitleInValid;
          that.autoCleaningTempTable=response.autoCleaningTempTable;
        }
        else{
          that.init();
        }

      });
    }
  }
}
</script>

<style scoped>
.container {
  width: 1170px;
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
}
.tablestyle{
  margin: auto;
  text-align:center;
}
.table_tr_style{
  text-align:right;
}
</style>