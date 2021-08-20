<template>
  <div class="container">
    <table class="tablestyle">
      <br>

      <tr class="table_tr_style">
        <a-label>{{optionsTitleShowFloatTitle}}</a-label>
        <a-input v-model="showFloatTitle" style="width: 300px"></a-input>
        <a-button type="primary" v-on:click="init_showFloatTitle()">
          {{optionsResetButton}}
        </a-button>
      </tr>
      <br>
      <tr class="table_tr_style">
        <a-label>{{optionsTitleFloatTitleValid}}</a-label>
        <a-input v-model="floatTitleValid" style="width: 300px"></a-input>
        <a-button type="primary" v-on:click="init_floatTitleValid()">
          {{optionsResetButton}}
        </a-button>
      </tr>
      <br>
      <tr class="table_tr_style">
        <a-label>{{optionsTitleFloatTitleInValid}}</a-label>
        <a-input v-model="floatTitleInValid" style="width: 300px"></a-input>
        <a-button type="primary" v-on:click="init_floatTitleInValid()">
          {{optionsResetButton}}
        </a-button>
      </tr>
      <br>
      <tr class="table_tr_style">
      <a-label>{{optionsTitleAutoCleaningTempTable}}</a-label>
      <a-select v-model="autoCleaningTempTable" style="width: 300px">
        <a-select-option value="1" selected>
          开/On
        </a-select-option>
        <a-select-option value="0">
          关/Off
        </a-select-option>
      </a-select>
      <a-button type="primary" v-on:click="init_autoCleaningTempTable()">
        {{optionsResetButton}}
      </a-button>
      </tr>

      <br>

      <tr>
        <a-button type="primary" v-on:click="init()">
          {{optionsResetAllButton}}
        </a-button>
        &nbsp;
        <a-button type="primary" v-on:click="config_write()">
          {{optionsConfirmButton}}
        </a-button>
      </tr>

      <tr >
        {{addToTempTableKey}}
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
  computed:{
    optionsTitleShowFloatTitle(){
      return browser.i18n.getMessage('optionsTitleShowFloatTitle');
    },
    optionsTitleFloatTitleValid(){
      return browser.i18n.getMessage('optionsTitleFloatTitleValid');
    },
    optionsTitleFloatTitleInValid(){
      return browser.i18n.getMessage('optionsTitleFloatTitleInValid');
    },
    optionsTitleAutoCleaningTempTable(){
      return browser.i18n.getMessage('optionsTitleAutoCleaningTempTable');
    },
    optionsResetButton(){
      return browser.i18n.getMessage('optionsResetButton');
    },
    optionsConfirmButton(){
      return browser.i18n.getMessage('optionsConfirmButton');
    },
    optionsResetAllButton(){
      return browser.i18n.getMessage('optionsResetAllButton');
    },
    addToTempTableKey(){
      return browser.i18n.getMessage('addToTempTableKey');
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