---
title: 雷电模拟器实现滑呗抓包
date: 2026-03-12T12:46:18+08:00
links:
  - type: site
tags:
  - Technique
featured: true
draft: false
---

<!--more-->

涉及工具：

- 雷电模拟器。负责提供安卓环境
- 狐狸面具。实测比原版面具好使
- LSPosed。
- 微霸。抹机
- 滑呗。直接应用市场下载就行。
- BurpSuite。官网下载的Community版本。

# 雷电模拟器实现改真机并进入滑呗

## BurpSuite的安装与证书

BurpSuite是windows上的抓包软件，相当于macos上的Charles。

具体差别可以参考：

| 对比         | Charles  | Burp Suite            |
| ------------ | -------- | --------------------- |
| 主要定位     | 开发调试 | 安全测试              |
| 用户群体     | 开发者   | 安全工程师 / 渗透测试 |
| 功能复杂度   | 简单     | 非常强大              |
| 自动漏洞扫描 | ❌        | ✅                     |
| 爆破测试     | ❌        | ✅                     |
| 插件生态     | 几乎没有 | 非常丰富              |
| Web漏洞利用  | ❌        | ✅                     |
| 学习成本     | 很低     | 较高                  |

下载网址：https://portswigger.net/burp/releases

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MzYwMWIwMTM3M2NjNjc3MGJiMjdmM2VhMmM4MTI3NjJfOXU3T2tHNU1yZFFwaVh6TnN2b1RLMm1JMDRDc2JEWllfVG9rZW46QmFCQ2JPZ0RDb2ZKU2x4Q2FuRWNtOEZnbnFnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

BurpSuite第一次打开界面如下，直接点击Next

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YTFlYmRiMzNmZGE5ZjUxYTc0YTA0MjE2YmI2M2UzMTZfcEtLaDZ1R2lYTTNBdFpCWE5BU2hEZUVDRVg0MENHUWJfVG9rZW46RE42WmJkTnVzb0JMZEx4WlJwNmM1bTBBbmlpXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

继续点击Start Burp

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MWY2MmZmOWVkYzNjNTdkMGY4YjJkYzAyNWRkMDkzY2RfODBVSkJEZUUxRERFVElFOTVoZkw4ZTZoaUdTYTdlblZfVG9rZW46SjVjMGJQVUJMb0hWSml4ZmtTeGNWUjJpbjNBXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

进入后主界面如下

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MzJlMjcwN2JlMGUwZWQ0ODNiZmZjMTA5ZDMyNGEwNDBfaXRYcm00TGx1YTZQaU1xdzdZVVRVVFlBY0I1Rm4zOXBfVG9rZW46UWVrRmJZMXlOb1BDaEN4WlRteGNrUjdObkNlXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

Proxy Listners进行add一个

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NjhkMjY0Y2IyMmIzZWFkZDQ0YmVmYjdiODNjOWI2NTlfdU1QUGsxVzNRQk93UG1rb2JHbmEyZUluVzVRSXJObFNfVG9rZW46RVhSZWJXQU9Ib2MyNjh4aWpJeWNiWWxubldoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

下面选择宿主机的IP：`192.168.110.98:8899`

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NGMyOTVhOTYyYTEzYzYzNGI1YWQwZTk2NDNmMGNlYTFfNkRzZjkwTmZ5QmNrUERGWUFYaVREeXgwZEd2RThqTHZfVG9rZW46SVdmR2I0NXFBb0w2Yk54eGFhSmNjUDhubmRmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

如下图所示添加成功

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MzlmYTEwZDQwM2NlMDUyYzEwYzAwNmY0ZGRmNmRjZDVfS1EwaXpVM2RJdVFhcWhZeE1vRjh5UlNFbnk3aW5VV2lfVG9rZW46QWVMNmJvWlNHb2JXQmR4OVpQeGNzQkxxbjllXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

浏览器访问`192.168.110.98:8899`，显示如下，表示成功，点击②下载证书

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZmY4ZTkxOWQ3ZTgzODRjZGRkNDk4MTBmZTIxZTFmMWNfZVltalJEU25RUzZlYVlUNlJuVW9zb2ZOUFB5WFdIa3JfVG9rZW46R1ZiZGJ2YlZZb0dvQmR4bGRzRGN3aWo0bnVjXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=OGM1MWRmZDNmNGNiZTMzZGNjOWUyNTg5NjgyZGY0MjJfWm1TOUEwdWpHRnVpQ2ozUGp0ZXl6SjVPUEpmeDFTamZfVG9rZW46V0RNVWJLaEo3b1k5ckJ4Mkk4U2NFa1RQbkNjXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

### 将der证书转换成CER格式

用下面网址进行转换得到CER格式证书：https://fly63.com/tool/certificate_conversion/

保存下来，后面会用到。

## 雷电模拟器的安装

官网：https://www.ldmnq.com/

直接下载安装即可。

安装完成后，打开应用，会自动安装一个系统，可以就直接使用这个系统，但是需要进行一些设置。

1（可选），试图切换成手机版显示，方便桌面放下更多的窗口

2 磁盘共享改为System.vmdk可写入

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NzZlZjNmMTRlYzFiZTM4ODAzOGMzOWY5MjZmNDA3NjJfSk9FeUxRSjlySVdmenNBeUhQcVJYeW5IN3JyM05lREJfVG9rZW46WFd4VGJ1S0JNb1JZcnB4MVpWT2M2R1RjbnBoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

手机型号我这里设置的是OPPO PCLM10，测试为成功，其他机型没有进行测试，可自行进行测试。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MmUwYmZkMmFhYzc1ZGIyMmQ4YmJjN2Y4NDlhMWZhZjBfS1lJZHV2YWlyVjlXa0p6bWJOTVMxdjRkakxvZ2VCQnJfVG9rZW46UmVDamI4NkxZb2gxQUl4SWdnSWN1S1V5bnNmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MTNlODE2NzliMWE4NWEyNjViMzQ4MmRmMTExN2UxNDRfb2RJUE85QUhUanBwMTQwZ3B4VldjanlTUTlDRGlPVW1fVG9rZW46QzV5Z2J3dzk1b0o5b3J4NXc0amNsMW96bjRnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

ROOT权限切换为“开启”

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZTUzMjE3ZTliMzAzZmM0NDEwNDc0MGJkODcwM2Y1NTlfRTM0MHBmRmJ6aGprQmpLNGhBT01jTEhwYVhoZkxLMEZfVG9rZW46QzM4dmJFU2Nwb1pGY2Z4ZTl1OWNpWFpzbk9oXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

此时已经创建好一个安卓9.0的模拟器，点击“启动”

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NGU3NTUxODE5YThiZjQxODdhMjQ1YTNkY2VkNGRjN2RfWUpvR2IzYVJaVGVOa0hXUHJsU01ZaTVMUHg4blo3V3hfVG9rZW46SVhOOWJWeVJSb3NjcWR4bFJKbGNLZDhsblhkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## 文件的下载与滑呗的安装

将下面的文件传入雷电模拟器的共享文件夹。

主要包括：狐狸面具apk、LSPosed的zip、LSPosed的apk、BurpSuite证书、MT文件管理器、Postern-v3.1.2、微霸。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=OGI0YTA1NzkzZDgxOWU0ODlmZmI4OWYwODM4YjUxNWJfa0wyUnVrTjRhTHllS0djU0NZVGxkd1ViMXRHbFhSR1BfVG9rZW46T3J3Y2JFTFNCb2RFWmR4TnpYV2N0MTIwbkFmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

自行下载滑呗，能在本手机上运行的版本即可。当前直接打开滑呗，会显示安全警告，因为可以检测到这是模拟器和ROOT环境，是不允许进入应用的（防抓包）。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NmQzZmJkM2RjYjk0N2ZiNjUzNjE2ZDExYjBiNjgwNmFfUXpUU2NJZXhpNDdzcHdGNGVsS1VTa1ZKN3o0ZW41bXlfVG9rZW46RmREWmJIVkRub2lQaDV4ZXRJcWNjcFpvbmpkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NzFlNWNjNDNhNThiZDBmZmFlNDA0ODFmMmY1ZDJkODZfdndjVGR0WTltS3VETXRUYWtpcWo0NnJ0NHF3TFZDRUJfVG9rZW46SHUwbGJvYU4yb1R0aVB4RFp2YWNXTGpVblFnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## 狐狸面具安装

这里我是在多开网下载的狐狸面具（https://www.duokaiya.com/786.html），版本是v26.4。

安装视频可以参考：[https://www.bilibili.com/video/BV1Er421W7J7](https://www.duokaiya.com/go/qZpfPD3n)

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MDM3ZTg2ZTllYWU1NjFiN2U5N2FmN2M0YzBjMmU5ZTdfTjI3ZGdLNWExUG84blNxdmd3N0p0Y3I2VHZpWFV5ejdfVG9rZW46Skp2ZGJzejhMb2cwOG54dVpJcWNkRkR1bkpjXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

直接将狐狸面具的apk拖到模拟器中进行安装。

给其允许永久超级用户权限。

可以观察到当前Zygisk等都是没有安装的，版本号也没有显示。

点击Magisk的安装，允许访问媒体资源。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MDc5MjNjNWQ4NGZjYWM3ZGE3NDk4NTU0MDZiOGUxN2ZfSkpFSG5waEkyNUZyTDdTcFhGWG9IQmVUT0ptb05xeFJfVG9rZW46V2Z4WWJnaGtTb2xSUDF4UDlyV2NjYXRjblZoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YTMxN2RjMTEyYmNlNjBiN2IzNWZjYzI1M2UxZTQ4Y2NfaDNPV09rT1QzcU9JZHZXdlU0VG9OYmpQTjhpQ2JnMTBfVG9rZW46Vk9CY2JHTHhhbzVTWmV4R1oxY2NkSjkxbkVkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YTlkZmI0ZmY3MTJmOTM4OGZiMTdiYmIwMGMwOTYwYThfeENZb2c3eFFyZDZaWEs3bjlCU0hCTWJldHNuSFdzZ2JfVG9rZW46TkRSdWJlVWNQb24ycjJ4eUg3WGNpV2NIblJoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

选中安装到Recovery，点击下一步，有时候会发现没有直接安装的选项。此时可以关闭应用后台，如果还是不行，就重启几次，过程中可以切换几次IMEI码，以及一定要检查一下是否开启了ROOT权限。

当安装方式出现了三个选项的时候，选择“直接安装（直接修改/system）”，并点击开始按钮。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MDJjOTllOGM0NTQxNmIyMDM1YWZkYmI1ZjdlZWY0MTVfcVVXTm5PUTBBQmFJUEtGeVozS3FMOFZKQTNVbEFRNm5fVG9rZW46SmJzd2JrT1ZYbzZLQ2d4N3B2N2NGdkdPbmNnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZmQ4ZGU0MTUxNTliMzExM2MzZGRiMWY2NTE1MTRjNjJfemxCNUltUmRHWnVXSmNVV0M0NENuTG4wTGRRMVJMRnFfVG9rZW46Q2huRmJqQjc3b0xaaTN4OEd4UGNxSUdsbmdjXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=Nzg1NGY0NmMwMzRjNTJiMGU0Y2RjNzdhY2UzNDk0Y2VfRFZWZ0pzdm5sQWtHcFhYTkl2dEk5QUpFSkZNNVlmSExfVG9rZW46VnpOd2I2YllBb0ZOZlh4dkVjcGMwVDVpbnNjXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

如图显示为安装完成界面。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NzU5NDA4OTQ1MjYyYmI2ZTE3Y2E4MTE5ZjNlMGFmZjBfMFZ3QUgyVFNWMDNtOWVralJGZ1VpNzZ1dEh6a0J4V09fVG9rZW46QzRtMmJrWjNyb3FBRDV4Q2JZaGNlbjhrbk91XzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

安装完成后，暂时不用重启。先退到桌面，进入“文件管理器”，进入`system/xbin`，找到`su`文件，长按删除。系统会提示“操作失败”，不重要，因为如果你再次尝试删除，会发现显示文件不存在，说明已经被删除。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NjgyOTViY2FlNTQyNjEzZTE5ZmVkMzk3YTU2NWI0YjVfaHF6c0thOG9Wd3RBNzY4M2N1ZXRqWDhhYlBKejJZemFfVG9rZW46Q1o1YmJCa0x5b1dDTzV4eDBGNWNJMXh4bkZoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZDFlNDY5MzdkMWYxZWJmN2FmNDE5YjdlODdkZjIzMGRfZlNqQ0I4dkppbUZXSUIwSjVTMThpYnEwaml3OTk1T0NfVG9rZW46U0E4eWJTSlFBb2xSa3h4dm1MZWNRWjBpbkVrXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NDU4ZGM1M2FkZjNhZTE5NzU4YTVkZjcyNTVmMTQ4Y2NfWXd0OVBCYXhQU2dmaEVENkZDaWM3T1FJS3JpdVZVQUdfVG9rZW46Ulhad2JOSkx0bzJ6MFB4REdXZWM0Z0x5blViXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

重启设备，进入狐狸面具。可以发现已经有了版本信息。

点击右上角设置，下滑开启“Zygisk”

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZDdiNzNhOTNhYjM4MWY5MmI2YjE2MWFhZTBhNzY2NWZfbG1UVnlydlNuZ3VuQ05qV2h4dzNwNFNXOXh2YmJLU3lfVG9rZW46Tm9ia2JYS2dybzN5S294cENJTmNmQ05oblJmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YzZiNmJjMDJiNWIyMGYyNTY4YjZjZDYyMTIzNDM3NDJfOEVSdndyb2p1SVNBRTZua0Z2bTZRNklRZmNGZU80ZzFfVG9rZW46RFRXUWJ5SjNUb0c0VGZ4OXlPTmNLR1lIbmpiXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## LSPosed安装

重启手机，再次打开狐狸面具，点击右下角“模块”，然后点击“从本地安装”。找到左上角，选择文件管理器，进入共享文件夹（默认直接点进Pictures即可）。

单击LSPosed-v1.9.2......zip进行安装

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YmExMzg2YmI4NGQ2Yjk3MWNiYjVjZTY3NjI4YTQ1YjNfa1hmRUJTM3NWb2hnMmhYczhncUVBRWlPeUZraTdlbFFfVG9rZW46RnZ0SGJIMGY2b2ZnREN4Y21sZWM4RlVZbjdnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=Y2NjYTlkNGZmYjViYmE3OTM1OGJmZTk5MmVlYTc5MjRfaFZMWTdHWWJKT0U5ZzhaS2p0dm03MU1MeEJsTGtOUVlfVG9rZW46T0U0TWJCeThFb3lHc0h4QVloQWNUdEZ4bkFnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZWNkZmNjZGI0YTVmOTA5ZDgyZjFiZjAwY2FjM2U4NTVfZURQMTJ5ZlRhT1UxUXVRMDdlOGNlYnJ0N1U1SlRwWWZfVG9rZW46WklrY2JhZHdub3lDbkV4THp6eWNtdUR5blVoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

安装完成如下图所示。再次重启。

重启后，下拉任务栏，单击LSPosed已加载区域，可以呼出LSPosed运行界面。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YzJmMjI3Y2RhN2M2YjllOTNhYzNlMzkyMzUwNjY4NjBfbUxNU1htdFY5dkMyT1kxenlURDFPd0w4Rlk4TlJ5aHhfVG9rZW46T2dDcGI1eHB0b0FsakR4eGtYVmNHZE00bjRjXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NTZmZDAyYjA2NTc3MDQ3NWFjMDY1Njg5MjgzNzM5MjdfQ05SaFYzcVhYMWhBNnpneUs0SDFKWjlMMjhCQ1ZFbHpfVG9rZW46TjluSmJrSFBHb1FmWTd4VTJ1QmNzRGpWbkNlXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NmYwNzI0OTFkMmRjNTA2ZjU2NTk3YjBlMDg5Njc1NDRfWmtsaE1pcEFiMkFTWTE4NkRONWEwOW5TZXRpU1lQaTNfVG9rZW46UTY3cmJLcUVjbzR4YzR4U0NPQ2NtQzFObjVkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

手机桌面是没有LSPosed的图标的，这是因为其是挂载在系统后台运行的。

如果想要LSPosed的图标，可以手动将LSPosed的apk拖入安装

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MjkyNWNjNTlhYTk5MjY5YTVmMTc3NTNjZTk4MjIyMWZfc1FwcEh1bXZ0RzYyWmF5TTFiSnhPOTYyeWtqVDN5YUhfVG9rZW46S2s1QmJuN1Uxb0p1eWZ4UXgzVWNINGs1blZmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## 微霸的安装与数据的抹除

下一步，拖动安装微霸。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ODY2ZTdiMzZjZTY1Y2IyYjE1MDU4MDIyMmNiYTc2YjZfSlJkekFFQUlZNm5NNDlMSTVKNnozeHkwaXdRdWFscHdfVG9rZW46TlVFYmJpOERqbzVoUmh4NDR2bGNXS2NnbjZnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

先不要进入微霸，进入LSPosed，然后点击模块，可以看到微吧霸，点击进入。

点击”启用模块“，将滑呗等需要隐藏信息的App打上勾。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZDgxY2I4MDE1MDBkZTBiZmYwZWMxNjJmMzcwMjE4Yjlfclk2djQyaVZvZFVyZUUyTXhrZjhxaEZGTmQ2eUlOcVFfVG9rZW46WjQyemI0VTRmb2gxaUd4RUtGaWN2U1cyblJqXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjkwMWQ5MGQ4NjA0MzZlNjQ3ODM4NjA5NTZhZDRjZjBfWXRmb3J0ck9Jd3B4dGEyeGlJU2g2aGcxcHZqVmdubVRfVG9rZW46VXhGcWJmOVN3b01sdkF4U1JIRGNyWDRObk1kXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZDAyZWUxYjEyYTgwMjgwYzZjZjUyNmZjM2QxZTEyZDVfaE03ckxmYjNNZFlFVHZCM0ZONTRTMlZMWDlDSThSUVBfVG9rZW46Rkk1cGJkS3RSb1IxZkp4bm9WY2NKZjZybjFmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

点击进入，基于超级用户权限。

如果正确按照上述步骤操作，进入微霸后会全绿，如下图所示。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NWZhMGFhZTVlN2FhZjY4ZjNiZWViYzczM2Y5MzBkY2RfUjJFd3Zjc283c1psVjNqaGNvM3o5OFhLZ09hMzlMME1fVG9rZW46S3R5a2IxYUpnb3lIbld4M0lNUmNXaTdtbnpiXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MjE3ODdmNjBmODVhZTczODExNTZhZDU1NTNmN2Q1YjBfMjZqTXNkR0tYSHlmSFJudTczYUI5NUxOTDZWQXdiZGFfVG9rZW46WDlDOGJTWjFKb0RoVmR4VXFLamMwdG5GbmpkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

点击”一键改机“，然后点击”选择APP“，选中滑呗。

退出，重新点击”抹除APP“，然后点击滑呗并确定重置应用。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MTUzODFlY2M3MTc2YmZmMTNkZGVhYzM5ZDU3ODVkZjZfVlZoeGZWSTlwb1V0cFI0ZHA4eVVxczB4VUVheWJHUlRfVG9rZW46QU55cmJUYjRib1Z2MEt4MmlvNGNXY0VSbnZnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ODZmNGZjZjM1NzcyM2ExNzZmMzI5Y2ViNGYyM2U1NjlfS3ZwREJUQUNNcmdoRWFTdk02S2ZVT2o0V2JSN1BTUHFfVG9rZW46TFpDcmJaaDAxb3RJWGN4NjN2cGNXd2dJbmtlXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjRmNWJhMDJhNjc4NTE1YmZhMWE3ZmRmMDdmN2Y2NmFfOWkwMkNjZTlNMXkzekNNaHN0a0ltQkhTdHdjcWNyT3RfVG9rZW46T3kwZWJPeVVGb1FGVGJ4OFZ5cmNmSjQ0blBHXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

最后退出到微霸一键改机主界面，点击一键改机并确定。最后提示请更新，但是实测是起到效果了的。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MmM1OWFhMzJmYWVjYzM0YTNkOWY1Y2FhYjRmNmE3YTVfUFBJSXo3SkJTNUl5MFJIdUFYdmx3VWpSbmI3OG9keHJfVG9rZW46V2FnOWJxMDV4b2lJSEp4U2hEb2NQaVdoblBRXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MTZjYTE2MzA0Y2ViYzgzNzRiYjk1NWQ5ODYyNmQ2ZDRfeE1kY0Y2UEtoRzY0RWw0R3drZzN2TFJiS002eVM3NlpfVG9rZW46RkE4R2JCb3Ywb2EycmR4bUVXa2NTT2ttbmNoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## 进入滑呗

到此可以成功进入滑呗，如下图所示。

如果还是不行，可以立即重启，以及重启后再重新在微霸进行一键改机的操作，再进入滑呗。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YTBmZDFjM2UyZDFhMWY3OTY4MjU3YTY1MWIyNzYxMWJfdGp3c3JaMlJzYXpYZlRKZHpoSmxuN0p3NVBWOFBaMHRfVG9rZW46RVR6dWIwOGtSb1JPdjB4cEhBUmNHcVVnbm1nXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NzBkODVmY2Q1ZTQ3MTRiZGZlY2Q5NDI4NmE1OTg4MTRfRFNjQnFpSVhiWGtUTmFHZVJkdWNFbFcyZDA5aFhYcXlfVG9rZW46SlpYZmJpNU9lb0p0YU94ckNiQmNLR25WbjBmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

# 雷电模拟器连接BurpSuite实现抓包

参考：https://blog.csdn.net/qq_19946787/article/details/147362268

## 证书的安装与移动到根目录

### 证书的安装

根据前面的教程，已经将BurpSuite的CER格式证书放到了雷电模拟器的共享文件夹中。

进入到安卓的共享文件夹端，单击CER认证文件，打开方式选择”证书安装程序“。

给证书取名如”burp“，然后确定。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NDUyMWY2NGU5MDFkYTQ5YWI5ZjdiZThmODE3NTM2YzVfeFZ2RXJ4N0YyUXpUa1N5cU5oNnd0VkhaQ2FQZlF4Y3RfVG9rZW46QjdTSWJrN09Bb3pEQWl4Z3U5ZGNvaWRpbnlFXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NmM3NDFmYmQwY2U0NmUzZmM5NWI1ZDA1YWMwNTE2ZDZfUmRjRXFrc3l4ekNJTXJpMWN5YnBhaHlzdGpJdHVTT1VfVG9rZW46RE9ZT2JNckJ6b0dPdDF4MnJRZWNlR1JXbjZlXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MmNlY2Y5NDEzM2ZkMTZlYjI1MmFjZjM5ODY0Y2FjMDhfdHdqOE9iU2dtdUF6Z200S3V1SkJUTU96QmtRdjdZemNfVG9rZW46S3E1cmJnbFZMb2gxRE94aTdabmN5QlBTbk1KXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

安装的时候，由于安卓系统安全性限制，如果没有设置密码，会强制要求你先设置密码。

例如我这里选择图案解锁。

然后重新点击一次证书安装程序，系统会提示”已安装burp“。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NjI0MWIxYTA0YTBhNDVmNTA2YzFlYjMxYzAxMDY3NjNfVk9leGVFb3VNWEEyRktFckJibW1sUzdrVDBPS2FmZWlfVG9rZW46VXZyNmJXMldkb1k2eDR4N3JpYWNaTjlsbnlkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YTI1YTNhNmE0M2NjZTEzZGFiODc2MjJjNzdmODQ1OGNfa1RSbkZyZkZFdlhZYWJvOEd3Z0owa2pXSnBxZ0Q2MHdfVG9rZW46V3JLR2IyZWFhb2JnU2R4YktJNWNnd1hibmljXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YzkyYzQxNWM5MGIzMDE2YjNjNjdmODk5YjAwMTg3YzVfSGNqWVplY0Y3dWlPTkdybG50cExmOWxpQkhuVUIxYlNfVG9rZW46WFlObmIydENSb1VGQVR4bHVDbmNtd254bmhlXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

安装完成后，进入手机的”设置-安全-加密-信任的凭据-用户“，如果有下图的这个就可以了。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YTQ5MTBlYjBjODUyNmFjZTg5ZmMxNDk4ZDMyZmQyNmVfcXJLWHM0TWE3ZTNhd0NDbjRBOWN5VXc5c1pRS0pDWFRfVG9rZW46SndzRGJuOTdzb3ZZOHV4NFdBMWNtOE9pbkJiXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

但是现在直接进入浏览器进入某个网站例如`www.baidu.com`会显示如下图所示。这是因为证书仍然在用户层面，而不是系统层面，正如上一张图所示。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=Yjg0YTEwNWZlZmE2ZDVmOGQzMDdmNDZlYTRkZmY4ODlfc2d2engwNkpUTlBBT3MyajdWN3RpeE1vUDFEVFN5aWRfVG9rZW46RUc0WmJqSWo3b3R0dTV4d0dxcmNEUnZRbjNmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

解决的办法是将证书移动到系统根目录。

### 移动到根目录

这里要使用到mt文件管理器，可以从https://mt2.cn/下载安装。

其中左边框的`data/misc/user/0/cacert-added/9a5ba575.0`是刚才已经安装的burpsuite的证书。

然后右边框的`/etc/security/cacerts`是系统的所有其他证书。

长按左边框的证书，将其移动到右边目录下即可。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MGZlOGU0MTRhYzM5ZjNkMmY5NzBiZmZmYzhjZWY2YmFfVk42aFlGSk10dEQ5SVVjWldYRFNBbTJXUkdjUGZvTjdfVG9rZW46QTFWTWJ2a2V4b2k5M3J4WXlYd2M2QndxbjFnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=OTU1ZTQyOWE0YTliOTVjYWY1ODJmMWRhNjA4YzM5NDVfcGtBOFFXRlpnYkNBZ001aVZLenVob2dVM0Y4VjlncG1fVG9rZW46Q0RGMmJOS1Zlb29BT2N4bjN4TWNSTTdQbm5oXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=N2I3NzNjNmEwMGY2MTJlYTQ0ZDI4ZGQ5YzJmMGE5MDBfRXFxRHhhZHU5bHZxUUtBVzNKRzlzSWFtNjhtS1h3YVVfVG9rZW46VGNaVWJXa3Jqb29SUHJ4bWNHeWNXanU2bkNlXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

再次查看设置中的证书页面”设置-安全-加密-信任的凭据-系统“，可以发现”用户“中的证书没了，移动到了”系统“中。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ODg4NWFhZGI1ODFmNWM2ZWNiYzRmYjkxNWEwMDk1ZDRfZHFMMXprcXlLYW5WcTFnY1VWR2h3aU1VUmtmQXc0akFfVG9rZW46TEFJZmJ5eUkwb3h0RFV4RFdtSWNGNzhabmQ5XzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## BurpSuite连接模拟器

前面已经实现了BurpSuite的宿主机端口`192.168.110.98:8899`的添加。

现在要做的是将模拟器的流量转发到这个地址即可实现抓包。

打开”设置-WLAN-设置-修改按钮“。

输入代理服务器：`192.168.110.98`和端口`8899`，保存。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YzFkYzBjYmMwZDI2YjRhZmQ4MzhjMTIyOTU3M2FmNmNfY2Zva0RHNGM3RFVmU05OS1k2b1pxT1MyVWpQbGo4ZzhfVG9rZW46V1hKY2JNUVZ3b1M2VEx4cGEwM2NCdWQxbjlkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=Y2VlZjU5ZTMwMTA2YTRjZDUwZGNiM2U2NDMxM2JhMWNfc0dVODIzd1RDRzJzMmd0SURaOVBPQlc3bHhBNnJ1cW9fVG9rZW46TG01SmI0NzY1bzhGUzF4andXbGNoTTVxbmtlXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## 测试引发的问题

在模拟器打开例如`www.baidu.com`，在Burp中可以成功捕捉到对应域名的请求，说明配置成功。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YWU3M2ZmOWYzMjIzOWEzNDU1MDY0ZDkyZDhlODQyZGVfSUJhUThhc1dDU1lLVVZmSlZYWjZtQzBkcVFtRllJN21fVG9rZW46RWJ0TmIwRXMybzUwQzd4dVRVM2NDeHN0bnJoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## Postern实现强制流量转发

上面测试中我们发现浏览器的流量已经可以通过BurpSuite捕捉到。

进一步的，我们可以开始测试打开滑呗是否能够捕捉到对应的请求，事实上仍然不能成功，具体如下。

问题现象：如下图所示，当打开滑呗中的某一张图时，左侧的抓包界面并没有任何的变化，说明流量并没有正确打到BurpSuite中。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YmI5MDkzZGU3NTJkZTMzZDYyNDVjMGZmODBiMzM2YWFfVHQ5TWRBWkZqN1NHZmhoR0c4QzdRYkM5Mk9qSGdKUG9fVG9rZW46UFZZamJqM1Y3b0dvSEJ4SDVwY2NENGlIbnJjXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

问题原因：这是因为有的app是不会走系统wifi设置的代理的，就像是windows上虽然设置了clash代理但是terminal、git这样的应用仍然不会走clash的代理通道需要单独设置一样。

解决方法：可以使用Postern来对所有系统的流量强制进行转发到指定端口。

在https://github.com/postern-overwal/postern-stuff/blob/master/Postern-3.1.2.apk进行postern的apk下载并拖入安装。

安装完成后打开，显示版本比较旧，但实测可用。

进入后先点击取消配置VPN，删除现有的所有配置代理和配置规则。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZWFiZmEzZjI0ZmY2ZWNlYmZiNzEyOTEwOTEwMDQ4ODVfZE5TMnRsNzBiNmRJTGZ4TDBDOHUySGlWWU90VnpHSktfVG9rZW46RHFUdGJsZVBzb0Y5WEl4ZW93MGNzRXlSbjRiXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NTE0ZDY3NTY5NzA0YzMzZmU3Yzc3Yzk1N2IwODRiMTNfTlMzM242anhZSTNMaGUzYmVBZTkxTnZHdDdGSEtGNU5fVG9rZW46Rkc4WWIwMmY1b1pLNWZ4RnA2WmNpM2k5bkJmXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YWYwMDZjYzQ2MGU5MjMwOTkxMmI4Y2RkZTkzY2NhYjhfWUt0bGVMdzNpNnlQYUsxTTRveThNNjVBOU01b25xM2tfVG9rZW46RXdKdWJuM01tb3cyelR4ZjAzZmNmSDZybktoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

随后进入”配置代理-添加代理服务器“，然后配置代理服务器的地址和端口是burpsuite设置好的地址端口，代理类型选择HTTPS/HTTP CONNECT。点击保存。

然后进入”配置规则-添加规则“，然后配置如下面最右边图所示。匹配所有地址、通过代理连接，同时不要勾选”开始抓包“。点击保存。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=OTVmNjhmMDU0M2Q0ZGU0ODBmNTU1NWM4YWU4MzUzZTNfYWxjV1owcHdlZE92MlZrZFp0N2N1cENCMjFHUXVEY0hfVG9rZW46UDdHSGJOS1Awb0pzSUN4Y0xobmN6c2pqbnplXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=ZDBlNzU4OGIyOWZiMzM0MTk4ZjRlMzJlMzZlODhjYjRfTkU4cEx0bm9nbHdJMVlQbkhYek1MN3V1VDVERXpCeU5fVG9rZW46S3pPYmJJalhLb0xEOXd4UEtGa2NPaUtGblVjXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=MmJkMDgyZDRkMjQ1ZmMwYTA3ZTI1OWQ2MTM2YzkxMDVfZko1dElGWHhuRDVQMXlTWjQ4bkZhdVU3UHlpem02OVBfVG9rZW46Wm53cGJyYzZEbzByZTl4UnFpMWN1cVlxbm1lXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

最后，点击”打开VPN“，点击确定。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NzM3OTcwOTBkNmVmYmE3NmNhNDg0ODEzOGQ3ZmM3YjdfUlZKSFM0NVpoREFnc3Y1Y2xvU1J5Yll6ZHpLNEpXVWpfVG9rZW46SjliamIyVU1Hb3REMkF4SjNLUWNzOXdublVzXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NTI3MGRkOGRjOTliMTRlMGZkMWViNDBhNzQ0ZWRjYmFfNHZwWlhWM1JSNlFnbGN6RXAxa2FnZ0JrU05IczZ3dW1fVG9rZW46TUVoNWIxbXR6b1NJTnV4eWluNWNFbHVybkRoXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

## 测试滑呗抓包

配置完成后，再次进入滑呗进行抓包测试。

如下图所示，可以发现再次进入滑呗照片页面后，可以成功抓取到资源。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NTRhY2EwYzU2OTMyOGEzYWU3NGE5OWMxOGQ1OTQ2ZmZfTVZyVlZPTVpxakw0YlBUdUxWQXNhV1VTSmtuR0tyUHBfVG9rZW46Tkd4QWJTNzBYb1B2Y2p4aHNxUWNidXBsbjFlXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

点击其中的一张图片，在Response界面选择Render，可以看到图片预览图。说明确实成功获取到图片资源。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NDA3ZGI5NmQ2NjRhNWEyNjM4NjE5ODRkOWVhYTEyZmVfOWlIcVA4cDFjR0xUTG5YS2p0Y1dZNjFsdThlTzVGS0dfVG9rZW46SmdnY2IyeWs1b2szNUR4d0pvZmN1YXpCbmVnXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

# 当前方法的限制

观察图片的Request和Response信息，可以发现能抓取到的图片信息只有两类：

- 700清晰度的带水印图片

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NjcxMjZlMDExOTg0ZGYzMTgzNTVlZGY5NjUwNTY0ZDZfYkJwUERHNTRSQkZTYndtNHhTRVRvbU5xYzhZcHYxTHlfVG9rZW46VkRXUmJpRDhSb0liTmt4eVdqcGNRakpvbndkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

其请求体是：

```HTML
GET /prod/photo_wall/96/2026-03-08/photo/37ee0ee5-ea3f-1190542108089434112_x700.JPG?auth_key=1773287021-45c57fdfb93640e48602a66e10843f6c-0-b63af890daad6c0879ad8d9c09a85382 HTTP/2
Host: imgali.fenxuekeji.com
User-Agent: 
Connection: Keep-Alive
Accept-Encoding: gzip, deflate, br
```

- 300清晰度的不带水印图片

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=NzUzNjM1OTY2N2Y4YTlhMzI2NWNhNjc4MjM1ZWJkNzVfNWIyUDBJdFM2bjk1SFBvTW55bTlqS2ZIcVdHdnQ0Z09fVG9rZW46SWlzUmJydkFBbzdMSk54c1BYNGN4TWNqbkNZXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

其请求体是：

```HTML
GET /prod/photo_wall/96/2026-03-08/photo/6731605d-e53e-1190542069326073856_x300.JPG?auth_key=1773287021-c718bc118d0d465d9f3e52507efa1234-0-4b64786be6607ec717a21a2ce235d558 HTTP/2
Host: imgali.fenxuekeji.com
User-Agent: 
Connection: Keep-Alive
Accept-Encoding: gzip, deflate, br
```

# 付费图片的抓包

为了搞清楚付费图片的抓包网络请求逻辑，我自费购买了一张1080p 16.9元一张的图片。

可以看到，购买后的图片右下角会有一个下载按钮。

![img](https://oa3czxzloyj.feishu.cn/space/api/box/stream/download/asynccode/?code=YWUzNmI0MjY5ZTFjN2FiOWQ4YWRmZTRhNDM2MjMwMmNfeGM2dGRERnBodFFMa1pHTDZZeVR2SlBMb3Q4TlFRMzdfVG9rZW46Q0ltOGJLbGVvb2U1OFp4SkVtMWN3Z01xbjBkXzE3NzMyOTA4Mzk6MTc3MzI5NDQzOV9WNA)

点击下载按钮，能够捕捉到下载图片的请求。图片较大，所以是通过两次请求分批获取的。两次请求的请求体分别是：

```HTML
GET /prod/photo_wall/96/2026-03-08/photo/37ee0ee5-ea3f-1190542108089434112_x3000.JPG?Expires=1773290659&OSSAccessKeyId=STS.NZSG6Vx55M3k4A3bRnMULEg6A&Signature=QkD9u5%2B7C0m1totVrZ1HTC9b2y0%3D&security-token=CAIS2gJ1q6Ft5B2yfSjIr5nmDIzileoU%2BvGANmeChlI7QdpgqqKdozz2IHlPeXVgCe8Zv%2F83nmpQ6fYflokiEsdJHR2YYcAgscgLqV35aoGZsJXlvORZ08ysSDKdU0ZzIUs4xb6rIunGc9KBNnrm9EYqs5aYGBymW1u6S%2B7r7bdsctUQWCShcDNCH604DwB%2BqcgcRxCzXLTXRXyMuGfLC1dysQdRkH527b%2FFoveR8R3Dllb3uIR3zsbTWsH9MZg3YscvA43qjL0nJ%2Fv7vXQOu0QQxsBfl7dZ%2FDrLhNaZDmRK7g%2BOW%2BiuqYQ0cVMpNvdlSvUc9qKkyq0loIvdh4Ps0AxANO1YST7YQI2wR19WtgUw17zTHJeM2BSlurjnXvGdOBP8aliQZQgDvVZ1n7PMrdiIni2bS8npsRmBeVzYaIOOs4oNsoFurH7jhrHnSRXxBdvQv0kWUnrkBRN1X3Z%2BGoABXxamGSIBgXUZoU7ibQtdXYXPY%2BiCoL86qGgFYSKxAdWqFqinM6PDMVjUDxlBwcmfwqOGwyqZrGdL960MVzJexlLYU6nCSUnhF3zosye5FgWXBPdV%2FXG24lzYpW1ZcjACaKPnWZwI9%2B37TeUwZT5fU4M4j%2B1p%2FrPlp7aRjmmg0GIgAA%3D%3D HTTP/1.1
Range: bytes=0-822668
User-Agent: FileDownloader/1.7.7
Host: fxphoto.oss-cn-beijing.aliyuncs.com
Connection: keep-alive
Accept-Encoding: gzip, deflate, br
```

和

```HTML
GET /prod/photo_wall/96/2026-03-08/photo/37ee0ee5-ea3f-1190542108089434112_x3000.JPG?Expires=1773290659&OSSAccessKeyId=STS.NZSG6Vx55M3k4A3bRnMULEg6A&Signature=QkD9u5%2B7C0m1totVrZ1HTC9b2y0%3D&security-token=CAIS2gJ1q6Ft5B2yfSjIr5nmDIzileoU%2BvGANmeChlI7QdpgqqKdozz2IHlPeXVgCe8Zv%2F83nmpQ6fYflokiEsdJHR2YYcAgscgLqV35aoGZsJXlvORZ08ysSDKdU0ZzIUs4xb6rIunGc9KBNnrm9EYqs5aYGBymW1u6S%2B7r7bdsctUQWCShcDNCH604DwB%2BqcgcRxCzXLTXRXyMuGfLC1dysQdRkH527b%2FFoveR8R3Dllb3uIR3zsbTWsH9MZg3YscvA43qjL0nJ%2Fv7vXQOu0QQxsBfl7dZ%2FDrLhNaZDmRK7g%2BOW%2BiuqYQ0cVMpNvdlSvUc9qKkyq0loIvdh4Ps0AxANO1YST7YQI2wR19WtgUw17zTHJeM2BSlurjnXvGdOBP8aliQZQgDvVZ1n7PMrdiIni2bS8npsRmBeVzYaIOOs4oNsoFurH7jhrHnSRXxBdvQv0kWUnrkBRN1X3Z%2BGoABXxamGSIBgXUZoU7ibQtdXYXPY%2BiCoL86qGgFYSKxAdWqFqinM6PDMVjUDxlBwcmfwqOGwyqZrGdL960MVzJexlLYU6nCSUnhF3zosye5FgWXBPdV%2FXG24lzYpW1ZcjACaKPnWZwI9%2B37TeUwZT5fU4M4j%2B1p%2FrPlp7aRjmmg0GIgAA%3D%3D HTTP/1.1
Range: bytes=822669-
User-Agent: FileDownloader/1.7.7
Host: fxphoto.oss-cn-beijing.aliyuncs.com
Connection: keep-alive
Accept-Encoding: gzip, deflate, br
```

# 其他思路

可以考虑将一张低清晰度不带水印的图片+一张高清晰度带水印的图片同时喂给AI，让AI输出一张不带水印的高清晰度图片。

参考提示词：

```SQL
You are an image restoration and enhancement AI.

Input images:
Image A: low-resolution but clean image without watermark.
Image B: high-resolution image with watermark.

Task:
Use Image A as the main content reference.
Use Image B only for recovering high-frequency details such as texture, lighting, and edges.

Important rules:
- Do NOT copy or reconstruct the watermark.
- Ignore watermark regions in Image B.
- Reconstruct those areas using surrounding visual context from Image A.
- Output a high-resolution clean image without watermark.

Goal:
Produce a natural-looking, high-resolution version of Image A with enhanced details from Image B.
```