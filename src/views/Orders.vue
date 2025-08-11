<template>
  <el-container>
    <el-header>
      <h1>内部查询系统</h1>
    </el-header>
    <el-main>
      <el-container v-loading.fullscreen.lock="fullscreenLoading">
        <el-input
            v-model="orderNumber"
            placeholder="请输入订查询信息"
            suffix-icon="el-icon-search"
            class="search-input"
        />
        <el-button type="primary" style="margin-left:10px" @click="fetchOrderDetails">查询订单</el-button>
        <el-button type="primary" style="margin-left:10px" @click="fetchSmsCode">查询验证码</el-button>
      </el-container>

      <el-table v-if="orders.length" :data="orders" style="width: 100%" class="order-table">
        <el-table-column prop="id" label="送样id" header-align="center" align="center"/>
        <el-table-column prop="order_id" label="订单id" header-align="center" align="center"/>
        <el-table-column prop="name" label="供应商" header-align="center" align="center"/>
        <el-table-column prop="money" label="订单金额" header-align="center" align="center"/>
        <el-table-column prop="status" label="订单状态" header-align="center" align="center"/>
        <el-table-column prop="settle_sn" label="结算单号" header-align="center" align="center"/>
        <el-table-column prop="created_at" label="订单创建时间" header-align="center" align="center"/>
        <el-table-column label="操作" width="320" header-align="center" align="center">
          <template v-slot="scope">
            <el-button text type="primary" @click="viewOrderLog(scope.row)">日志</el-button>
            <el-button text type="primary" @click="viewSupplier(scope.row)">供应商</el-button>
            <el-button text type="primary" @click="viewSettle(scope.row)">结算单</el-button>
            <el-button text type="primary" @click="viewDispute(scope.row)">争议</el-button>
            <el-button text type="primary" @click="viewSettled(scope.row)">托管结算</el-button>
          </template>
        </el-table-column>

      </el-table>


      <el-dialog v-model="dialogVisible" title="订单日志" @close="closeDialog" v-if="dialogVisible">
        <el-table :data="orderLogs" style="width: 100%">
          <el-table-column prop="created_at" label="日志时间"/>
          <el-table-column prop="ip" label="来源"/>
          <el-table-column prop="desc" label="日志内容"/>
        </el-table>
      </el-dialog>

      <el-dialog v-model="dialogUserVisible" title="供应商信息" width="90%" @close="closeUserDialog" v-if="dialogUserVisible">
        <el-table :data="supplierInfo" style="width: 100%">
          <el-table-column prop="id" label="用户ID"/>
          <el-table-column prop="name" label="用户名"/>
          <el-table-column prop="mobile" label="手机号"/>
          <el-table-column prop="company" label="公司名"/>
          <el-table-column prop="status" label="状态"/>
          <el-table-column prop="is_invoice" label="有无票"/>
          <el-table-column prop="settle_type" label="结算方式"/>
          <el-table-column prop="payment_methods" label="付款方式"/>
          <el-table-column prop="hosting_status" label="托管状态"/>
          <el-table-column prop="settlement_day" label="托管配置天数"/>
          <el-table-column prop="settlement_num" label="托管配置条数"/>
        </el-table>
      </el-dialog>

      <el-dialog v-model="dialogSettleVisible" title="结算单信息" width="70%" @close="closeSettleDialog" v-if="dialogSettleVisible">
        <el-table :data="settleInfo" style="width: 100%">
          <el-table-column prop="settle_sn" label="结算单号"/>
          <el-table-column prop="created_at" label="创建时间"/>
          <el-table-column prop="apply_money" label="结算金额"/>
          <el-table-column prop="money_paid" label="付款金额"/>
          <el-table-column prop="is_hosting" label="是否为托管单"/>
          <el-table-column prop="is_invoice" label="发票类型"/>
          <el-table-column prop="status" label="状态"/>
          <el-table-column prop="back_reason" label="退回原因"/>
          <el-table-column prop="back_at" label="退回时间"/>
          <el-table-column label="操作" width="100">
            <template v-slot="scope">
              <el-button text type="primary" @click="settleDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>


      <el-drawer
          v-model="drawer"
          title="结算单详情"
          direction="rtl"
          size="60%"
          @close="closeDrawer" v-if="drawer"
      >
        <el-table :data="settleDetailList">
          <el-table-column prop="settle_sn" label="结算单号"/>
          <el-table-column prop="order_sn" label="订单号"/>
          <el-table-column prop="order_id" label="订单ID"/>
          <el-table-column prop="id" label="送样ID"/>
          <el-table-column prop="money_total" label="价格"/>
        </el-table>
        <div>总价格: {{ totalMoney }}</div>
      </el-drawer>

      <el-dialog v-model="smsCodeVisible" title="验证码数据" @close="closeSmsCodeVisible" v-if="smsCodeVisible">
          <el-timeline style="max-width: 300px">
            <el-timeline-item
                v-for="(activity, index) in smsCodeList"
                :key="index"
                :timestamp="activity.create_time"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
      </el-dialog>
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
  ElTableColumn,
  ElAlert,
  ElContainer,
  ElHeader,
  ElMain,
  ElDialog,
  ElMessage,
  ElMessageBox
} from 'element-plus';
import axios from "axios";
import {config} from '../../config.js';


export default {
  name: 'OrderManagement',
  components: {
    ElInput,
    ElButton,
    ElTable,
    ElTableColumn,
    ElAlert,
    ElContainer,
    ElHeader,
    ElMain,
    ElDialog,
  },
  data() {
    return {
      orderNumber: '',
      orders: [],
      errorMessage: '',
      dialogVisible: false,
      dialogUserVisible: false,
      dialogSettleVisible: false,
      orderLogs: [],
      supplierInfo: [],
      settleInfo: [],
      settleDetailList: [],
      smsCodeList: [],
      apiUrl: config.apiUrl,
      token: config.token,
      fullscreenLoading: false,
      drawer: false,
      settleSn: '',
      smsCodeVisible: false,
      totalMoney: 0,
    };
  },
  methods: {
    async fetchOrderDetails() {
      this.fullscreenLoading = true;
      this.errorMessage = '';
      this.orders = [];
      try {
        const res = await axios.post(this.apiUrl + '/supplier/inner/order', {
          "order_sn": this.orderNumber,
          "token": this.token
        });
        if (res.data.code === 0) {
          this.orders = res.data.data.length > 0 ? res.data.data : [];
          if (this.orders.length === 0) {
            this.$message({type: 'warning', message: '未查到订单'});
          }
          console.log(this.orders);
        } else {
          this.$message({type: 'error', message: res.data.msg});
        }
        this.fullscreenLoading = false;
      } catch (error) {
        this.errorMessage = '请求失败，请稍后重试';
        console.error(error);
      }
    },
    async fetchSmsCode() {
      try {
        const res = await axios.post(this.apiUrl + '/supplier/inner/sms-code', {
          "phone": this.orderNumber,
          "token": this.token
        });
        if (res.data.code === 0) {
          console.log(res.data.data);
          this.smsCodeList = res.data.data.length > 0 ? res.data.data : [];
          if (this.smsCodeList.length === 0) {
            this.$message({type: 'warning', message: '未查到验证码'});
          } else {
            this.smsCodeVisible = true;
          }
          console.log(this.smsCodeList);
        } else {
          this.$message({type: 'error', message: res.data.msg});
        }
      } catch (error) {
        this.errorMessage = '请求失败，请稍后重试';
        console.error(error);
      }
    },
    async viewDispute(order){
      ElMessageBox.confirm(
          '确定结束当前订单'+ order.order_sn +'争议期嘛',
          '结束争议期提醒',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
      )
          .then(async () => {
            try {
              const res = await axios.post(this.apiUrl + '/supplier/inner/dispute', {
                "order_id": order.order_id,
                "token": this.token
              });
              if (res.data.code === 0) {
                ElMessage({
                  type: 'success',
                  message: order.order_sn + ' 已结束争议期',
                })
              } else {
                this.$message({type: 'error', message: res.data.msg});
              }
              this.fullscreenLoading = false;
            } catch (error) {
              this.errorMessage = '请求失败，请稍后重试';
              console.error(error);
            }

          })
          .catch(() => {
            ElMessage({
              type: 'info',
              message: 'Delete canceled',
            })
          })
    },
    viewSettled(order) {
      ElMessageBox.confirm(
          '确定执行当前供应商结算任务吗',
          '执行托管结算提醒',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
      )
          .then(async () => {
            try {
              const res = await axios.post(this.apiUrl + '/supplier/inner/settled', {
                "user_id": order.user_id,
                "token": this.token
              });
              if (res.data.code === 0) {
                ElMessage({
                  type: 'success',
                  message: '供应商托管结算已完成：' + res.data.data,
                })
              } else {
                this.$message({type: 'error', message: res.data.msg});
              }
              this.fullscreenLoading = false;
            } catch (error) {
              this.errorMessage = '请求失败，请稍后重试';
              console.error(error);
            }

          })
          .catch(() => {
            ElMessage({
              type: 'info',
              message: 'Delete canceled',
            })
          })
    },
    viewOrderLog(order) {
      axios.post(this.apiUrl + '/supplier/inner/order-log', {"order_id": order.order_id, "token": this.token})
          .then(res => {
            if (res.data.code === 0) {
              this.orderLogs = res.data.data || [];
              this.dialogVisible = true;
            } else {
              this.$message({type: 'error', message: res.data.msg});
            }
          })
          .catch(error => {
            console.log(error);
            this.$message({type: 'error', message: '获取订单日志失败'});
          });
    },
    viewSupplier(order) {
      axios.post(this.apiUrl + '/supplier/inner/user', {"id": order.user_id, "token": this.token})
          .then(res => {
            if (res.data.code === 0) {
              this.supplierInfo = res.data.data || [];
              this.dialogUserVisible = true;
            } else {
              this.$message({type: 'error', message: res.data.msg});
            }
          })
          .catch(error => {
            console.log(error);
            this.$message({type: 'error', message: '获取供应商信息失败'});
          });
    },
    viewSettle(order) {
      axios.post(this.apiUrl + '/supplier/inner/settle', {"order_id": order.order_id, "token": this.token})
          .then(res => {
            if (res.data.code === 0) {
              this.settleInfo = res.data.data || [];
              this.dialogSettleVisible = true;
            } else {
              this.$message({type: 'error', message: res.data.msg});
            }
          })
          .catch(error => {
            console.log(error);
            this.$message({type: 'error', message: '获取结算单失败'});
          });
    },
    settleDetail(order) {
      axios.post(this.apiUrl + '/supplier/inner/settle-detail', {"settle_sn": order.settle_sn, "token": this.token})
          .then(res => {
            if (res.data.code === 0) {
              this.settleDetailList = res.data.data || [];
              this.drawer = true;
              this.settleSn = order.settle_sn;
              let totalMoney = 0;
              for (let i = 0; i < this.settleDetailList.length; i++) {
                totalMoney += parseFloat(this.settleDetailList[i].money_total); // 累加每个项的 money_total
              }

              // 输出总和，可以根据需要进行处理
              console.log('总价格:', totalMoney);
              this.totalMoney = totalMoney;


            } else {
              this.$message({type: 'error', message: res.data.msg});
            }
          })
          .catch(error => {
            console.log(error);
            this.$message({type: 'error', message: '获取结算单详情失败'});
          });
    },
    closeDialog() {
      this.dialogVisible = false;
      this.orderLogs = []; // 清空日志数据
    },
    closeUserDialog() {
      this.dialogUserVisible = false;
      this.supplierInfo = [];
    },
    closeSettleDialog() {
      this.dialogSettleVisible = false;
      this.settleInfo = [];
    },
    closeDrawer() {
      this.drawer = false;
      this.settleDetailList = [];
    },
    closeSmsCodeVisible() {
      this.smsCodeVisible = false;
      this.smsCodeList = []
    },
    calculateTotalMoney() {
      return this.settleDetailList.reduce((total, item) => {
        return total + item.money_total;
      }, 0);
    }
  }

};
</script>

<style scoped>
.search-input {
  width: 300px;
  margin-bottom: 20px;
}

.order-table {
  margin-top: 20px;
}
</style>
