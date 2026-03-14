---
title: "Office2021激活失败解决办法（找不到ospp.vbs）"
date: "2026-03-13T23:16:00+08:00"
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

# 问题

 今天在使用一键安装工具安装Office2021时遇到激活失败的问题，在水源并没有找到解决办法，具体情况如下图。

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260313_231531/media-001-1773414931750.png)

 已经连接上了交大VPN。 在图示报错信息的目录下并没有找到Microsoft Office文件夹。

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260313_231532/media-002-1773414932388.png)

 # 解决办法

 用everything扫了一下盘，发现ospp.vbs文件存放在非系统盘（我这里是S盘）下。

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260313_231532/media-003-1773414933076.png)

 可能是因为我执行一键安装程序时是把安装包放在S盘下的原因。 将cmd切换到对应目录下再执行激活程序就可以了（https://software.sjtu.edu.cn/Data/View/313）。如下图。

 这里需要管理员打开cmd，默认打开执行位置在C盘，直接 `cd "S:\Microsoft Office\Office16"` 是无效的命令。输入 `s:` ，单击回车，成功切换到s盘。再输入 `cd Microsoft Office\Office16` ，可以成功切换到目录下。

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260313_231533/media-004-1773414933556.png)

 激活成功。

 ![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260313_231533/media-005-1773414934186.png)

