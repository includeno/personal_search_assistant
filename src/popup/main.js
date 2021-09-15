import Vue from 'vue'
import App from './App.vue'

//全局引入ant
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
Vue.use(Antd)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App)
});
