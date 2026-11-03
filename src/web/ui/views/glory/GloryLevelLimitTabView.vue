<script setup lang="ts">
import {ref} from 'vue'
import localMKData from "../../../state/localMKData.ts";
import {ElMessage, ElMessageBox} from 'element-plus';

const dataList = ref<any[]>([]);

const refresh = (tip = false) => {
  dataList.value = localMKData.getGloryLevelLimitListGm();
  tip && ElMessage.success("刷新成功");
};
const updateRoomIdRowBut = (row: any) => {
  const roomId = row.roomId;
  ElMessageBox.prompt("请输入房间号", {
    title: "修改房间号",
    inputPattern: /^[0-9]\d*$/,
    inputValue: roomId,
  }).then(({value}: any) => {
    value = parseInt(value);
    if (!(value >= 0)) {
      ElMessage.warning("请输入正确的房间号");
      return updateRoomIdRowBut(row);
    }
    if (dataList.value.some(item => item.roomId === value)) {
      ElMessage.warning("已存在该房间号");
      return updateRoomIdRowBut(row);
    }
    row.roomId = value;
  });
};
const delBut = (row: any) => {
  const roomId = row.roomId;
  if (roomId === "0" || roomId === 0) {
    ElMessage.warning("全局设置不可删除");
    return;
  }
  ElMessageBox.confirm(`是要删除该房间号配置吗？【${roomId}】`).then(() => {
    dataList.value = dataList.value.filter(item => item !== row);
  });
};
const addBut = () => {
  ElMessageBox.prompt("请输入房间号，添加之后需要手动设置对应的状态(开关)", {
    title: "添加房间号",
    inputPattern: /^[1-9]\d*$/,
  }).then(({value}: any) => {
    value = parseInt(value);
    if (!(value >= 1)) {
      ElMessage.warning("请输入正确的房间号");
      return addBut();
    }
    if (dataList.value.some(item => item.roomId === value)) {
      ElMessage.warning("已存在该房间号");
      return addBut();
    }
    dataList.value.push({roomId: value, limitLevel: 0, status: false});
  });
};
const saveBut = () => {
  GM_setValue('glory_level_limit_list_gm', dataList.value);
  ElMessage.success("保存成功");
};

refresh();
</script>

<template>
  <div class="gz-glory-limit">
    <div class="gz-glory-limit__toolbar">
      <div class="gz-glory-limit__actions">
        <el-button size="small" type="primary" @click="addBut">新增房间</el-button>
        <el-button size="small" @click="refresh(true)">刷新</el-button>
        <el-button size="small" type="success" @click="saveBut">保存</el-button>
      </div>
    </div>
    <el-table :data="dataList" border size="small">
      <el-table-column label="房间号" width="96">
        <template #default="scope">
          <span v-if="scope.row.roomId===0||scope.row.roomId==='0'">全局</span>
          <div v-else class="gz-glory-limit__cell" @click="updateRoomIdRowBut(scope.row)">
            {{ scope.row.roomId }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="限制等级" width="108">
        <template #default="scope">
          <el-input-number v-model="scope.row.limitLevel" :max="80" :min="1" class="gz-glory-limit__number"
                           controls-position="right" size="small"/>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="56">
        <template #default="scope">
          <el-switch v-model="scope.row.status" size="small"/>
        </template>
      </el-table-column>
      <el-table-column>
        <template #default="scope">
          <el-button v-if="scope.row.roomId!==0" size="small" @click="updateRoomIdRowBut(scope.row)">改房间号</el-button>
          <el-button size="small" type="danger" plain @click="delBut(scope.row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.gz-glory-limit {
  padding: 0 var(--fluent-spacing-horizontal-s);
}

.gz-glory-limit__toolbar {
  display: flex;
  justify-content: flex-end;
  padding: var(--fluent-spacing-vertical-xs) 0;
}

.gz-glory-limit__actions {
  display: flex;
  gap: var(--fluent-spacing-horizontal-xs);
}

.gz-glory-limit__cell {
  cursor: pointer;
}

/* 默认 150px 会把「限制等级」列撑到溢出，收窄到列宽以内 */
.gz-glory-limit__number {
  width: 100%;
}
</style>
