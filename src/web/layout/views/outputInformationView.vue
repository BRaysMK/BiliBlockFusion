<script>
import {eventEmitter} from "../../model/EventEmitter.js";
import defUtil from "../../utils/defUtil.js";

export default {
  data() {
    return {
      outputInfoArr: [],
    }
  },
  methods: {
    clearInfoBut() {
      this.$confirm('是否清空信息', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.outputInfoArr = [];
        this.$notify({ message: '已清空信息', type: 'success' })
      })
    },
    addEntry(entry) {
      if (entry.id) {
        const idx = this.outputInfoArr.findIndex(item => item.id === entry.id);
        if (idx !== -1) {
          const item = this.outputInfoArr[idx];
          item.count++;
          item.time = defUtil.toTimeString();
          this.outputInfoArr.splice(idx, 1);
          this.outputInfoArr.unshift(item);
          return;
        }
      }
      if (entry.content !== undefined) {
        const idx = this.outputInfoArr.findIndex(item => item.content === entry.content);
        if (idx !== -1) {
          const item = this.outputInfoArr[idx];
          item.count++;
          item.time = defUtil.toTimeString();
          this.outputInfoArr.splice(idx, 1);
          this.outputInfoArr.unshift(item);
          return;
        }
      }
      entry.time = defUtil.toTimeString();
      entry.count = 1;
      this.outputInfoArr.unshift(entry);
    }
  },
  created() {
    eventEmitter.on('打印信息', (content) => {
      this.addEntry({ category: 'info', content: content.replace(/<[^>]*>/g, '') })
    })
    eventEmitter.on('event-update-out-info', (data) => {
      this.addEntry({ category: 'info', id: data.id, content: data.msg })
    })
    eventEmitter.on('event-打印屏蔽视频信息', (type, matching, videoData) => {
      const {name, uid, title, videoUrl} = videoData;
      this.addEntry({
        category: 'video',
        id: `v-${uid}-${title}`,
        ruleType: type,
        matching: matching || '',
        userName: name,
        uid,
        content: title,
        contentUrl: videoUrl,
      })
    })
    eventEmitter.on('屏蔽评论信息', (type, matching, commentData) => {
      const {name, uid, content} = commentData;
      this.addEntry({
        category: 'comment',
        id: `c-${uid}-${(content || '').substring(0, 30)}`,
        ruleType: type,
        matching: matching || '',
        userName: name,
        uid,
        content,
      })
    })
    eventEmitter.on('正则匹配时异常', (errorData) => {
      const {msg, e} = errorData
      this.addEntry({ category: 'error', content: msg })
      console.error(msg)
      throw new Error(e)
    })
  }
}
</script>

<template>
  <div class="output-info-container">
    <el-card shadow="never">
      <template #header>
        <div class="output-header">
          <span>屏蔽日志</span>
          <el-button type="warning" size="small" @click="clearInfoBut">清空</el-button>
        </div>
      </template>
      <div v-if="outputInfoArr.length === 0" class="output-empty">暂无屏蔽日志</div>
      <div v-else class="output-log-list">
        <div v-for="(item, i) in outputInfoArr" :key="i" class="log-entry">
          <span class="log-time">{{ item.time }}</span>

          <el-tag v-if="item.category === 'video'" size="mini" type="primary" effect="plain" class="log-tag">{{ item.ruleType }}</el-tag>
          <el-tag v-else-if="item.category === 'comment'" size="mini" type="success" effect="plain" class="log-tag">{{ item.ruleType }}</el-tag>
          <el-tag v-else-if="item.category === 'error'" size="mini" type="danger" effect="plain" class="log-tag">异常</el-tag>

          <span class="log-body">
            <template v-if="item.category === 'video' || item.category === 'comment'">
              屏蔽
              <a :href="'https://space.bilibili.com/' + item.uid" target="_blank" class="log-user">{{ item.userName }}</a>
              <span class="log-uid">{{ item.uid }}</span>
              <span v-if="item.matching" class="log-match">{{ item.matching }}</span>
              <span class="log-sep">—</span>
              <a v-if="item.contentUrl" :href="item.contentUrl" target="_blank" class="log-link">{{ item.content }}</a>
              <span v-else class="log-content-text">{{ item.content }}</span>
            </template>
            <template v-else>{{ item.content }}</template>
          </span>

          <span v-if="item.count > 1" class="log-count">x{{ item.count }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style>
/* ---- outputInformationView ---- */
/* unscoped with .output-info-container prefix for isolation */

.output-info-container .el-card__body {
  padding: 0;
}

.output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.output-empty {
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  color: #9499A0;
}

/* ---- log list ---- */
.output-log-list {
  max-height: 520px;
  overflow-y: auto;
}

.output-log-list::-webkit-scrollbar {
  width: 4px;
}

.output-log-list::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.25);
  border-radius: 3px;
}

.log-entry {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 7px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  font-size: 13px;
  line-height: 1.7;
  transition: background 0.15s;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry:hover {
  background: rgba(0, 0, 0, 0.015);
}

.log-time {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 11px;
  color: #9499A0;
  flex-shrink: 0;
  width: 50px;
}

.log-tag {
  flex-shrink: 0;
}

.log-body {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.log-user {
  color: #18191C;
  font-weight: 600;
  text-decoration: none;
}

.log-user:hover {
  color: #FB7299;
  text-decoration: underline;
}

.log-uid {
  color: #9499A0;
  font-size: 11px;
  margin-left: 2px;
}

.log-match {
  color: #FB7299;
  font-weight: 500;
  margin-left: 4px;
}

.log-sep {
  color: #C0C4CC;
  margin: 0 4px;
}

.log-link {
  color: #FB7299;
  text-decoration: none;
}

.log-link:hover {
  text-decoration: underline;
}

.log-content-text {
  color: #606266;
}

.log-count {
  flex-shrink: 0;
  font-size: 11px;
  color: #909399;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 500;
}

/* ---- dark mode ---- */
.theme-dark .log-entry,
.bb-dark .log-entry {
  border-bottom-color: rgba(255, 255, 255, 0.04);
}

.theme-dark .log-entry:hover,
.bb-dark .log-entry:hover {
  background: rgba(255, 255, 255, 0.02);
}

.theme-dark .log-time,
.bb-dark .log-time {
  color: #7A7A80;
}

.theme-dark .log-user,
.bb-dark .log-user {
  color: #E8E8EA;
}

.theme-dark .log-user:hover,
.bb-dark .log-user:hover {
  color: #FB7299;
}

.theme-dark .log-uid,
.bb-dark .log-uid {
  color: #6A6A70;
}

.theme-dark .log-sep,
.bb-dark .log-sep {
  color: #4A4A50;
}

.theme-dark .log-content-text,
.bb-dark .log-content-text {
  color: #B0B0B8;
}

.theme-dark .log-count,
.bb-dark .log-count {
  color: #7A7A80;
  background: rgba(255, 255, 255, 0.06);
}

.theme-dark .output-empty,
.bb-dark .output-empty {
  color: #6A6A70;
}
</style>
