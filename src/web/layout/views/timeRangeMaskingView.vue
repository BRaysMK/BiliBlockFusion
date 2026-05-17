<script>
import localMKData from "../../data/localMKData.js";
import time_range_masking_table_vue from "./timeRangeMaskingTableView.vue";

/**
 * 时间范围屏蔽组件
 */
export default {
  components: {time_range_masking_table_vue},
  data() {
    return {
      status: localMKData.isTimeRangeMaskingStatus()
    }
  },
  watch: {
    status(n) {
      this.$notify({
        message: n ? '时间范围屏蔽已开启' : '时间范围屏蔽已关闭',
        type: n ? 'success' : 'warning'
      })
      GM_setValue('time_range_masking_status', n)
    }
  }
}
</script>
<template>
  <div>
    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span>时间范围</span>
          <el-switch v-model="status" active-text="总开关"/>
        </div>
      </template>
      <el-collapse style="margin:0;">
        <el-collapse-item title="使用说明">
          <div style="font-size:12px;color:#9499A0;">
            <p>不能添加重复或包含在已有范围内的时间段</p>
            <p>修改/删除自动保存，每条可独立开关</p>
            <p>总开关优先级最高，关闭则全部不生效</p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
    <time_range_masking_table_vue/>
  </div>
</template>
