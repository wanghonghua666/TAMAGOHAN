# TAMAGOHAN - 食事记录育成游戏

🥚🍽️ 通过食事记录培养虚拟角色的健康管理应用

## 🌟 项目概述

TAMAGOHAN是一个创新的Web应用，结合了食事记录和角色育成游戏的元素。用户通过上传食事照片，AI会分析食材并计算健康分数，这些分数会影响虚拟角色的成长和外观变化。

### 主要特色
- 📸 **AI食材识别**: 上传食事照片自动分析食材和营养信息
- 🧸 **角色育成**: 健康的饮食让角色变得更健康，垃圾食品会让角色变胖
- 📊 **详细分析**: 提供营养平衡、卡路里、健康度等多维度分析
- 📱 **响应式设计**: 支持桌面和移动设备
- 🔥 **实时同步**: 使用Firebase实现数据实时同步

## 🚀 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Firebase Firestore
- **存储**: Firebase Storage
- **认证**: Firebase Authentication
- **UI组件**: Lucide React图标库

## 📋 功能清单

### ✅ 已实现功能
- [x] 用户注册/登录/登出
- [x] 响应式导航栏
- [x] 角色显示和属性系统
- [x] 食事照片上传和预览
- [x] 模拟AI分析（未来将接入真实API）
- [x] 健康分数计算和显示
- [x] 食事历史记录
- [x] 统计数据和趋势分析
- [x] 美观的UI/UX设计

### 🔄 计划中功能
- [ ] 接入真实的图像识别API (Google Vision, Clarifai)
- [ ] 角色外观动态变化
- [ ] 社交分享功能
- [ ] 好友系统
- [ ] 成就和任务系统
- [ ] 营养建议AI助手

## 🛠️ 安装和运行

### 前置要求
- Node.js 18+
- npm或yarn包管理器
- Firebase项目（用于数据库和认证）

### 1. 克隆项目
```bash
git clone <repository-url>
cd TAMAGOHAN
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
创建 `.env.local` 文件并添加Firebase配置：

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Future API Keys (未来使用)
# GOOGLE_CLOUD_VISION_API_KEY=your-google-vision-api-key
# CLARIFAI_API_KEY=your-clarifai-api-key
# SPOONACULAR_API_KEY=your-spoonacular-api-key
```

### 4. 启动开发服务器
```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 5. 构建生产版本
```bash
npm run build
npm start
```

## 🗄️ 项目结构

```
TAMAGOHAN/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx          # 首页
│   ├── login/            # 登录页面
│   ├── signup/           # 注册页面
│   ├── meal/             # 食事记录页面
│   ├── history/          # 历史记录页面
│   └── api/              # API路由 (未来使用)
├── components/            # React组件
│   ├── Navigation.tsx    # 导航栏
│   ├── CharacterDisplay.tsx # 角色显示
│   ├── RecentMeals.tsx   # 最近食事
│   └── WelcomeScreen.tsx # 欢迎页面
├── lib/                  # 工具库
│   ├── firebase.ts       # Firebase配置
│   └── auth-context.tsx  # 认证上下文
├── types/                # TypeScript类型定义
│   └── index.ts          # 主要类型
├── package.json          # 项目依赖
├── tailwind.config.js    # Tailwind配置
├── tsconfig.json         # TypeScript配置
└── next.config.js        # Next.js配置
```

## 🎯 使用方法

1. **注册账户**: 访问首页点击"今すぐ始める"注册新账户
2. **登录**: 使用邮箱和密码登录（可以使用演示账户）
3. **记录食事**: 点击"食事記録"上传食物照片
4. **查看分析**: AI会分析食材并给出健康分数
5. **角色成长**: 查看你的角色如何根据饮食习惯变化
6. **历史查看**: 在"履歴"页面查看过往记录和趋势

## 🎨 设计理念

- **可爱风格**: 使用emoji和柔和的颜色营造亲和力
- **游戏化**: 通过角色育成增加用户粘性
- **简约实用**: 界面简洁，操作直观
- **响应式**: 适配各种设备尺寸

## 🔮 未来计划

### 短期目标
- 接入Google Cloud Vision API进行真实的图像识别
- 实现角色外观的动态变化系统
- 添加更详细的营养分析

### 长期目标
- 开发移动应用
- 添加社交功能和排行榜
- AI营养师建议系统
- 与健康设备的集成

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issue页面
- 邮箱: [联系邮箱]

---

🥚 **一起用TAMAGOHAN开始健康的生活方式吧！** 🍽️ 