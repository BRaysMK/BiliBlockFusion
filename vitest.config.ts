import {defineConfig} from "vitest/config";
import vue from "@vitejs/plugin-vue";
import {fileURLToPath, URL} from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/web", import.meta.url))
    }
  },
  define: {
    // 编译期常量：测试环境按开发构建处理（__DEV__ = true）
    __DEV__: "true",
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    // 每个测试文件独占一个 jsdom 环境，23 个文件并行创建时首次 import 整张
    // 模块图（Vue + Element Plus + 各 domain 模块）会争抢 CPU；默认 5s 下
    // 各文件的第一个用例约 20% 概率超时，用例本身并没有慢到那个程度。
    testTimeout: 15000
  }
});
