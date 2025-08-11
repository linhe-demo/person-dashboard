<template>
  <el-container>
    <el-header>
      <h1>SQL 查询系统</h1>
    </el-header>
    <el-main>
      <el-container v-loading.fullscreen.lock="fullscreenLoading">
        <el-input
            v-model="sqlQuery"
            placeholder="请输入 SQL 语句"
            class="sql-input"
        />
        <el-button type="primary" style="margin-left:10px" @click="executeSql">执行查询</el-button>
      </el-container>

      <h3>历史查询语句</h3>
      <div class="history-box">
        <ul>
          <li v-for="(query, index) in queryHistory" :key="index">{{ query }}</li>
        </ul>
      </div>

      <div class="table-container">
        <el-table
            v-if="queryResults.length"
            :data="queryResults"
            class="result-table"
            style="width: 100%; overflow: auto;"
            :header-cell-style="{ position: 'sticky', top: '0' }"
        >
          <el-table-column
              v-for="(column, index) in columns"
              :key="index"
              :prop="column.prop"
              :label="column.label"
              :min-width="150"
              class-name="column-cell"
          />
        </el-table>
      </div>

      <el-button v-if="queryResults.length" type="success" @click="generateInsertStatements" style="margin-top: 20px;">
        一键生成 INSERT 语句
      </el-button>

      <el-alert v-if="errorMessage" title="错误" type="error" :closable="false">
        {{ errorMessage }}
      </el-alert>
    </el-main>
  </el-container>
</template>

<script>
import {
  ElInput,
  ElButton,
  ElTable,
  ElAlert,
  ElContainer,
  ElHeader,
  ElMain
} from 'element-plus';
import axios from "axios";
import {config} from '../../config.js';

export default {
  name: 'SqlQuery',
  components: {
    ElInput,
    ElButton,
    ElTable,
    ElAlert,
    ElContainer,
    ElHeader,
    ElMain,
  },
  data() {
    return {
      sqlQuery: '',
      queryResults: [],
      columns: [],
      errorMessage: '',
      fullscreenLoading: false,
      apiUrl: config.apiUrl,
      token: config.token,
      queryHistory: [],
      sqlList: []
    };
  },
  methods: {
    async executeSql() {
      this.fullscreenLoading = true;
      this.errorMessage = '';
      this.queryResults = [];
      this.columns = [];

      let flag = false;

      if (this.queryHistory.includes(this.sqlQuery)) {
        flag = true;
      }
      const beginDate = new Date();
      try {
        const res = await axios.post(this.apiUrl + '/supplier/inner/query', {
          "query": this.sqlQuery,
          "token": this.token
        });
        if (res.data.code === 0) {
          this.queryResults = res.data.data.results || [];
          if (this.queryResults.length > 0) {
            this.columns = Object.keys(this.queryResults[0]).map(key => ({
              prop: key,
              label: key.charAt(0).toUpperCase() + key.slice(1)
            }));
            if (flag === false) {
              const endDate = new Date();
              const time = endDate.getTime() - beginDate.getTime();
              this.queryHistory.push(this.sqlQuery + " time:" + time);
            }
            this.sqlList = res.data.data.insertStatements
          } else {
            this.$message({ type: 'warning', message: '未查到结果' });
          }
        } else {
          this.$message({ type: 'error', message: res.data.msg });
        }
      } catch (error) {
        this.errorMessage = '请求失败，请稍后重试';
        console.error(error);
      } finally {
        this.fullscreenLoading = false;
      }
    },
    generateInsertStatements() {
      for (let i = 0; i < this.sqlList.length; i++) {
        if (!this.queryHistory.includes(this.sqlList[i])) {
          this.queryHistory.push(this.sqlList[i])
        }
      }

    },
  }
};
</script>

<style scoped>
.sql-input {
  width: 100%;
  margin-bottom: 20px;
}

.result-table {
  margin-top: 20px;
}
.history-box {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  height: 150px;
  overflow-y: auto;
}

.history-box h3 {
  margin: 0 0 10px;
}

.history-box ul {
  list-style-type: none;
  padding: 0;
}
.table-container {
  max-height: 500px; /* 设置最大高度为500px */
  overflow-y: auto; /* 超出部分使用滚动条 */
  position: relative; /* 确保内部元素的定位有效 */
}
.column-cell {
  max-height: 10px; /* 设置最大高度为150px */
  overflow-y: auto; /* 超出部分使用滚动条 */
  white-space: nowrap; /* 防止文本换行 */
  text-overflow: ellipsis; /* 超出部分用省略号表示 */
}
</style>
