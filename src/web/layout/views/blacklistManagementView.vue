<script>
import {eventEmitter} from "../../model/EventEmitter.js";
import ruleUtil from "../../utils/ruleUtil.js";
import {asynchronousIntervalQueue} from "../../model/queue/asynchronousIntervalQueue.js";

//获取黑名单请求队列
const queue = new asynchronousIntervalQueue();

const getData = async (page = 1) => {
  const response = await fetch(`https://api.bilibili.com/x/relation/blacks?pn=${page}&ps=50&jsonp=jsonp`, {
    credentials: 'include'
  })
  if (response.status !== 200) {
    eventEmitter.send('el-msg', '拉取黑名单数据响应失败.')
    return {state: false}
  }
  const resJson = await response.json();
  const {data: {list, total}, message, code} = resJson
  if (code !== 0) {
    eventEmitter.send('el-msg', '请求相应内容失败：code=' + code)
    return {state: false, msg: `请求相应内容失败：msg=${message} code=` + code}
  }
  const newList = list.map(({face, mid, mtime, uname, sign}) => {
    return {face, mid, mtime, uname, sign}
  })
  return {state: true, list: newList, total};
}

/**
 * 黑名单管理组件
 * 管理B站自身的黑名单
 */
export default {
  data() {
    return {
      select: {
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
      },
      total: 0,
      list: [],
      showList: [],
      findVal: '',
      // 请求间隔
      sliderInterval: 0.6,
      isDivLoading: false,
      // 取消列表显示最大限制
      isCancelMaxLimit: false,
      pageSize: 50
    }
  },
  methods: {
    filterTable(list, val) {
      const filter = list.filter(x => {
        const x1 = x[this.select.val];
        if (Number.isInteger(x1)) {
          return x1.toString().includes(val)
        }
        return x1.includes(val);
      });
      if (filter.length === 0) {
        this.$notify({
          title: '没有匹配到数据',
          type: 'warning',
          duration: 2000
        })
        return []
      }
      if (filter.length > 50 && !this.isCancelMaxLimit) {
        this.$notify({
          title: '数据过多，已截取前50条',
          type: 'warning',
          duration: 2000
        })
        return filter.slice(0, 50);
      }
      return filter;
    },
    async getOnePageDataBut() {
      const {state, list, total} = await getData()
      if (!state) {
        return
      }
      this.list = list
      this.showList = list
      this.total = total
      this.$message('获取成功')
    },
    //打开地址
    tableOpenAddressBut(row) {
      GM_openInTab(`https://space.bilibili.com/${row.mid}`)
    },
    tableAddUidBlackBut(row) {
      const uid = row.mid;
      const name = row.uname;
      if (ruleUtil.findRuleItemValue('precise_uid', uid)) {
        this.$message(`该用户:${name}的uid:${uid}已添加过`)
        return;
      }
      this.$confirm(`确定添加${name}的uid:${uid}到uid精确屏蔽吗？`).then(() => {
        ruleUtil.addRulePreciseUid(uid)
      });
      console.log(row)
    },
    outDataToConsoleBut() {
      console.log('黑名单管理列表====start')
      console.log(JSON.parse(JSON.stringify(this.list)));
      console.log('黑名单管理列表====end')
      this.$alert('已导出到控制台，可通过f12查看')
    },
    outDataToFileBut() {
      this.$prompt('请输入文件名', '保存为', {
        inputValue: 'B站黑名单列表'
      }).then(({value}) => {
        if (value.trim() === '') {
          return
        }
        const tempData = {
          total: this.total,
          list: this.list
        }
        const s = JSON.stringify(tempData, null, 4);
        defUtil.fileDownload(s, +value.trim() + '.json')
        this.$alert('已导出到文件，请按需保存')
      })
    },
    async getAllBut() {
      this.isDivLoading = true
      const {state, list, total} = await getData()
      if (!state) return
      if (total === 0) {
        this.isDivLoading = false
        this.$message('没有更多数据了')
        return;
      }
      this.total = total
      const totalPage = Math.ceil(total / 50);
      if (totalPage === 1) {
        //总数量<=50
        this.list = list
        this.isDivLoading = false
        return
      }
      this.list = list;
      //从第二页开始获取
      for (let i = 2; i <= totalPage; i++) {
        const {state, list: resList} = await queue.add(() => getData(i))
        if (!state) return
        list.push(...resList)
      }
      if (this.list.length > 50 && !this.isCancelMaxLimit) {
        this.showList = list.slice(0, 50)
      } else {
        this.showList = list
      }
      this.showList = list
      this.$message('获取成功')
      this.isDivLoading = false
    },
    handleCurrentChange(page) {
      this.showList = this.list.slice((page - 1) * 50, page * 50);
    },
    clearTableBut() {
      this.showList = this.list = []
      this.$message('已清空列表')
    },
    tableAddUidBlackButAll() {
      if (this.list.length === 0) {
        this.$message('列表为空')
        return
      }
      this.$confirm(`确定添加所有用户到uid精确屏蔽吗？`).then(() => {
        if (ruleUtil.addPreciseUidItemRule(this.list.map(x => x.mid), true, false)) {
          eventEmitter.send('刷新规则信息')
        }
      });
    }
  },
  watch: {
    findVal(n) {
      this.showList = this.filterTable(this.list, n)
    },
    sliderInterval(n) {
      queue.setInterval(n * 1000)
    },
    isCancelMaxLimit(n) {
      this.pageSize = n ? 1000000 : 50
    }
  },
  created() {
    queue.setInterval(this.sliderInterval * 1000)
  }
}
</script>
<template>
  <div class="blacklist-container">
    <div class="bl-desc">
      读取B站黑名单（
      <el-link href="https://account.bilibili.com/account/blacklist" target="_blank" type="primary">官方页面</el-link>
      ），需登录
    </div>
    <el-card v-loading="isDivLoading" element-loading-text="加载中" shadow="never">
      <template #header>
        <div class="bl-header">
          <div class="bl-stats-row">
            <el-badge :value="total">
              <el-tag size="small">累计</el-tag>
            </el-badge>
            <el-badge :value="showList.length">
              <el-tag size="small">显示</el-tag>
            </el-badge>
            <span class="bl-label">请求间隔</span>
            <el-slider v-model="sliderInterval" max="10" step="0.1" class="bl-slider"/>
            <span class="bl-slider-val">{{ sliderInterval }}s</span>
          </div>
          <div class="bl-actions-row">
            <el-button size="small" @click="getOnePageDataBut">获取第一页</el-button>
            <el-button size="small" @click="getAllBut">获取全部</el-button>
            <el-button size="small" type="warning" @click="clearTableBut">清空</el-button>
            <el-button size="small" @click="outDataToConsoleBut">导出控制台</el-button>
            <el-button size="small" @click="outDataToFileBut">导出文件</el-button>
            <el-divider direction="vertical"/>
            <el-switch v-model="isCancelMaxLimit" active-text="取消50条限制" size="small"/>
            <el-select v-model="select.val" size="small" class="bl-select">
              <el-option v-for="item in select.options" :key="item.value"
                         :label="item.label" :value="item.value"/>
            </el-select>
            <el-input v-model="findVal" size="small" placeholder="过滤..." class="bl-filter-input"/>
          </div>
        </div>
      </template>
      <el-table :data="showList" border stripe size="small">
        <el-table-column label="时间" prop="mtime" width="150px">
          <template v-slot="scope">
            {{ new Date(scope.row.mtime * 1000).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="头像" width="50px">
          <template v-slot="scope">
            <el-avatar :src="scope.row.face" size="small" shape="square"/>
          </template>
        </el-table-column>
        <el-table-column label="用户名" prop="uname" width="160px"/>
        <el-table-column label="UID" prop="mid" width="160px"/>
        <el-table-column label="签名" prop="sign" min-width="120px"/>
        <el-table-column label="操作" width="200px">
          <template #header>
            <el-button size="mini" @click="tableAddUidBlackButAll">一键屏蔽</el-button>
          </template>
          <template v-slot="scope">
            <el-button size="mini" @click="tableOpenAddressBut(scope.row)">空间</el-button>
            <el-button size="mini" @click="tableAddUidBlackBut(scope.row)">屏蔽</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
          :page-size="pageSize"
          :total="list.length"
          background
          layout="prev, pager, next"
          @current-change="handleCurrentChange"
          size="small"
          class="bl-pagination"
      />
    </el-card>
  </div>
</template>

<style>
/* ---- blacklistManagementView ---- */
/* unscoped; all classes use bl- prefix for isolation */

.bl-desc {
  color: #9499A0;
  font-size: 12px;
  margin-bottom: 10px;
  line-height: 1.6;
}

.bl-header {
  font-size: 13px;
}

.bl-stats-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.bl-label {
  font-size: 12px;
  color: #9499A0;
}

.bl-slider {
  width: 120px;
  display: inline-block;
}

.bl-slider-val {
  font-size: 12px;
}

.bl-actions-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.bl-select {
  width: 100px;
}

.bl-filter-input {
  width: 140px;
}

.bl-pagination {
  margin-top: 12px;
}
</style>
