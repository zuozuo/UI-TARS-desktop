# LocalBrowser 持久化 Profile 设计方案

## 1. 需求背景

为 LocalBrowser 添加一个可选的持久化功能，允许用户选择是否保存浏览器数据（如 cookies、localStorage、登录状态等）到特定的 profile 目录中，以便在下次启动时自动加载这些数据。

## 2. 功能设计

### 2.1 用户界面
- 在 "Operator Settings" -> "Local Browser Operator" 设置页面添加一个 checkbox
- 文案："Enable persistent browser profile"（启用持久化浏览器配置）
- 默认状态：未选中（保持现有行为）

### 2.2 数据存储
- 持久化目录位置：使用 Electron 的标准应用数据目录
  - Windows: `%APPDATA%/ui-tars-desktop/browser-profiles/local-browser`
  - macOS: `~/Library/Application Support/ui-tars-desktop/browser-profiles/local-browser`
  - Linux: `~/.config/ui-tars-desktop/browser-profiles/local-browser`
  
- 目录结构：
  ```
  [应用数据目录]/ui-tars-desktop/
  └── browser-profiles/
      └── local-browser/
          ├── Default/           # Chrome 默认 profile
          ├── Cache/            # 缓存数据
          ├── Local Storage/    # localStorage 数据
          └── ...              # 其他 Chrome 用户数据
  ```

### 2.3 功能行为
- **启用持久化时**：
  - LocalBrowser 启动时使用指定的 userDataDir
  - 保留所有浏览器会话数据（cookies、localStorage、登录状态等）
  - 用户可以在多次使用之间保持登录状态
  
- **禁用持久化时**：
  - 保持现有行为（每次启动都是全新的浏览器实例）
  - 不使用 userDataDir 参数

## 3. 技术实现方案

### 3.1 配置管理
1. 在设置存储中添加新字段：
   ```typescript
   interface LocalBrowserSettings {
     defaultSearchEngine: string;
     enablePersistentProfile: boolean;  // 新增字段
   }
   ```

2. 设置的存储位置（根据现有架构）：
   - Electron Store 或类似的持久化存储方案
   - 通过 IPC 在渲染进程和主进程之间同步

### 3.2 UI 实现
1. 修改 Operator Settings 页面组件
2. 添加 Checkbox 组件和相应的状态管理
3. 实现设置的保存和读取逻辑

### 3.3 LocalBrowser 集成
1. 修改 LocalBrowser 的启动逻辑：
   ```typescript
   async launch(options: LaunchOptions = {}): Promise<void> {
     // 检查是否启用持久化
     const persistentProfileEnabled = await this.getPersistentProfileSetting();
     
     if (persistentProfileEnabled) {
       // 构建持久化目录路径
       const userDataDir = path.join(
         app.getPath('userData'), 
         'browser-profiles', 
         'local-browser'
       );
       
       // 确保目录存在
       await fs.ensureDir(userDataDir);
       
       // 添加到启动选项
       options.userDataDir = userDataDir;
     }
     
     // 继续现有的启动流程
     // ...
   }
   ```

### 3.4 数据管理
1. **目录创建**：
   - 首次启用时自动创建目录
   - 使用 Electron 的 app.getPath('userData') 获取应用数据目录

2. **数据清理**（可选功能）：
   - 提供清除持久化数据的选项
   - 在设置页面添加 "Clear browser data" 按钮

## 4. 实现步骤

### Phase 1: 基础功能
1. 添加设置存储字段
2. 实现 UI checkbox
3. 修改 LocalBrowser 启动逻辑以支持 userDataDir

### Phase 2: 增强功能（可选）
1. 添加数据清理功能
2. 添加 profile 大小显示
3. 支持多个 profile 切换

## 5. 注意事项

### 5.1 安全性
- 持久化数据包含敏感信息（cookies、登录凭证等）
- 确保数据目录权限设置正确（仅当前用户可访问）

### 5.2 兼容性
- 路径会根据操作系统自动适配（通过 `app.getPath('userData')`）
- Windows: `%APPDATA%/ui-tars-desktop/browser-profiles/`
- macOS: `~/Library/Application Support/ui-tars-desktop/browser-profiles/`
- Linux: `~/.config/ui-tars-desktop/browser-profiles/`

### 5.3 性能影响
- 持久化 profile 可能会随时间增长
- 考虑添加定期清理机制或大小限制

### 5.4 用户体验
- 清晰的提示说明持久化功能的作用
- 提供简单的方式清除数据
- 考虑添加 profile 导入/导出功能

## 6. 测试要点

1. **功能测试**：
   - 启用/禁用持久化切换
   - 数据持久化验证（cookies、localStorage）
   - 跨会话的登录状态保持

2. **边界测试**：
   - 首次使用（目录创建）
   - 磁盘空间不足
   - 权限问题

3. **兼容性测试**：
   - 不同操作系统
   - 不同浏览器类型（Chrome、Edge、Firefox）

## 7. 未来扩展

1. **多 Profile 支持**：
   - 允许创建和切换多个 profile
   - 为不同任务使用不同的浏览器环境

2. **Profile 同步**：
   - 支持 profile 的导入/导出
   - 云端备份和同步

3. **高级管理**：
   - Profile 大小监控和警告
   - 自动清理策略
   - 选择性数据保存（仅 cookies、仅 localStorage 等）