---
title: 用codex写一个将飞书复制的富文本信息中的media信息自动上传oss并返回上传结果与替换media之后的结果
date: 2026-03-12T16:50:20+08:00
image:
  filename: featured.png
  focal_point: Smart
links:
  - type: site
tags:
  - Technique
featured: true
draft: false
---

<!--more-->

我想写一个网页，实现以下功能：

 - 主要功能是实现将飞书复制的富文本信息中的media信息自动上传oss并返回上传结果与替换media之后的结果
- oss在页面中提供自己上传oss信息的填写框并验证是否正确连接，先提供阿里云的oss通道。将图片上传到哪里的信息也可以进行选择，或者要求根据富文本文章的标题、或者其他信息自动生成对应新的文件夹。
- 网页中给一个粘贴富文本的区域与对应的渲染结果的部分，对于图片、视频这样的media信息进行单独的突出标注以及可以通过网页上的按钮”上一个、下一个“以及有对这种media信息的统计信息
- 点击开始替换后开始逐个图片上传并实时显示替换上传进度，最后将替换后的结果和渲染结果展示在网页中。
- 上传的富文本中的media可能是本地的图片，可能是飞书这样（__MEDIA_REPLACE_0_1773305378437__

 ## 第一次生成

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-002-1773305378833.png)

 网页效果

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-003-1773305379286.png)

 ## 第二次生成

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-004-1773305379581.png)

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-005-1773305379856.png)

 ## 第三次生成

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-006-1773305380064.png)

 ## Cloudflare+CodeX自动部署

 令牌：_uQbYMaCwao9UBOOh5vuCXEp2g2i-sQ70G6DUqDm

 测试指令：

```
curl "https://api.cloudflare.com/client/v4/accounts/fadeb8a5107d577b2344208d1987a722/tokens/verify" \
-H "Authorization: Bearer _uQbYMaCwao9UBOOh5vuCXEp2g2i-sQ70G6DUqDm"
```

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-007-1773305380349.png)

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-008-1773305380542.png)

 令牌：_uQbYMaCwao9UBOOh5vuCXEp2g2i-sQ70G6DUqDm

 账号ID：fadeb8a5107d577b2344208d1987a722

 我想要的项目名称：richtextautooss

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-009-1773305380761.png)

 自动部署好后，会直接给出对应的网址，

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-010-1773305380941.png)

 经过测试后，是可以成功访问的

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_164938/media-011-1773305381165.png)