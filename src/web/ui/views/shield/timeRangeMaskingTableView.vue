<script setup lang="ts">
import {ref} from 'vue';
import localMKData from "../../../state/localMKData.ts";
import {eventEmitter} from "@/core/EventEmitter.ts";
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus';

// 保存表格数据
const saveTable = (tableData: any) => {
  const newList = [];
  for (let {status, r} of tableData) {
    if (r === null) {
      eventEmitter.send('el-alert', '表格内还有未设置时间范围的项，请先设置或删除才可以保存！');
      return;
    }
    const [startTime, endTime] = r;
    newList.push({
      status,
      r: [startTime.getTime(), endTime.getTime()]
    });
  }
  if (newList.length === 0) return;
  GM_setValue('time_range_masking', newList);
  eventEmitter.send('el-notify', {
    title: '保存成功',
    message: '已保存该时间范围屏蔽',
    type: 'success'
  });
};

/**
 * 时间范围屏蔽表格组件
 */
const tableData = ref<any[]>([]);
// Element Plus 快捷选项（datetimerange）
const pickerShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    }
  }
];

//刷新表格数据
const refreshTableData = () => {
  if (tableData.value.length > 0) {
    tableData.value.splice(0, tableData.value.length);
  }
  const timeRangeMaskingArr = localMKData.getTimeRangeMaskingArr();
  if (timeRangeMaskingArr.length !== 0) {
    let index = 0;
    for (let {status, r} of timeRangeMaskingArr) {
      tableData.value.push({
        index: index++,
        status,
        r: [new Date(r[0]), new Date(r[1])],
        // 用于判断是否修改
        startTimeStamp: r[0],
        endTimeStamp: r[1],
      });
    }
  }
};
//恢复上次时间范围
const restoreTheLastTimeRange = (row: any) => {
  // 获取未修改前的时间戳
  let {startTimeStamp, endTimeStamp} = row;
  console.log('上次时间戳', startTimeStamp, endTimeStamp);
  if (startTimeStamp === null || startTimeStamp === undefined) {
    row.r = null;
    return;
  }
  row.r = [new Date(startTimeStamp), new Date(endTimeStamp)];
  console.log('已恢复上次时间范围', row);
};
// 时间选择器改变
const tableDatePickerChange = (row: any) => {
  const rowR = row.r;
  if (rowR === null) return;
  // 获取未修改前的时间戳
  let {oldStartTimeStamp, oldEndTimeStamp} = row;
  // 获取当前项的时间戳
  const newStartTimeStamp = rowR[0].getTime();
  const newEndTimeStamp = rowR[1].getTime();
  // 如果未修改过时间戳，则取当前项的时间戳
  const comparisonSTS = newStartTimeStamp || oldStartTimeStamp;
  const comparisonETS = newEndTimeStamp || oldEndTimeStamp;
  // 如果未修改过时间戳，则取当前项的时间戳
  for (let v of tableData.value) {
    //跳过时间范围为空的项
    if (v.r === null) continue;
    // 跳过当前项
    if (v.index === row.index) continue;
    const tempStartTimeStamp = v.r[0].getTime();
    const tempEndTimeStamp = v.r[1].getTime();
    if (tempStartTimeStamp === comparisonSTS && tempEndTimeStamp === comparisonETS) {
      ElMessageBox.alert('已存在该时间范围屏蔽');
      restoreTheLastTimeRange(row);
      return;
    }
    if (comparisonSTS >= tempStartTimeStamp && comparisonETS <= tempEndTimeStamp) {
      ElMessageBox.alert('小于已添加过的时间范围');
      restoreTheLastTimeRange(row);
      return;
    }
  }
  //更新时间戳
  row.startTimeStamp = newStartTimeStamp;
  row.endTimeStamp = newEndTimeStamp;
  saveTable(tableData.value);
};
// 开关改变
const tableSwitchChange = (row: any) => {
  if (row.r === null) return;
  saveTable(tableData.value);
};
const addBut = () => {
  const length = tableData.value.length;
  tableData.value.push({
    index: length, status: true, r: null,
    startTimeStamp: null, endTimeStamp: null
  });
  ElNotification({title: '', message: '已添加一条时间范围屏蔽到底部'});
};
const delItemBut = (row: any) => {
  // 刚添加的项未设置时间戳，则直接删除
  if (row.startTimeStamp === null) {
    tableData.value.splice(row.index, 1);
    return;
  }
  for (let {r} of tableData.value) {
    if (r === null) {
      ElMessageBox.alert('表格内还有未设置时间范围的项，请先设置或删除才可以保存！');
      return;
    }
  }
  ElMessageBox.confirm('确定删除该条时间范围屏蔽吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    tableData.value.splice(row.index, 1);
    saveTable(tableData.value);
    ElMessage({
      type: 'success',
      message: '删除成功!'
    });
  });
};
const saveTableBut = () => {
  saveTable(tableData.value);
};

refreshTableData();
</script>
<template>
  <div class="gz-time-range-table">
    <div class="gz-time-range-table__toolbar">
      <el-button size="small" type="primary" @click="addBut">添加</el-button>
      <el-button size="small" @click="refreshTableData">刷新</el-button>
      <el-button size="small" @click="saveTableBut">保存</el-button>
    </div>
    <!-- 每条范围两行：选择器独占一行，开关与删除并排在下一行。
         面板内容区只有 452px，三列并排会把日期选择器压到无法点选。 -->
    <div v-for="row in tableData" :key="row.index" class="gz-time-range-table__item">
      <el-date-picker
          v-model="row.r"
          :shortcuts="pickerShortcuts"
          end-placeholder="结束日期"
          range-separator="至"
          size="small"
          start-placeholder="开始日期"
          type="datetimerange"
          @change="tableDatePickerChange(row)"/>
      <div class="gz-time-range-table__item-footer">
        <el-switch v-model="row.status" active-text="启用" @change="tableSwitchChange(row)"/>
        <el-button size="small" type="danger" plain @click="delItemBut(row)">删除</el-button>
      </div>
    </div>
    <div v-if="tableData.length === 0" class="gz-time-range-table__empty">
      还没有时间范围，点上方「添加」新增一条
    </div>
  </div>
</template>

<style scoped>
.gz-time-range-table {
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
}

.gz-time-range-table__toolbar {
  display: flex;
  gap: var(--fluent-spacing-horizontal-s);
  margin-bottom: var(--fluent-spacing-vertical-s);
}

.gz-time-range-table__item {
  padding: var(--fluent-spacing-vertical-s) 0;
  border-top: var(--fluent-stroke-width-thin) solid var(--fluent-color-neutral-stroke-2);
}

/* datetimerange 默认宽度约 360px，撑满可用宽度才不至于把结束日期挤出去 */
.gz-time-range-table__item :deep(.el-date-editor) {
  width: 100%;
}

.gz-time-range-table__item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--fluent-spacing-vertical-xs);
}

.gz-time-range-table__empty {
  padding: var(--fluent-spacing-vertical-m) 0;
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-4);
}
</style>
