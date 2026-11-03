<script setup lang="ts">
import {ref} from 'vue'
import defUtil from "../../../core/util/defUtil.ts";
import localMKData from "../../../state/localMKData.ts";
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus';
import SettingGroup from '../../components/SettingGroup.vue';

const dataList = ref<any[]>([]);

const refresh = (tip = false) => {
  dataList.value = localMKData.getFansLevelLimitListGm();
  tip && ElMessage.success("刷新成功");
};
const saveBut = () => {
  const raw = defUtil.toRaw(dataList.value);
  GM_setValue('fans_level_limit_list_gm', raw);
  ElNotification({title: '', message: "已保存", position: "bottom-right"});
};
const addBut = () => {
  ElMessageBox.prompt("请输入粉丝牌名称", {
    title: "添加粉丝牌",
  }).then(({value}: any) => {
    if (!value) {
      ElMessage.warning("请输入正确的粉丝牌名称");
      return addBut();
    }
    value = value.trim();
    if (value.length > 6) {
      ElMessage.warning("请输入正确的粉丝牌名称");
      return addBut();
    }
    if (dataList.value.some(item => item.name === value)) {
      ElMessage.warning("已存在该粉丝牌名称");
      return addBut();
    }
    dataList.value.push({name: value, limitLevel: 0, status: false});
  });
};
const delBut = (row: any) => {
  ElMessageBox.confirm(`是要删除该粉丝牌配置吗？【${row.name}】`).then(() => {
    dataList.value = dataList.value.filter(item => item !== row);
    ElNotification({title: '', message: "已删除", position: "bottom-right"});
  });
};
const setFansNameBut = (row: any) => {
  ElMessageBox.prompt("请输入新的粉丝牌名称", {
    title: "修改粉丝牌名称",
    inputValue: row.name,
  }).then(({value}: any) => {
    if (value === undefined || value.trim() === '') {
      ElMessage.warning("内容不可为空");
      return setFansNameBut(row);
    }
    value = value.trim();
    if (value.length > 6) {
      ElMessage.warning("请输入正确的粉丝牌名称");
      return setFansNameBut(row);
    }
    if (dataList.value.some(item => item.name === value)) {
      ElMessage.warning("已存在该粉丝牌名称");
      return setFansNameBut(row);
    }
    row.name = value;
  });
};

refresh();
</script>

<template>
  <!-- 原来表格只占 span=8（140px），「粉丝牌 / 限制等级 / 状态 / 操作」四列挤在一起，
       而 span=16 的说明卡片里其实只有一行字和三个按钮。改成表格占满、按钮移出表头。 -->
  <SettingGroup description="仅对直播间弹幕列表生效，修改、删除和新增后需手动保存" title="粉丝牌等级限制">
    <div class="gz-fan-card__toolbar">
      <el-button size="small" type="primary" @click="addBut">添加</el-button>
      <el-button size="small" @click="refresh(true)">刷新</el-button>
      <el-button size="small" type="success" @click="saveBut">保存</el-button>
    </div>
    <el-table :data="dataList" border size="small" empty-text="还没有配置粉丝牌">
      <el-table-column label="粉丝牌" prop="name" width="120"/>
      <el-table-column label="限制等级" width="108">
        <template #default="scope">
          <el-input-number v-model="scope.row.limitLevel" :max="100" :min="0" class="gz-fan-card__number"
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
          <el-button size="small" @click="setFansNameBut(scope.row)">改名称</el-button>
          <el-button size="small" type="danger" plain @click="delBut(scope.row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </SettingGroup>
</template>

<style scoped>
.gz-fan-card__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: var(--fluent-spacing-horizontal-xs);
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
}

.gz-fan-card__number {
  width: 100%;
}
</style>
