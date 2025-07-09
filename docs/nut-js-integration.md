# nut.js 集成详解

## 概述

nut.js 是一个跨平台的桌面自动化框架，能够在 Windows、macOS 和 Linux 上进行鼠标、键盘和屏幕操作。在 UI-TARS-desktop 项目中，我们使用 `@computer-use/nut-js` 版本，这是专门为计算机自动化任务优化的版本。

## 在项目中的核心作用

nut.js 在 UI-TARS-desktop 项目中扮演着**桌面操作执行器**的角色，它是连接 AI 智能体（Agent）和实际计算机操作的桥梁：

```
AI 模型 → 预测动作 → NutJSOperator → nut.js API → 系统操作
```

## 架构设计

项目实现了两个层次的操作器：

### 1. NutJSOperator - 基础操作器

位于 `packages/ui-tars/operators/nut-js/src/index.ts`

主要功能：
- **截屏功能** (screenshot)：支持高 DPI 缩放处理
- **鼠标操作**：单击、双击、右击、中键点击、拖拽、移动
- **键盘操作**：文本输入、热键组合、按键控制
- **滚动操作**：支持上下左右滚动
- **等待操作**：暂停执行等待状态变化

### 2. NutJSElectronOperator - Electron 增强版

位于 `apps/ui-tars/src/main/agent/operator.ts`

增强功能：
- 使用 Electron 的 `desktopCapturer` API 提供更高效的截图
- Windows 平台下通过剪贴板优化文本输入性能
- 更精确的屏幕尺寸和缩放比例处理

## 具体使用场景

### 1. 点击操作

```typescript
// packages/ui-tars/operators/nut-js/src/index.ts:182-189
case 'click':
  await moveStraightTo(startX, startY);  // 移动到目标位置
  await sleep(100);                       // 短暂等待
  await mouse.click(Button.LEFT);         // 执行点击
```

### 2. 文本输入

```typescript
// packages/ui-tars/operators/nut-js/src/index.ts:238-264
case 'type':
  if (process.platform === 'win32') {
    // Windows 使用剪贴板方式输入（更快更稳定）
    await clipboard.setContent(content);
    await keyboard.pressKey(Key.LeftControl, Key.V);
  } else {
    // 其他平台使用键盘模拟输入
    await keyboard.type(content);
  }
```

### 3. 拖拽操作

```typescript
// packages/ui-tars/operators/nut-js/src/index.ts:213-236
case 'drag':
  const diffX = Big(endX).minus(startX).toNumber();
  const diffY = Big(endY).minus(startY).toNumber();
  await mouse.drag(
    straightTo(centerOf(new Region(startX, startY, diffX, diffY)))
  );
```

### 4. 热键组合

```typescript
// packages/ui-tars/operators/nut-js/src/index.ts:266-274
case 'hotkey':
  const keys = getHotkeys(keyStr);  // 解析快捷键
  await keyboard.pressKey(...keys);
  await keyboard.releaseKey(...keys);
```

## 跨平台处理

项目对不同操作系统进行了适配：

```typescript
// packages/ui-tars/operators/nut-js/src/index.ts:122-136
const platformCommandKey = 
  process.platform === 'darwin' ? Key.LeftCmd : Key.LeftWin;
const platformCtrlKey = 
  process.platform === 'darwin' ? Key.LeftCmd : Key.LeftControl;
```

## 系统权限处理

特别是在 macOS 上，需要处理系统权限：
- 屏幕录制权限（用于截图）
- 辅助功能权限（用于鼠标键盘控制）

相关代码位于 `apps/ui-tars/src/main/utils/systemPermissions.ts`

## 与 AI 模型的集成

AI 模型输出的动作指令格式：

```
click(start_box='[x1, y1, x2, y2]')
type(content='Hello World')
hotkey(key='cmd+c')
drag(start_box='[x1, y1, x2, y2]', end_box='[x3, y3, x4, y4]')
scroll(start_box='[x1, y1, x2, y2]', direction='down')
wait()
finished()
call_user()
```

这些指令通过 `execute` 方法转换为具体的 nut.js API 调用。

## 关键技术细节

### 1. 坐标转换
使用 `parseBoxToScreenCoords` 将相对坐标转换为屏幕绝对坐标。

### 2. 高 DPI 支持
处理屏幕缩放比例，确保在高分辨率屏幕上的准确定位。

### 3. 性能优化
- 鼠标移动速度设置：`mouse.config.mouseSpeed = 3600`
- 键盘输入延迟设置：`keyboard.config.autoDelayMs = 0`

### 4. 错误处理
对不支持的操作类型进行告警处理。

## 在项目中的集成关系

```
GUIAgent
  ├── UITarsModel (AI 模型)
  └── Operator (操作器接口)
      ├── NutJSOperator (基础桌面操作)
      ├── NutJSElectronOperator (Electron 增强)
      ├── DefaultBrowserOperator (浏览器操作)
      ├── RemoteComputerOperator (远程桌面)
      ├── RemoteBrowserOperator (远程浏览器)
      └── AdbOperator (Android 设备)
```

## 实际应用场景

在 UI-TARS-desktop 中，nut.js 使得 AI 智能体能够：
- 自动操作桌面应用程序
- 完成复杂的 GUI 任务
- 模拟人类的鼠标键盘操作
- 进行自动化测试
- 辅助用户完成重复性工作

这使得 UI-TARS 成为一个真正的多模态 AI 智能体，能够像人类一样"看到"屏幕并进行操作。

## 相关文件

- 基础操作器实现：`packages/ui-tars/operators/nut-js/src/index.ts`
- Electron 增强版：`apps/ui-tars/src/main/agent/operator.ts`
- 系统权限处理：`apps/ui-tars/src/main/utils/systemPermissions.ts`
- 单元测试：`packages/ui-tars/operators/nut-js/test/execute.test.ts`
- 在 Agent 中的使用：`apps/ui-tars/src/main/services/runAgent.ts`

## 依赖版本

- `@computer-use/nut-js`: ^4.2.0

## nut.js click 与 DOM click 的对比

在 UI-TARS-desktop 项目中，存在两种不同的点击实现方式：nut.js 的系统级点击和浏览器的 DOM 级点击。理解它们的区别对于选择合适的自动化方案至关重要。

### 操作层级不同

**nut.js click（系统级）**：
- 通过操作系统的 API 模拟真实的鼠标事件
- 在系统层面移动鼠标指针并触发点击
- 可以点击屏幕上的任何位置，不限于浏览器

**DOM click（浏览器级）**：
- 通过浏览器 API（如 Puppeteer）直接操作 DOM 元素
- 在浏览器内部触发点击事件
- 只能操作浏览器内的元素

### 代码实现对比

**nut.js 实现**（`packages/ui-tars/operators/nut-js/src/index.ts:182-189`）：
```typescript
case 'click':
  await moveStraightTo(startX, startY);  // 物理移动鼠标
  await sleep(100);                       // 等待
  await mouse.click(Button.LEFT);         // 系统级点击
```

**浏览器 DOM 实现**（`packages/ui-tars/operators/browser-operator/src/browser-operator.ts:319-337`）：
```typescript
await page.mouse.move(x, y);     // 虚拟移动（浏览器内）
await this.delay(100);
await page.mouse.click(x, y);    // 浏览器级点击
```

### 执行环境差异

**nut.js**：
- 需要系统权限（macOS 需要辅助功能权限）
- 受系统鼠标速度设置影响：`mouse.config.mouseSpeed = 3600`
- 会真实移动系统鼠标指针

**DOM click**：
- 只需要浏览器实例权限
- 不受系统设置影响
- 不会移动系统鼠标指针（虚拟鼠标）

### 应用场景

**nut.js 适用于**：
- 桌面应用程序自动化
- 跨应用程序操作
- 需要模拟真实用户行为的场景
- 系统级交互（如系统菜单、通知等）

**DOM click 适用于**：
- Web 应用自动化测试
- 网页爬虫
- 浏览器内的自动化操作
- 需要快速、稳定的网页交互

### 性能和稳定性

**nut.js**：
- 较慢（需要物理移动鼠标）
- 可能受其他应用干扰
- 更接近真实用户操作

**DOM click**：
- 更快（直接触发事件）
- 更稳定（不受外部干扰）
- 可以在后台运行（headless 模式）

### 坐标系统

**nut.js**：
- 使用屏幕坐标（绝对坐标）
- 需要处理多显示器和 DPI 缩放

**DOM click**：
- 使用页面坐标（相对于视口）
- 自动处理页面滚动和缩放

### 错误处理

**nut.js**：
- 如果目标被遮挡，仍会点击遮挡物
- 需要截图验证操作结果

**DOM click**：
- 可以检测元素是否可点击
- 可以等待元素出现再点击
- 更精确的错误信息

### 在项目中的选择

UI-TARS-desktop 项目提供了多种操作器供用户选择：
- **LocalComputer**：使用 NutJSElectronOperator，适合桌面应用自动化
- **LocalBrowser**：使用 DefaultBrowserOperator（基于 Puppeteer），适合 Web 自动化
- **RemoteComputer/RemoteBrowser**：用于远程操作场景

这种设计让用户可以根据具体需求选择最合适的操作方式，实现最佳的自动化效果。