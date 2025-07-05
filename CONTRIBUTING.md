 # 贡献指南

感谢你对 AGV 智能巡检系统前端项目的关注！我们欢迎任何形式的贡献。

## 🎯 如何贡献

### 1. 报告 Bug
- 使用 GitHub Issues 报告 bug
- 描述清楚问题的复现步骤
- 提供环境信息（操作系统、浏览器版本等）
- 如果可能，提供截图或错误日志

### 2. 提出新功能
- 先在 Issues 中讨论你的想法
- 说明这个功能的使用场景和价值
- 等待维护者的反馈后再开始开发

### 3. 提交代码

#### 3.1 Fork 和克隆仓库
```bash
# Fork 仓库到你的账号下
# 然后克隆你 fork 的仓库
git clone https://github.com/你的用户名/VUE-CAR.git
cd VUE-CAR

# 添加上游仓库
git remote add upstream https://github.com/LeoFansure/VUE-CAR.git
```

#### 3.2 创建分支
```bash
# 从 main 分支创建新分支
git checkout -b feature/你的功能名

# 或者修复 bug
git checkout -b fix/bug描述
```

#### 3.3 开发和测试
```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 运行测试（如果有）
npm test

# 代码格式化
npm run format
```

#### 3.4 提交代码
```bash
# 添加修改的文件
git add .

# 提交，使用清晰的提交信息
git commit -m "feat: 添加了XX功能" 
# 或
git commit -m "fix: 修复了XX问题"
```

##### 提交信息规范
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 3.5 推送和创建 Pull Request
```bash
# 推送到你的 fork 仓库
git push origin feature/你的功能名
```

然后在 GitHub 上创建 Pull Request。

## 📋 Pull Request 检查清单

提交 PR 前，请确保：
- [ ] 代码符合项目的编码规范
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 所有测试通过
- [ ] 提交信息清晰明了
- [ ] 只包含相关的改动

## 🤝 行为准则

- 尊重所有贡献者
- 建设性地提出意见
- 接受他人的批评和建议
- 专注于对项目最有利的方案

## ❓ 需要帮助？

如果你有任何问题，可以：
- 查看项目的 [Wiki](https://github.com/LeoFansure/VUE-CAR/wiki)
- 在 [Discussions](https://github.com/LeoFansure/VUE-CAR/discussions) 中提问
- 发送邮件至：2692103675@qq.com

再次感谢你的贡献！🎉