<script setup lang="ts">
import {reactive, ref, watch} from 'vue';
import {eventEmitter} from "@/core/EventEmitter.ts";
import ruleUtil from "../../core/util/ruleUtil.ts";
import defUtil from "../../core/util/defUtil.ts";
import {asynchronousIntervalQueue} from "@/core/cache/asynchronousIntervalQueue.ts";
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus';

//获取黑名单请求队列
const queue = new asynchronousIntervalQueue();

const getData = async (page = 1) => {
  const response = await fetch(`https://api.bilibili.com/x/relation/blacks?pn=${page}&ps=50&jsonp=jsonp`, {
    credentials: 'include'
  });
  if (response.status !== 200) {
    eventEmitter.send('el-msg', '拉取黑名单数据响应失败.');
    return {state: false};
  }
  const resJson = await response.json();
  const {data: {list, total}, message, code} = resJson;
  if (code !== 0) {
    eventEmitter.send('el-msg', '请求相应内容失败：code=' + code);
    return {state: false, msg: `请求相应内容失败：msg=${message} code=` + code};
  }
  const newList = list.map(({face, mid, mtime, uname, sign}: any) => {
    return {face, mid, mtime, uname, sign};
  });
  return {state: true, list: newList, total};
};

/**
 * 黑名单管理组件
 * 管理B站自身的黑名单
 */
const select = reactive({
  val: 'uname',
  options: [{
    label: "用户UID",
    value: 'mid',
  }, {
    label: "用户名",
    value: 'uname',
  }, {
    label: '用户签名',
    value: 'sign'
  }]
});
const total = ref(0);
const list = ref<any[]>([]);
const showList = ref<any[]>([]);
const findVal = ref('');
const isDivLoading = ref(false);
// 取消列表显示最大限制
const isCancelMaxLimit = ref(false);
const pageSize = ref(50);

const filterTable = (dataList: any, val: any) => {
  const filter = dataList.filter((x: any) => {
    const x1 = x[select.val];
    if (Number.isInteger(x1)) {
      return x1.toString().includes(val);
    }
    return x1.includes(val);
  });
  if (filter.length === 0) {
    ElNotification({
      title: '没有匹配到数据',
      message: '',
      type: 'warning',
      duration: 2000
    });
    return [];
  }
  if (filter.length > 50 && !isCancelMaxLimit.value) {
    ElNotification({
      title: '数据过多，已截取前50条',
      message: '',
      type: 'warning',
      duration: 2000
    });
    return filter.slice(0, 50);
  }
  return filter;
};
const getOnePageDataBut = async () => {
  const {state, list: resList, total: resTotal} = await getData();
  if (!state) {
    return;
  }
  list.value = resList;
  showList.value = resList;
  total.value = resTotal;
  ElMessage('获取成功');
};
//打开地址
const tableOpenAddressBut = (row: any) => {
  GM_openInTab(`https://space.bilibili.com/${row.mid}`);
};
const tableAddUidBlackBut = (row: any) => {
  const uid = row.mid;
  const name = row.uname;
  if (ruleUtil.findRuleItemValue('precise_uid', uid)) {
    ElMessage(`该用户:${name}的uid:${uid}已添加过`);
    return;
  }
  ElMessageBox.confirm(`确定添加${name}的uid:${uid}到uid精确屏蔽吗？`).then(() => {
    ruleUtil.addRulePreciseUid(uid);
  });
  console.log(row);
};
const outDataToConsoleBut = () => {
  console.log('黑名单管理列表====start');
  console.log(JSON.parse(JSON.stringify(list.value)));
  console.log('黑名单管理列表====end');
  ElMessageBox.alert('已导出到控制台，可通过f12查看');
};
const outDataToFileBut = () => {
  ElMessageBox.prompt('请输入文件名', '保存为', {
    inputValue: 'B站黑名单列表'
  }).then(({value}: any) => {
    if (value.trim() === '') {
      return;
    }
    const tempData = {
      total: total.value,
      list: list.value
    };
    const s = JSON.stringify(tempData, null, 4);
    defUtil.fileDownload(s, value.trim() + '.json');
    ElMessageBox.alert('已导出到文件，请按需保存');
  });
};
const getAllBut = async () => {
  isDivLoading.value = true;
  const {state, list: resList, total: resTotal} = await getData();
  if (!state) return;
  if (resTotal === 0) {
    isDivLoading.value = false;
    ElMessage('没有更多数据了');
    return;
  }
  total.value = resTotal;
  const totalPage = Math.ceil(resTotal / 50);
  if (totalPage === 1) {
    //总数量<=50
    list.value = resList;
    isDivLoading.value = false;
    return;
  }
  list.value = resList;
  //从第二页开始获取
  for (let i = 2; i <= totalPage; i++) {
    const {state: pageState, list: pageList} = await queue.add(() => getData(i));
    if (!pageState) return;
    resList.push(...pageList);
  }
  if (list.value.length > 50 && !isCancelMaxLimit.value) {
    showList.value = resList.slice(0, 50);
  } else {
    showList.value = resList;
  }
  showList.value = resList;
  ElMessage('获取成功');
  isDivLoading.value = false;
};
const handleCurrentChange = (page: number) => {
  showList.value = list.value.slice((page - 1) * 50, page * 50);
};
const clearTableBut = () => {
  list.value = [];
  showList.value = [];
  ElMessage('已清空列表');
};
const tableAddUidBlackButAll = () => {
  if (list.value.length === 0) {
    ElMessage('列表为空');
    return;
  }
  ElMessageBox.confirm(`确定添加所有用户到uid精确屏蔽吗？`).then(() => {
    if (ruleUtil.addPreciseUidItemRule(list.value.map(x => x.mid), true, false)) {
      eventEmitter.send('刷新规则信息');
    }
  });
};

watch(findVal, (n) => {
  showList.value = filterTable(list.value, n);
});
watch(isCancelMaxLimit, (n) => {
  pageSize.value = n ? 1000000 : 50;
});

// 拉取黑名单是低频操作（一次几十页），固定间隔即可；
// 与「高级 → 面板与条件 → 请求间隔」共用一个网络节流语义，不再单独暴露设置项。
queue.setInterval(600);
</script>
<template>
  <div class="gz-blacklist">
    <div class="gz-blacklist__hint">
      B 站自身的黑名单（<el-link href="https://account.bilibili.com/account/blacklist" target="_blank" type="primary">
      账号黑名单管理</el-link>），需要登录后才能拉取。可把这里的用户一键搬进本脚本的 uid 精确屏蔽规则。
    </div>
    <div class="gz-blacklist__toolbar">
      <el-badge :value="total">
        <el-tag size="small">累计</el-tag>
      </el-badge>
      <el-badge :value="showList.length">
        <el-tag size="small">显示</el-tag>
      </el-badge>
      <div class="gz-blacklist__actions">
        <el-button size="small" @click="getOnePageDataBut">取第一页</el-button>
        <el-button size="small" @click="getAllBut">取全部</el-button>
        <el-dropdown size="small" trigger="click" @command="(cmd: string) => (cmd === 'file' ? outDataToFileBut() : outDataToConsoleBut())">
          <el-button size="small">导出</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="file">下载为 json 文件</el-dropdown-item>
              <el-dropdown-item command="console">打印到控制台</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" type="danger" plain @click="clearTableBut">清空</el-button>
      </div>
    </div>
    <div class="gz-blacklist__toolbar">
      <el-switch v-model="isCancelMaxLimit" active-text="取消列表显示最大限制" size="small"/>
      <div class="gz-blacklist__actions">
        <el-select v-model="select.val" class="gz-blacklist__field-select" size="small">
          <el-option
              v-for="item in select.options"
              :key="item.value"
              :label="item.label"
              :value="item.value">
          </el-option>
        </el-select>
        <el-input v-model="findVal" class="gz-blacklist__find" clearable placeholder="按所选字段过滤" size="small"/>
      </div>
    </div>
    <!-- 内容区只有 420px：时间 / 头像 / 姓名 / uid / 签名 / 操作 六列并排要 640px。
         头像并进姓名列，签名收进姓名悬停气泡，四列正好放下。 -->
    <el-table v-loading="isDivLoading" :data="showList" border element-loading-text="正在拉取黑名单" size="small"
              stripe>
      <el-table-column label="拉黑时间" prop="mtime" width="96">
        <template #default="scope">
          {{ new Date(scope.row.mtime * 1000).toLocaleDateString() }}
        </template>
      </el-table-column>
      <el-table-column label="用户" min-width="130">
        <template #default="scope">
          <el-tooltip :content="scope.row.sign === '' ? '（无签名）点名字打开主页' : scope.row.sign + '（点名字打开主页）'"
                      placement="top">
            <div class="gz-blacklist__user" @click="tableOpenAddressBut(scope.row)">
              <el-avatar :size="22" :src="scope.row.face" shape="square"/>
              <span class="gz-blacklist__user-name">{{ scope.row.uname }}</span>
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="用户 ID" prop="mid" width="96"/>
      <el-table-column width="96">
        <template #default="scope">
          <el-button size="small" @click="tableAddUidBlackBut(scope.row)">加入屏蔽</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="gz-blacklist__footer">
      <el-button size="small" type="primary" @click="tableAddUidBlackButAll">一键把当前列表加入 uid 屏蔽</el-button>
      <el-pagination
          :page-size="pageSize"
          :total="list.length"
          background
          layout="prev, pager, next"
          small
          @current-change="handleCurrentChange"
      >
      </el-pagination>
    </div>
  </div>
</template>

<style scoped>
.gz-blacklist__user {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-xs);
  min-width: 0;
  cursor: pointer;
}

.gz-blacklist__user-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.gz-blacklist__hint {
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
  font-size: var(--fluent-font-size-base-200);
  line-height: 1.6;
  color: var(--fluent-color-neutral-foreground-3);
}

.gz-blacklist__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--fluent-spacing-horizontal-s);
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
}

.gz-blacklist__actions {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-xs);
  flex-wrap: wrap;
  margin-left: auto;
}

/* EP 给相邻按钮加 margin-left，放进 flex 容器后会破坏对齐 */
.gz-blacklist__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.gz-blacklist__field-select {
  width: 108px;
}

.gz-blacklist__find {
  width: 180px;
}

.gz-blacklist__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--fluent-spacing-horizontal-s);
  padding: var(--fluent-spacing-vertical-s) var(--fluent-spacing-horizontal-s);
}
</style>
