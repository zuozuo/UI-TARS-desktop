# UI-TARS-desktop 系统架构详解

> 📖 **推荐阅读**：[完整架构指南](./complete-architecture-guide.md) - 包含所有架构文档的整体介绍

## 一、系统总体架构

UI-TARS-desktop 是一个基于 Electron 的多模态 AI Agent 平台，采用分层架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层 (UI Layer)                     │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Electron App  │  │    Web UI      │  │     CLI      │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    应用服务层 (Service Layer)                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Agent Server  │  │  Socket.IO     │  │  REST API    │  │
│  │  (Sessions)    │  │  (Real-time)   │  │  (HTTP)      │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                     Agent 核心层 (Core Layer)                 │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Agent TARS    │  │  Agent Runner  │  │ Event Stream │  │
│  │  (MCPAgent)    │  │  (Executor)    │  │  (Logger)    │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                   能力提供层 (Capability Layer)               │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Browser Control│  │  LLM Provider  │  │ MCP Servers  │  │
│  │  (DOM/Visual)  │  │  (Multi-model) │  │  (Tools)     │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 二、Electron 应用架构

### 2.1 进程架构

```
┌──────────────────────────────────────────────────────────┐
│                    主进程 (Main Process)                   │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   App Init  │  │Window Manager│  │  IPC Registry  │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │Agent Operator│ │Settings Store│ │Permission Mgmt │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────┘
                    │          │          │
              IPC 通信    Context Bridge   预加载脚本
                    │          │          │
┌──────────────────────────────────────────────────────────┐
│                  渲染进程 (Renderer Process)               │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  React App  │  │    Router    │  │  State Hooks   │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Agent Panel │  │Settings Page │  │  Task View     │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 2.2 IPC 通信机制

```typescript
// IPC 路由定义
interface IPCRoutes {
  // Agent 操作
  'agent:start': (config: AgentConfig) => Promise<void>
  'agent:stop': () => Promise<void>
  'agent:getStatus': () => Promise<AgentStatus>
  
  // 设置管理
  'settings:get': () => Promise<Settings>
  'settings:update': (settings: Partial<Settings>) => Promise<void>
  
  // 窗口控制
  'window:screenshot': () => Promise<Buffer>
  'window:showMarker': (position: Point) => Promise<void>
  
  // 权限管理
  'permission:check': (type: PermissionType) => Promise<boolean>
  'permission:request': (type: PermissionType) => Promise<boolean>
}
```

## 三、应用服务层详解

### 3.1 Agent Server (Sessions)

Agent Server 是整个系统的核心服务器，负责管理 Agent 会话的完整生命周期：

**主要职责：**
- **会话管理**：创建、更新、删除和查询会话
- **多实例支持**：管理多个并行运行的 Agent 实例
- **状态持久化**：保存会话数据和事件历史到存储系统
- **浏览器控制**：提供浏览器自动化能力的管理接口
- **分享功能**：支持会话内容的分享和访问控制

**实现架构：**
```typescript
class AgentTARSServer {
  // 会话管理
  sessions: Map<string, AgentSession>
  
  // 服务组件
  app: Express.Application
  httpServer: http.Server
  io: SocketIOServer
  
  // 存储和监控
  storage: StorageInterface
  agioMonitor: AGIOMonitor
}
```

### 3.2 Socket.IO (Real-time)

Socket.IO 提供实时双向通信能力，处理所有需要即时响应的交互场景：

**核心功能：**
1. **实时事件推送**
   - 将 Agent 执行过程中产生的事件实时推送给客户端
   - 支持多种事件类型：状态更新、工具调用、结果返回等

2. **会话订阅机制**
   - 客户端通过 `join-session` 加入特定会话房间
   - 自动接收该会话的所有事件流
   - 支持多客户端同时订阅同一会话

3. **流式查询执行**
   - 通过 `send-query` 事件发送查询请求
   - 支持流式响应，实时展示 AI 生成内容
   - 处理长时间运行的任务

4. **实时控制**
   - `abort-query` 事件支持中断正在执行的查询
   - 状态同步确保 UI 实时反映 Agent 状态
   - 心跳机制维持连接活跃

**Socket 事件定义：**
```typescript
// 客户端 -> 服务器
interface ClientEvents {
  'ping': (callback: () => void) => void
  'join-session': (sessionId: string) => void
  'send-query': (data: {sessionId: string, query: string}) => void
  'abort-query': (data: {sessionId: string}) => void
}

// 服务器 -> 客户端  
interface ServerEvents {
  'agent-event': (data: {type: string, data: any}) => void
  'agent-status': (status: AgentStatus) => void
  'error': (message: string) => void
  'abort-result': (result: {success: boolean}) => void
}
```

### 3.3 REST API (HTTP)

REST API 提供标准的 HTTP 接口，用于所有非实时的操作和管理功能：

**API 路由结构：**

1. **会话管理 API** (`/api/v1/sessions/*`)
   - `GET /sessions` - 获取所有会话列表
   - `POST /sessions/create` - 创建新会话
   - `GET /sessions/details` - 获取会话详细信息
   - `GET /sessions/events` - 获取会话事件历史
   - `GET /sessions/status` - 获取会话当前状态
   - `POST /sessions/update` - 更新会话元数据
   - `POST /sessions/delete` - 删除会话
   - `POST /sessions/generate-summary` - 生成会话摘要
   - `POST /sessions/share` - 创建分享链接

2. **查询执行 API** (`/api/v1/sessions/query/*`)
   - `POST /query` - 执行同步查询（等待完成）
   - `POST /query/stream` - 执行流式查询（SSE响应）
   - `POST /abort` - 中断正在执行的查询

3. **系统信息 API** (`/api/v1/system/*`)
   - 获取系统状态、版本信息、配置等

4. **分享功能 API** (`/api/v1/share/*`)
   - 创建、访问和管理分享的会话内容

5. **一次性查询 API** (`/api/v1/oneshot/*`)
   - 无需创建会话的快速查询接口
   - 适用于简单的单次交互场景

### 3.4 三层协同工作

这三个组件相互配合，为上层 UI 提供完整的服务能力：

```
用户交互
    │
    ├─> Socket.IO (实时交互)
    │   └─> 流式响应、状态推送、事件通知
    │
    ├─> REST API (管理操作)
    │   └─> CRUD操作、配置管理、数据查询
    │
    └─> Agent Server (核心逻辑)
        └─> 会话管理、任务执行、状态维护
```

**使用场景示例：**
- **创建会话**：通过 REST API 创建，返回会话 ID
- **执行查询**：可选择 Socket.IO（实时）或 REST API（同步/流式）
- **监听事件**：通过 Socket.IO 订阅会话，接收实时事件
- **管理会话**：通过 REST API 进行查询、更新、删除等操作

## 四、Agent 执行流程

### 4.1 Agent 生命周期

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ Initialize  │ --> │   Configure  │ --> │   Start    │
└─────────────┘     └──────────────┘     └────────────┘
       │                                        │
       │                                        v
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Cleanup   │ <-- │     Stop     │ <-- │    Run     │
└─────────────┘     └──────────────┘     └────────────┘
                                               │ ^
                                               v │
                                          ┌────────────┐
                                          │ Process    │
                                          │ Messages   │
                                          └────────────┘
```

### 4.2 消息处理流程

```
用户输入 (User Input)
        │
        v
┌───────────────────┐
│  Message History  │
└───────────────────┘
        │
        v
┌───────────────────┐     ┌─────────────────┐
│   LLM Processor   │ --> │  Tool Calls?    │
└───────────────────┘     └─────────────────┘
        │                         │ Yes
        │ No                      v
        │                 ┌─────────────────┐
        │                 │ Tool Processor  │
        │                 └─────────────────┘
        │                         │
        v                         v
┌───────────────────┐     ┌─────────────────┐
│ Stream Response   │ <-- │ Format Result   │
└───────────────────┘     └─────────────────┘
        │
        v
   Event Stream
```

## 四、多模态能力架构

### 4.1 模型提供商集成

```
┌─────────────────────────────────────────────────────┐
│                  Model Provider Manager             │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  OpenAI  │  │Anthropic │  │  Google  │  ...   │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │          Unified LLM Client Interface        │  │
│  │  - Chat Completion                           │  │
│  │  - Tool Calling                              │  │
│  │  - Streaming                                 │  │
│  │  - Vision Support                            │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 4.2 工具调用引擎

```
┌──────────────────────────────────────────────────────┐
│                 Tool Call Engine Manager              │
│                                                      │
│  ┌────────────────┐  ┌─────────────────┐           │
│  │ Native Engine  │  │ Prompt Engineer │           │
│  │ (Function Call)│  │    Engine       │           │
│  └────────────────┘  └─────────────────┘           │
│                                                      │
│  ┌────────────────────────────────────┐            │
│  │    Structured Outputs Engine        │            │
│  │    (JSON Schema Response)           │            │
│  └────────────────────────────────────┘            │
└──────────────────────────────────────────────────────┘
```

## 五、浏览器控制架构

### 5.1 控制策略

```
┌─────────────────────────────────────────────────────┐
│              Browser Control Manager                 │
│                                                     │
│  ┌───────────────┐  ┌────────────────┐            │
│  │  DOM Strategy │  │ Visual Strategy│            │
│  │  - Fast       │  │  - Universal   │            │
│  │  - Precise    │  │  - AI-powered  │            │
│  └───────────────┘  └────────────────┘            │
│                                                     │
│  ┌─────────────────────────────────────┐          │
│  │        Hybrid Strategy               │          │
│  │  - Combines DOM + Visual             │          │
│  │  - Adaptive selection                │          │
│  └─────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

### 5.2 浏览器工具集

```typescript
interface BrowserTools {
  // 导航工具
  navigation: {
    goto(url: string): Promise<void>
    back(): Promise<void>
    forward(): Promise<void>
    reload(): Promise<void>
  }
  
  // 内容工具
  content: {
    getPageContent(): Promise<string>
    screenshot(): Promise<Buffer>
    getElements(): Promise<Element[]>
  }
  
  // 交互工具
  interaction: {
    click(selector: string): Promise<void>
    type(selector: string, text: string): Promise<void>
    scroll(direction: ScrollDirection): Promise<void>
  }
  
  // 视觉工具
  visual: {
    findElement(description: string): Promise<Element>
    getVisualGrounding(): Promise<GroundingResult>
  }
}
```

## 六、MCP (Model Context Protocol) 集成

### 6.1 MCP 架构

```
┌─────────────────────────────────────────────────────┐
│                    MCP Agent                         │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐                │
│  │ MCP Client  │  │Tool Adapter  │                │
│  └─────────────┘  └──────────────┘                │
│         │                 │                         │
│         v                 v                         │
│  ┌─────────────────────────────────┐              │
│  │      MCP Server Registry         │              │
│  │  - Filesystem Server             │              │
│  │  - GitHub Server                 │              │
│  │  - Database Server               │              │
│  │  - Custom Servers                │              │
│  └─────────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

### 6.2 工具注册流程

```
MCP Server 启动
      │
      v
┌──────────────┐
│ Tool Discovery│
└──────────────┘
      │
      v
┌──────────────┐     ┌────────────────┐
│ Tool Adapter │ --> │ Agent Registry │
└──────────────┘     └────────────────┘
      │                      │
      v                      v
┌──────────────┐     ┌────────────────┐
│ Schema Valid │     │ Tool Available │
└──────────────┘     └────────────────┘
```

## 七、事件流系统

### 7.1 事件类型

```typescript
type EventTypes = 
  | 'session_start'      // 会话开始
  | 'user_message'       // 用户消息
  | 'assistant_message'  // 助手消息
  | 'tool_call'         // 工具调用
  | 'tool_result'       // 工具结果
  | 'error'             // 错误事件
  | 'session_end'       // 会话结束
  | 'status_update'     // 状态更新
  | 'plan_update'       // 计划更新
```

### 7.2 事件流处理

```
Event 产生
    │
    v
┌────────────────┐
│ Event Stream   │
│   Processor    │
└────────────────┘
    │
    ├─> 存储 (Memory/File/DB)
    │
    ├─> 订阅者通知 (Subscribers)
    │
    └─> UI 更新 (WebSocket/SSE)
```

## 八、数据流向图

### 8.1 完整请求流程

```
用户输入 --> Electron UI --> IPC --> 主进程
                                        │
                                        v
                                  Agent Operator
                                        │
                                        v
                                  Agent Server
                                        │
                                        v
                                  Agent Session
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                              v                   v
                        LLM Provider        Tool Manager
                              │                   │
                              │                   v
                              │              MCP/Browser
                              │                   │
                              └─────────┬─────────┘
                                        │
                                        v
                                  Event Stream
                                        │
                                        v
                              WebSocket --> UI Update
```

### 8.2 状态同步机制

```
Main Process State
       │
       ├─> Zustand Store
       │        │
       │        v
       │   State Change
       │        │
       │        v
       │   IPC Broadcast
       │        │
       └────────┘
                │
                v
        Renderer Process
                │
                v
          React Hooks
                │
                v
            UI Update
```

## 九、安全架构

### 9.1 进程隔离

- 主进程：处理系统权限、文件访问、网络请求
- 渲染进程：仅通过 IPC 与主进程通信
- 预加载脚本：安全暴露必要 API

### 9.2 权限管理

```typescript
interface PermissionSystem {
  // 系统权限
  screenRecording: boolean
  accessibility: boolean
  
  // 应用权限
  fileAccess: string[]  // 允许访问的路径
  networkAccess: string[]  // 允许的域名
  
  // 工具权限
  toolPermissions: Map<string, Permission>
}
```

## 十、扩展性设计

### 10.1 插件系统

- **工具插件**：通过 MCP 协议添加新工具
- **模型插件**：添加新的 LLM 提供商
- **策略插件**：自定义浏览器控制策略

### 10.2 配置系统

```typescript
interface AgentConfig {
  // 模型配置
  model: ModelConfig
  
  // 工具配置
  tools: ToolConfig[]
  
  // MCP 服务器
  mcpServers: MCPServerConfig[]
  
  // 执行配置
  execution: ExecutionConfig
  
  // 扩展配置
  extensions: Record<string, any>
}
```

## 总结

UI-TARS-desktop 采用了现代化的分层架构设计，通过 Electron 提供跨平台桌面应用能力，结合多模态 AI Agent 框架实现智能化的计算机和浏览器控制。系统具有以下特点：

1. **模块化设计**：各层职责明确，易于维护和扩展
2. **事件驱动**：基于事件流的异步处理机制
3. **类型安全**：端到端的 TypeScript 类型支持
4. **灵活扩展**：通过 MCP 协议和插件系统支持扩展
5. **安全隔离**：遵循 Electron 安全最佳实践
6. **实时反馈**：WebSocket 实现实时状态同步

这个架构为构建复杂的 AI 驱动应用提供了坚实的基础。