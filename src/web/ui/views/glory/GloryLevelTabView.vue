<script setup lang="ts">
import {computed, ref} from 'vue'
import {eventEmitter} from "@/core/EventEmitter.ts";
import localMKData from "../../../state/localMKData.ts";
import GloryLevelLimitTabView from "./GloryLevelLimitTabView.vue";
import defUtil from "../../../core/util/defUtil.ts";
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus';
import SettingGroup from '../../components/SettingGroup.vue';

const imgList = ref<any[]>([]);
const mappingList = ref<any[]>([]);
const selectLevel = ref(-1);

const mappingToLevelBut = (src: any) => {
  const tempSelectLevel = selectLevel.value;
  if (tempSelectLevel === -1) return;
  if (mappingList.value[tempSelectLevel - 1].src === "") {
    mappingList.value[tempSelectLevel - 1].src = src;
  } else {
    ElMessageBox.confirm(`是要覆盖${tempSelectLevel}等级的映射url吗？`).then(() => {
      mappingList.value[tempSelectLevel - 1].src = src;
    });
  }
};
const promptMappingToLevelBut = (src: any) => {
  ElMessageBox.prompt("输入要映射的等级", {
    title: "映射等级",
    inputPattern: /^(?:[1-9]|[1-7][0-9]|80)$/,
    inputValue: String(selectLevel.value),
  }).then(({value}: any) => {
    value = parseInt(value);
    if (!(value >= 1 && value <= 80)) {
      ElMessage.warning("请输入范围1~80的正确的等级");
      return;
    }
    selectLevel.value = value;
    mappingToLevelBut(src);
  });
};
const inputMappingUrlBut = (row: any) => {
  const url = row.src;
  const level = row.level;
  ElMessageBox.prompt(`编辑等级${level}的映射url`, {
    inputValue: url,
    title: `编辑映射url`,
    inputPattern: /^https?:\/\/.+/,
  }).then(({value}: any) => {
    if (!value.startsWith('https://')) {
      ElMessage.warning("请输入正确的url");
      return;
    }
    row.src = value;
  });
};
const selectRow = (row: any) => {
  selectLevel.value = row.level;
};
const saveBut = () => {
  GM_setValue('glory_level_mapping_list_gm', mappingList.value.filter(item => item.src));
  ElMessage.success("保存成功");
};
const refreshMappingList = () => {
  const listGm = localMKData.getGloryLevelMappingListGm();
  mappingList.value = [];
  for (let i = 1; i <= 80; i++) {
    const find = listGm.find(item => item.level === i);
    if (find) {
      mappingList.value.push(find);
      continue;
    }
    mappingList.value.push({level: i, src: ''});
  }
};
const clearBut = () => {
  ElMessageBox.confirm("是要清空所有等级的映射关系吗？").then(() => {
    mappingList.value = [];
    ElNotification({title: '', message: '已清空所有等级的映射关系，需手动点击保存配置', type: 'success'});
  });
};
const exportMapUrlBut = () => {
  const toRaw = defUtil.toRaw(mappingList.value.filter(item => item.src));
  defUtil.saveTextAsFile(JSON.stringify(toRaw), '荣耀等级映射关系列表.json');
  ElNotification({title: '', message: "已导出映射关系文件", position: "bottom-right"});
};
const importMapUrlBut = () => {
  ElMessageBox.prompt("粘贴荣耀等级映射内容到输入框中", {
    title: "导入荣耀等级映射列表",
    inputPlaceholder: "格式为json列表",
    //json类验证
    inputPattern: /^(\{.*}|\[.*])$/
  }).then(({value}: any) => {
    let parse: any[];
    try {
      parse = JSON.parse(value);
    } catch (e) {
      ElMessage.warning('导入的内容有误：不是合法的 JSON');
      return;
    }
    if (!Array.isArray(parse) || parse.some(item => !(Number(item?.level) >= 1 && Number(item?.level) <= 80))) {
      ElMessage.warning('导入的内容有误：每项需包含 1~80 的 level 字段');
      return;
    }
    for (const item of parse) {
      const target = mappingList.value.find(m => m.level === Number(item.level));
      if (target !== undefined) target.src = String(item.src ?? '');
    }
    ElMessage.success('已导入映射关系，需手动点击保存配置');
  });
};

const mappingLevelCount = computed(() => {
  return mappingList.value.filter(item => item.src).length;
});

refreshMappingList();
eventEmitter.on('event:更新荣耀等级图片链接列表', (dataList: any[]) => {
  for (const src of dataList) {
    if (imgList.value.includes(src)) continue;
    if (mappingList.value.some(item => item.src === src)) continue;
    imgList.value.push(src);
  }
});
</script>

<template>
  <!-- 原来是三栏 span=8：在 452px 的标签页里每栏只有 140px，
       表头和等级文字被压成一列单字。改成纵向三段，每段撑满宽度。 -->
  <SettingGroup description="按房间单独限制，房间号填 0 表示全部直播间。等级小于等于设定值时屏蔽，点击保存才生效"
                 title="荣誉等级限制">
    <GloryLevelLimitTabView/>
  </SettingGroup>

  <SettingGroup description="先点表格行选中等级，再点图标上的「映射到此等级」绑定。改动需点保存"
                 title="荣耀等级图标映射">
    <div class="gz-glory__toolbar">
      <span class="gz-glory__count">{{ mappingLevelCount }} / {{ mappingList.length }} 已映射</span>
      <div class="gz-glory__actions">
        <el-button size="small" @click="importMapUrlBut">导入</el-button>
        <el-button size="small" @click="exportMapUrlBut">导出</el-button>
        <el-button size="small" @click="refreshMappingList">刷新</el-button>
        <el-button size="small" type="danger" plain @click="clearBut">清除</el-button>
        <el-button size="small" type="primary" @click="saveBut">保存</el-button>
      </div>
    </div>
    <el-table :data="mappingList" border height="400" highlight-current-row @row-click="selectRow">
      <el-table-column label="等级" prop="level" width="64"/>
      <el-table-column label="预览" width="72">
        <template #default="scope">
          <el-image v-if="scope.row.src !== ''" :src="scope.row.src" class="gz-glory__preview"/>
          <span v-else class="gz-glory__empty">—</span>
        </template>
      </el-table-column>
      <el-table-column label="映射 url">
        <template #default="scope">
          <div class="gz-glory__url" @click="inputMappingUrlBut(scope.row)">
            {{ scope.row.src ? scope.row.src : '点击设置' }}
          </div>
        </template>
      </el-table-column>
    </el-table>
  </SettingGroup>

  <SettingGroup :description="`弹幕列表中已采集到 ${imgList.length} 个等级图标，点图标即可映射到选中的等级`"
                title="直播间采集到的图标">
    <div v-if="imgList.length === 0" class="gz-glory__empty">
      还没有采集到图标，进入有荣耀等级弹幕的直播间后这里会出现
    </div>
    <div v-else class="gz-glory__images">
      <button v-for="src in imgList"
              :key="src"
              class="gz-glory__image-btn"
              type="button"
              @click="promptMappingToLevelBut(src)">
        <el-image :src="src" class="gz-glory__preview"/>
      </button>
    </div>
  </SettingGroup>
</template>

<style scoped>
.gz-glory__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fluent-spacing-horizontal-s);
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
  flex-wrap: wrap;
}

.gz-glory__count {
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-3);
}

.gz-glory__actions {
  display: flex;
  gap: var(--fluent-spacing-horizontal-xs);
}

.gz-glory__preview {
  height: 26px;
}

.gz-glory__url {
  min-height: 22px;
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-2);
  word-break: break-all;
  cursor: pointer;
}

.gz-glory__empty {
  padding: var(--fluent-spacing-vertical-s) var(--fluent-spacing-horizontal-s);
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-4);
}

.gz-glory__images {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fluent-spacing-horizontal-s);
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
}

.gz-glory__image-btn {
  padding: 4px;
  border: var(--fluent-stroke-width-thin) solid var(--fluent-color-neutral-stroke-2);
  border-radius: var(--fluent-border-radius-medium);
  background: var(--fluent-color-neutral-background-1);
  cursor: pointer;
}

.gz-glory__image-btn:hover {
  border-color: var(--fluent-color-brand-stroke-1);
}
</style>
