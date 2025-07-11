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

### 🤖 LLM智能助手 (LLM Assistant)

- **自然语言交互**: 通过对话形式与系统交互，无需学习复杂的操作界面。
- **任务自动化**: 通过自然语言描述创建和管理巡检任务。
- **智能查询**: 快速查询最新缺陷和任务状态信息。
- **意图识别**: 智能识别用户输入的意图，自动路由到相应的功能模块。
- **上下文理解**: 保持对话上下文，支持多轮交互和信息补充。

## 🛠️ 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/)
- **开发工具**: [Vite](https://vitejs.dev/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **路由**: [Vue Router](https://router.vuejs.org/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **HTTP 请求**: [Axios](https://axios-http.com/)
- **工具库**: [@vueuse/core](https://vueuse.org/)
- **CSS 预处理器**: [Sass/SCSS](https://sass-lang.com/)
- **LLM模型**: [Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct)
- **推理框架**: [vLLM](https://github.com/vllm-project/vllm)
- **LLMOps平台**: [Dify](https://github.com/langgenius/dify)

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

### 5. LLM服务部署

#### 5.1 部署vLLM服务

```bash
# 创建并激活Conda环境
conda create -n vllm python=3.10
conda activate vllm

# 安装vLLM
pip install vllm

# 下载Qwen2.5-1.5B-Instruct模型
mkdir -p models
cd models
git lfs install
git clone https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct

# 启动vLLM服务
```bash
vllm serve Qwen2.5-1.5B-Instruct
```

#### 5.2 部署Dify平台

```bash
# 克隆Dify仓库
git clone https://github.com/langgenius/dify.git
cd dify

# 使用Docker Compose启动Dify
docker-compose up -d
```

#### 5.3 配置Dify平台

1. 访问Dify Web界面
2. 注册并登录管理员账号
3. 创建新应用，选择"对话应用"类型
4. 在"模型供应商"中添加自定义模型：
   - 名称：Qwen2.5-1.5B-Instruct
   - 类型：OpenAI兼容
   - 接口地址：http://localhost:8000/v1 （根据实际情况变动）
   - 密钥：（可留空）
5. 导入AGV助手.yml文件配置工作流
6. 点击"发布"按钮，选择"嵌入到网站"，获取iframe嵌入src的API


#### 5.4 前端集成配置

创建或编辑项目根目录下的`.env`文件：

```
VITE_BASE_API=http://your-dify-server-url
```

LLM组件会自动使用此环境变量构建完整的chatbot URL。

## LLM助手使用流程
1. 在任务管理界面点击"AI助手"按钮，打开LLM对话窗口
2. 通过自然语言与助手交互，例如：
   - "帮我执行一个巡检任务，名称是西段隧道巡检，从0米开始，总长3000米，创建人张三，执行人李四"
   - "查询最新的缺陷对应的任务信息"
3. 助手会自动识别意图并执行相应操作，返回结果
4. 对于复杂任务，助手会引导用户提供必要的信息

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
