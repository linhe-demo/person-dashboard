<template>
  <el-container>
    <el-header>
      <h1>SQL 查询系统</h1>
    </el-header>
  </el-container>
</template>

<script>
import {
  ElContainer,
  ElHeader,
} from 'element-plus';
import { config } from '../../config.js';
import * as ww from '@wecom/jssdk';
import axios from "axios";

export default {
  name: 'SqlQuery',
  components: {
    ElContainer,
    ElHeader,
  },
  data() {
    return {
      sqlQuery: '',
      queryResults: [],
      columns: [],
      errorMessage: '',
      fullscreenLoading: false,
      apiUrl: config.apiUrl,
      wechatUrl: config.wechatUrl,
      token: config.token,
      corpId: "",
      ticket: "",
      url: "",
      queryHistory: [],
      sqlList: []
    };
  },
  created() {
    console.log('Component created');
    this.url = window.location.href.split('#')[0];
    console.log('Registering WeChat SDK');

    ww.register({
      corpId: '1234546',
      jsApiList: ['getExternalContact'],
      getConfigSignature: this.getConfigSignature // 使用 this 引用方法
    });

  },
  methods: {
    async getConfigSignature() {
      alert("here")
      console.log('Getting config signature');
      try {
        const res = await axios.post(this.wechatUrl + '/api/business/home/client-config', { "url": this.url });
        if (res.data.code === 0) {
          return {
            timestamp: res.data.data.timestamp,
            nonceStr: res.data.data.nonceStr,
            signature: res.data.data.signature
          };
        } else {
          this.$message({ type: 'error', message: res.data.msg });
        }
      } catch (error) {
        console.error('获取签名配置失败:', error);
        this.$message({ type: 'error', message: '获取签名配置失败，请检查网络或服务器状态。' });
        throw error;
      }
    }
  }
};
</script>
