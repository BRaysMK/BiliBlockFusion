<script>
import videoPlayModel from "../../pagesModel/videoPlay/videoPlayModel.js";
import collectionVideoPlayPageModel from "../../pagesModel/videoPlay/collectionVideoPlayPageModel.js";
import space from "../../pagesModel/space/space.js";
import ruleKeyListData from "../../data/ruleKeyListData.js";
import ruleUtil from "../../utils/ruleUtil.js";
import videoPlayWatchLater from "../../pagesModel/videoPlay/videoPlayWatchLater.js";
import {eventEmitter} from "../../model/EventEmitter.js";
import urlUtil from "../../utils/urlUtil.js";

export default {
  data() {
    return {
      shieldingModelShow: true,
      shieldingUseUIDrButShow: false,
      removedShieldingUIDrButShow: false,
      selectUserBlockingButShow: false,
      uid: -1
    }
  },
  methods: {
    async blockCurrentUser() {
      const {name, uid} = await space.getUserInfo()
      this.$confirm(`是否屏蔽当前用户【${name}】uid=【${uid}】`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const {status, res} = ruleUtil.addRulePreciseUid(uid);
        this.$alert(res)
        if (status) {
          eventEmitter.send('通知屏蔽');
          this.shieldingUseUIDrButShow = false
          this.removedShieldingUIDrButShow = true
        }
      })
    },
    async unblockCurrentUser() {
      const {uid} = await space.getUserInfo()
      ruleUtil.delRUlePreciseUid(uid)
    },
    async selectUserBlocking() {
      await videoPlayModel.selectUserBlocking()
    }
  },
  async created() {
    if (videoPlayModel.isVideoPlayPage() || collectionVideoPlayPageModel.iscCollectionVideoPlayPage() ||
        videoPlayWatchLater.isVideoPlayWatchLaterPage()) {
      this.selectUserBlockingButShow = true
    }
    if (space.isSpacePage()) {
      this.urlUID = urlUtil.getUrlUID(window.location.href);
      if (ruleKeyListData.getPreciseUidArr().includes(this.urlUID)) {
        this.shieldingModelShow = true
        this.removedShieldingUIDrButShow = true
        await this.$alert('当前用户为已标记uid黑名单', '提示');
        return;
      }
      if (await space.isPersonalHomepage()) {
        this.shieldingModelShow = false
        return;
      }
      this.shieldingModelShow = true
      this.shieldingUseUIDrButShow = true
    }
  }
}
</script>

<template>
  <div v-if="shieldingModelShow" style="display:flex;flex-direction:column;gap:6px;align-items:center;">
    <el-button v-if="shieldingUseUIDrButShow"
               class="panel-btn panel-btn--secondary" round
               @click="blockCurrentUser">
      屏蔽当前用户
    </el-button>
    <el-button v-if="removedShieldingUIDrButShow"
               class="panel-btn panel-btn--secondary" round
               @click="unblockCurrentUser">
      取消屏蔽用户
    </el-button>
    <el-button v-if="selectUserBlockingButShow"
               class="panel-btn panel-btn--secondary" round
               @click="selectUserBlocking">
      屏蔽该UP主
    </el-button>
  </div>
</template>

<style scoped>
.panel-btn {
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.4px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  padding: 8px 16px;
}

.panel-btn:hover {
  transform: translateY(-1px);
}

.panel-btn--secondary {
  background: rgba(251, 114, 153, 0.07);
  color: #FB7299;
  border: 1px solid rgba(251, 114, 153, 0.18);
}

.panel-btn--secondary:hover {
  background: rgba(251, 114, 153, 0.13);
  box-shadow: 0 2px 10px rgba(251, 114, 153, 0.15);
  color: #FB7299;
}

.panel-btn--secondary:active {
  transform: translateY(0);
  background: rgba(251, 114, 153, 0.18);
}
</style>
