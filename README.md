# 光之秘藏 · ULTRA VAULT

奥特曼与足球球星卡片盲盒网页：三种卡包、单抽、十连、翻卡动效、音效、本地收藏和可搜索图鉴。

卡池共 144 张：120 张奥特曼卡 + 24 张足球球星主题卡。

支持分类切换、默认开启的开卡音效与静音偏好保存。浏览器在第一次点击抽卡时启用音频。

纯静态 HTML / CSS / JavaScript，无需安装依赖。

## 本地运行

```sh
python3 -m http.server 4173
```

在浏览器打开 http://localhost:4173。

## 说明

- 抽卡免费，无支付和交易功能。
- 稀有等级及掉落概率为本项目自设，与官方实体卡包无关。
- 收藏保存于当前浏览器的 localStorage，不跨设备同步。
- 非官方粉丝体验。卡图索引来自 https://ultramancards.com/cards ，图片来自官方卡图域名 img.ultraman-cardgame.com；原有样卡水印予以保留，角色与卡图权利归各自权利人。
- 足球球员照片来自 TheSportsDB（https://www.thesportsdb.com/），卡框为本项目设计，非官方发行卡；等级为模拟体验设定，不代表真实能力值。
- 每张卡的图片来源可在 cards.json / football.json 中查看。
