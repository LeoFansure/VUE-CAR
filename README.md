# AGV 智能巡检系统前端

本项目是 AGV (Automated Guided Vehicle) 智能巡检系统的前端实现，旨在为地轨隧道、机房、厂区等场景下的巡检机器人提供一套完整、高效的人机交互与管理解决方案。项目包含两大核心模块：**小车系统** 和 **云端系统**。

- **小车系统**: 部署在本地或与 AGV 配套的边缘计算设备上，负责单台设备的实时监控、任务执行和参数配置。
- **云端系统**: 一个中心化的管理平台，用于多台设备的远程监控、数据汇总、任务调度和历史数据分析。

## ✨ 功能特性

### 🚗 小车系统 (Car System)

- **系统自检**: 启动时自动检查运行环境、硬件连接（AGV、摄像头）和网络状态，确保系统可靠性。
- **任务管理**: 创建、编辑、启动和删除巡检任务，支持基于预设路线的自动化巡检。
- **实时监控**: 在任务执行期间，实时显示来自车载摄像头的视频流。
- **全局控制**: 提供一个集成的控制面板，可手动控制 AGV 运动、摄像头云台，并查看实时状态（如电量、速度、位置）。
- **故障诊断**: 实时识别巡检过程中的异常情况（例如设备故障、环境异常），并进行记录和告警。
- **系统设置**: 配置 AGV 的连接参数、摄像头串流地址以及与云端平台的通信接口。

### ☁️ 云端系统 (Cloud System)

- 项目地址: 
    ```
    https://github.com/LeoFansure/CAR_SPRING.git
    ```

- **多设备管理**: 集中监控和管理多台 AGV 的运行状态和位置。
- **任务调度**: 远程向指定的 AGV 派发巡检任务。
- **数据中心**: 汇总所有巡检任务的数据，包括巡检日志、拍摄的图片和识别出的故障信息。
- **故障管理**: 查看、筛选和处理所有设备上报的故障信息，支持对故障进行确认、分类和备注。

## 🛠️ 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/)
- **开发工具**: [Vite](https://vitejs.dev/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **路由**: [Vue Router](https://router.vuejs.org/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **HTTP 请求**: [Axios](https://axios-http.com/)
- **工具库**: [@vueuse/core](https://vueuse.org/)
- **CSS 预处理器**: [Sass/SCSS](https://sass-lang.com/)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/LeoFansure/VUE-CAR.git
cd VUE-CAR
```

### 2. 安装依赖

推荐使用 `npm` 进行安装。

```bash
npm install
```

### 3. 运行开发环境

```bash
npm run dev
```

此命令将启动本地开发服务器，默认地址为 `http://localhost:5173`。

### 4. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 📁 项目结构

```
.
├── public/                # 静态资源，如 EasyPlayer 播放器文件
├── src/
│   ├── api/               # API 请求定义 (按模块划分)
│   │   ├── car/           # 小车系统相关 API
│   │   └── cloud/         # 云端系统相关 API
│   ├── assets/            # CSS 和其他静态资源
│   ├── components/        # 可复用的 Vue 组件
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   ├── utils/             # 工具函数 (如 Axios 封装)
│   ├── views/             # 页面级组件
│   │   ├── car/           # 小车系统页面
│   │   ├── cloud/         # 云端系统页面
│   │   └── index/         # 入口/导航页面
│   ├── App.vue            # 根组件
│   └── main.js            # 应用入口文件
├── package.json           # 项目元数据和依赖
└── vite.config.js         # Vite 配置文件
```

## 🤝 贡献

欢迎任何形式的贡献！如果你有好的想法或者发现了 Bug，请随时提交 Pull Request 或创建 Issue。

1.  Fork 本仓库
2.  创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3.  提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。有关详细信息，请参阅 `LICENSE` 文件。
