---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 1c37b55858ee3f54ca52f16bb498ae75_feba9e1ea78311f1b874525400e6dd8f
    ReservedCode1: 1YfGBhdX7nS3SLennbzqxmK2siXciUIbEMM8di7V2oN6k6Wv69dT+ZUFMVduHn3vUBh8vfgwa3piQGIFBLs3jf5i/0jWTvVURmxYu3fbp7VpCxiqlCF5+OHhVZPZ2HlDz/ASa6P2tWzc4OJv+mxIrbcaAuRqcrzBN6nxuyFdcb+G0jOa2M86Oqpwk40=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 1c37b55858ee3f54ca52f16bb498ae75_feba9e1ea78311f1b874525400e6dd8f
    ReservedCode2: 1YfGBhdX7nS3SLennbzqxmK2siXciUIbEMM8di7V2oN6k6Wv69dT+ZUFMVduHn3vUBh8vfgwa3piQGIFBLs3jf5i/0jWTvVURmxYu3fbp7VpCxiqlCF5+OHhVZPZ2HlDz/ASa6P2tWzc4OJv+mxIrbcaAuRqcrzBN6nxuyFdcb+G0jOa2M86Oqpwk40=
---

# Stack Tower — 海外 3D 叠方块网页小游戏

一个零依赖、零服务器成本的海外休闲小游戏：3 秒上手，1 局 1 分钟，靠 Google AdSense 广告变现。

- 项目位置：`D:\StackTowerGame\`
- 技术栈：纯 HTML + CSS + Canvas 手写 3D 渲染（无任何第三方库 / CDN，断网也能玩）
- 适用设备：桌面浏览器 + 手机浏览器全适配

## 一、本地试玩

直接双击 `index.html` 用浏览器打开即可，无需安装任何东西。

操作：点击 / 触摸 / 空格 / 回车，让滑动方块落到塔顶。对得越齐分越高，「完美对齐」触发连击加分，没对齐会被切掉变窄，直到完全错开游戏结束。

## 二、文件结构

```
D:\StackTowerGame\
├── index.html        主页面（含 SEO meta / 广告位占位）
├── css\style.css     样式
├── js\
│   ├── renderer.js   手写 3D 渲染引擎（透视相机 + 画家算法）
│   ├── audio.js      WebAudio 合成音效（无版权素材）
│   ├── ads.js        广告接入层（默认关闭）
│   └── game.js       游戏逻辑（状态机 / 计分 / 切割 / 特效）
└── README.md
```

## 三、上线到互联网（免费）

推荐 GitHub Pages，全程免费、无需服务器：

1. 注册/登录 GitHub（`github.com`），新建一个公开仓库，例如 `stack-tower`
2. 把 `D:\StackTowerGame\` 里全部文件上传到该仓库（网页端直接拖拽上传即可）
3. 仓库 → Settings → Pages → Source 选 `main` 分支 / root 目录 → Save
4. 等 1~2 分钟，你的游戏就上线了，地址形如 `https://你的用户名.github.io/stack-tower/`

手机打开这个链接就能玩，这就是你的海外流量入口。

## 四、接入 Google AdSense 收广告费（关键变现步骤）

1. 访问 `adsense.google.com`，用你的 Google 账号申请
2. 第一步「绑定网站」：填你上面部署好的游戏地址
3. 按照 Google 提示在 `index.html` 的 `<head>` 里粘贴 AdSense 提供的广告代码（自动广告脚本）
4. 等审核通过（通常几天），后台开启自动广告，游戏顶部/插屏就会自动有广告展示，开始产生收入
5. 想赚更多：开启「激励视频」，玩家输掉后可看广告免费复活一次。此时解锁 `js/ads.js` 里的 `showRewarded()` 钩子，把复活按钮接到你的激励视频广告源即可（按钮 UI 和逻辑已就位）

### 变现点小结

| 位置 | 形式 | 状态 |
|---|---|---|
| 游戏顶栏 | AdSense 自动广告 | 接入后自动生效 |
| 游戏结束 | 插屏/贴片广告 | 接入后自动生效 |
| 输掉后复活 | 激励视频（看广告复活） | 已预留，接 SDK 后生效 |

## 五、运营建议（让广告费更多）

- 标题/描述已带 SEO 关键词，把游戏链接发到海外社交平台（Reddit、X、抖音海外版、游戏论坛）引流
- 加一个「分享」按钮可提升传播（后续版本可做）
- 保持一局短平快，海外玩家回访率高，广告收益才好
*（内容由AI生成，仅供参考）*
