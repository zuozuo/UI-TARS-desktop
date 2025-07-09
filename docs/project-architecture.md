# UI-TARS-desktop 项目架构文档

## 项目概述

UI-TARS-desktop 是一个基于 **Electron + React + TypeScript** 的 **Monorepo** 架构项目，提供了多模态 AI Agent 能力，支持通过自然语言控制计算机和浏览器。

## 主要产品

### 1. Agent TARS
- **定位**：通用多模态 AI Agent 框架
- **交互方式**：CLI 命令行工具和 Web UI 界面
- **核心能力**：
  - GUI Agent（图形界面自动化）
  - 视觉识别能力
  - MCP（Model Context Protocol）工具集成
  - 混合浏览器控制策略（DOM + 视觉定位）

### 2. UI-TARS Desktop
- **定位**：基于 UI-TARS 模型的桌面 GUI Agent 应用
- **运行模式**：
  - 本地操作模式：直接控制本地计算机
  - 远程操作模式：通过云端 VM 沙箱控制
- **支持平台**：Windows、macOS、浏览器

## 项目结构

```
UI-TARS-desktop/
├── apps/
│   └── ui-tars/              # Electron 桌面应用
│       ├── src/
│       │   ├── main/         # Electron 主进程
│       │   ├── preload/      # 预加载脚本
│       │   └── renderer/     # React 渲染进程
│       ├── resources/        # 应用资源文件
│       └── package.json
│
├── multimodal/               # 核心 AI Agent 模块集合
│   ├── agent-tars/           # 主 Agent 实现
│   ├── agent/                # 基础 Agent 框架
│   ├── agent-interface/      # Agent 接口定义
│   ├── agent-tars-server/    # Agent 服务端
│   ├── agent-tars-cli/       # CLI 工具
│   ├── agent-tars-web-ui/    # Web UI
│   ├── llm-client/           # LLM 客户端封装
│   ├── model-provider/       # 模型提供商管理
│   ├── mcp-agent/            # MCP 集成
│   └── deep-research-agent/  # 深度研究 Agent
│
├── packages/                 # 共享包
├── docs/                     # 项目文档
├── examples/                 # 示例代码
├── patches/                  # 依赖补丁
├── scripts/                  # 构建脚本
├── pnpm-workspace.yaml       # pnpm 工作区配置
├── turbo.json                # Turbo 构建配置
└── package.json              # 根包配置
```

## 技术栈

### 前端技术
- **框架**：React 18 + TypeScript 5
- **样式**：Tailwind CSS + PostCSS
- **构建**：Vite + RSBuild
- **状态管理**：Jotai

### 桌面技术
- **框架**：Electron 33
- **进程通信**：IPC + 自定义路由系统
- **窗口管理**：多窗口支持 + 屏幕标记
- **系统权限**：屏幕录制、辅助功能权限管理

### AI 技术
- **模型支持**：
  - UI-TARS 系列模型
  - Claude、GPT-4、Gemini 等主流模型
  - 国产模型：豆包、通义千问等
- **能力特性**：
  - 多模态输入（文本 + 图像）
  - 工具调用（Tool Calling）
  - 流式输出
  - 上下文管理

### 工程化
- **包管理**：pnpm (Monorepo)
- **构建工具**：Turbo
- **测试框架**：Vitest + Playwright
- **代码规范**：ESLint + Prettier
- **版本管理**：Changesets

## 核心模块说明

### 1. Electron 应用 (apps/ui-tars)
- **主进程**：窗口管理、IPC 通信、系统权限、Agent 执行
- **渲染进程**：React UI、用户交互、实时反馈
- **预加载脚本**：安全的 API 暴露

### 2. Agent 核心 (multimodal/agent-tars)
- **浏览器控制**：支持 DOM、视觉定位、混合策略
- **规划器**：任务分解和执行计划
- **工具管理**：动态工具注册和调用
- **提示工程**：优化的多模态提示模板

### 3. 服务端 (multimodal/agent-tars-server)
- **会话管理**：多会话并发支持
- **存储系统**：内存、文件、数据库多种存储
- **API 服务**：RESTful + WebSocket
- **事件流**：基于 SSE 的实时通信

### 4. CLI 工具 (multimodal/agent-tars-cli)
- **交互模式**：命令行交互界面
- **配置管理**：灵活的配置系统
- **工作区**：项目级配置支持

## 关键特性

### 1. 混合浏览器控制
- DOM 策略：精确、快速
- 视觉定位策略：通用、智能
- 混合策略：结合两者优势

### 2. 事件驱动架构
- 基于事件流的通信机制
- 支持上下文工程
- 便于构建 Agent UI

### 3. MCP 生态集成
- 原生支持 MCP 协议
- 可挂载外部 MCP 服务器
- 连接真实世界工具

### 4. 企业级特性
- 完善的错误处理
- 详细的日志系统
- 性能监控和优化
- 安全和隐私保护

## 开发指南

### 环境要求
- Node.js >= 20.x
- pnpm >= 9.10.0

### 常用命令
```bash
# 安装依赖
pnpm install

# 开发 UI-TARS 桌面应用
pnpm run dev:ui-tars

# 运行测试
pnpm test

# 构建项目
pnpm build

# 发布包
pnpm run publish:packages
```

### 注意事项
1. 使用 Electron 镜像源加速下载：
   ```bash
   ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm install
   ```

2. macOS 需要授予屏幕录制和辅助功能权限

3. 开发时建议使用 VS Code，项目已配置相关扩展推荐

## 总结

UI-TARS-desktop 是一个功能完整、架构清晰的多模态 AI Agent 平台。它不仅提供了强大的桌面应用，还包含了完整的开发工具链，可以帮助开发者快速构建 AI 驱动的自动化应用。项目采用了现代化的技术栈和工程实践，具有良好的可扩展性和维护性。