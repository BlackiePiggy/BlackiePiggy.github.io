---
title: 雷电模拟器实现滑呗抓包
date: 2026-03-12T12:46:18+08:00
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

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-001-1773300616707.png)

BurpSuite第一次打开界面如下，直接点击Next

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-002-1773300617062.png)

继续点击Start Burp

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-003-1773300617297.png)

进入后主界面如下

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-004-1773300617589.png)

Proxy Listners进行add一个

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-005-1773300617963.png)

下面选择宿主机的IP：`192.168.110.98:8899`

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-006-1773300618145.png)

如下图所示添加成功

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-007-1773300618383.png)

浏览器访问`192.168.110.98:8899`，显示如下，表示成功，点击②下载证书

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-008-1773300618649.png)

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-009-1773300618882.png)

### 将der证书转换成CER格式

用下面网址进行转换得到CER格式证书：https://fly63.com/tool/certificate_conversion/

保存下来，后面会用到。

## 雷电模拟器的安装

官网：https://www.ldmnq.com/

直接下载安装即可。

安装完成后，打开应用，会自动安装一个系统，可以就直接使用这个系统，但是需要进行一些设置。

1（可选），试图切换成手机版显示，方便桌面放下更多的窗口

2 磁盘共享改为System.vmdk可写入

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-010-1773300619115.png)

手机型号我这里设置的是OPPO PCLM10，测试为成功，其他机型没有进行测试，可自行进行测试。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-011-1773300619303.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-012-1773300619509.png)

ROOT权限切换为“开启”

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-013-1773300619759.png)

此时已经创建好一个安卓9.0的模拟器，点击“启动”

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-014-1773300619993.png)

## 文件的下载与滑呗的安装

将下面的文件传入雷电模拟器的共享文件夹。

主要包括：狐狸面具apk、LSPosed的zip、LSPosed的apk、BurpSuite证书、MT文件管理器、Postern-v3.1.2、微霸。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-015-1773300620212.png)

自行下载滑呗，能在本手机上运行的版本即可。当前直接打开滑呗，会显示安全警告，因为可以检测到这是模拟器和ROOT环境，是不允许进入应用的（防抓包）。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-016-1773300620428.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-017-1773300620617.png)

## 狐狸面具安装

这里我是在多开网下载的狐狸面具（https://www.duokaiya.com/786.html），版本是v26.4。

安装视频可以参考：[https://www.bilibili.com/video/BV1Er421W7J7](https://www.duokaiya.com/go/qZpfPD3n)

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-018-1773300620815.png)

直接将狐狸面具的apk拖到模拟器中进行安装。

给其允许永久超级用户权限。

可以观察到当前Zygisk等都是没有安装的，版本号也没有显示。

点击Magisk的安装，允许访问媒体资源。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-019-1773300621034.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-020-1773300621305.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-021-1773300621574.png)

选中安装到Recovery，点击下一步，有时候会发现没有直接安装的选项。此时可以关闭应用后台，如果还是不行，就重启几次，过程中可以切换几次IMEI码，以及一定要检查一下是否开启了ROOT权限。

当安装方式出现了三个选项的时候，选择“直接安装（直接修改/system）”，并点击开始按钮。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-022-1773300621760.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-023-1773300621979.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-024-1773300622158.png)

如图显示为安装完成界面。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-025-1773300622371.png)

安装完成后，暂时不用重启。先退到桌面，进入“文件管理器”，进入`system/xbin`，找到`su`文件，长按删除。系统会提示“操作失败”，不重要，因为如果你再次尝试删除，会发现显示文件不存在，说明已经被删除。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-026-1773300622584.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-027-1773300622798.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-028-1773300623011.png)

重启设备，进入狐狸面具。可以发现已经有了版本信息。

点击右上角设置，下滑开启“Zygisk”

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-029-1773300623259.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-030-1773300623549.png)

## LSPosed安装

重启手机，再次打开狐狸面具，点击右下角“模块”，然后点击“从本地安装”。找到左上角，选择文件管理器，进入共享文件夹（默认直接点进Pictures即可）。

单击LSPosed-v1.9.2......zip进行安装

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-031-1773300623754.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-032-1773300623943.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-033-1773300624191.png)

安装完成如下图所示。再次重启。

重启后，下拉任务栏，单击LSPosed已加载区域，可以呼出LSPosed运行界面。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-034-1773300624392.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-035-1773300624617.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-036-1773300624820.png)

手机桌面是没有LSPosed的图标的，这是因为其是挂载在系统后台运行的。

如果想要LSPosed的图标，可以手动将LSPosed的apk拖入安装

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-037-1773300625066.png)

## 微霸的安装与数据的抹除

下一步，拖动安装微霸。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-038-1773300625288.png)

先不要进入微霸，进入LSPosed，然后点击模块，可以看到微吧霸，点击进入。

点击”启用模块“，将滑呗等需要隐藏信息的App打上勾。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-039-1773300625530.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-040-1773300625742.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-041-1773300625937.png)

点击进入，基于超级用户权限。

如果正确按照上述步骤操作，进入微霸后会全绿，如下图所示。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-042-1773300626113.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-043-1773300626347.png)

点击”一键改机“，然后点击”选择APP“，选中滑呗。

退出，重新点击”抹除APP“，然后点击滑呗并确定重置应用。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-044-1773300626547.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-045-1773300626770.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-046-1773300626992.png)

最后退出到微霸一键改机主界面，点击一键改机并确定。最后提示请更新，但是实测是起到效果了的。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-047-1773300627195.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-048-1773300627384.png)

## 进入滑呗

到此可以成功进入滑呗，如下图所示。

如果还是不行，可以立即重启，以及重启后再重新在微霸进行一键改机的操作，再进入滑呗。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-049-1773300627624.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-050-1773300627885.png)

# 雷电模拟器连接BurpSuite实现抓包

参考：https://blog.csdn.net/qq_19946787/article/details/147362268

## 证书的安装与移动到根目录

### 证书的安装

根据前面的教程，已经将BurpSuite的CER格式证书放到了雷电模拟器的共享文件夹中。

进入到安卓的共享文件夹端，单击CER认证文件，打开方式选择”证书安装程序“。

给证书取名如”burp“，然后确定。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-051-1773300628100.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-052-1773300628316.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-053-1773300628559.png)

安装的时候，由于安卓系统安全性限制，如果没有设置密码，会强制要求你先设置密码。

例如我这里选择图案解锁。

然后重新点击一次证书安装程序，系统会提示”已安装burp“。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-054-1773300628775.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-055-1773300628983.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-056-1773300629194.png)

安装完成后，进入手机的”设置-安全-加密-信任的凭据-用户“，如果有下图的这个就可以了。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-057-1773300629408.png)

但是现在直接进入浏览器进入某个网站例如`www.baidu.com`会显示如下图所示。这是因为证书仍然在用户层面，而不是系统层面，正如上一张图所示。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-058-1773300629606.png)

解决的办法是将证书移动到系统根目录。

### 移动到根目录

这里要使用到mt文件管理器，可以从https://mt2.cn/下载安装。

其中左边框的`data/misc/user/0/cacert-added/9a5ba575.0`是刚才已经安装的burpsuite的证书。

然后右边框的`/etc/security/cacerts`是系统的所有其他证书。

长按左边框的证书，将其移动到右边目录下即可。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-059-1773300629942.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-060-1773300630207.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-061-1773300630413.png)

再次查看设置中的证书页面”设置-安全-加密-信任的凭据-系统“，可以发现”用户“中的证书没了，移动到了”系统“中。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-062-1773300630698.png)

## BurpSuite连接模拟器

前面已经实现了BurpSuite的宿主机端口`192.168.110.98:8899`的添加。

现在要做的是将模拟器的流量转发到这个地址即可实现抓包。

打开”设置-WLAN-设置-修改按钮“。

输入代理服务器：`192.168.110.98`和端口`8899`，保存。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-063-1773300630955.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-064-1773300631140.png)

## 测试引发的问题

在模拟器打开例如`www.baidu.com`，在Burp中可以成功捕捉到对应域名的请求，说明配置成功。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-065-1773300631460.png)

## Postern实现强制流量转发

上面测试中我们发现浏览器的流量已经可以通过BurpSuite捕捉到。

进一步的，我们可以开始测试打开滑呗是否能够捕捉到对应的请求，事实上仍然不能成功，具体如下。

问题现象：如下图所示，当打开滑呗中的某一张图时，左侧的抓包界面并没有任何的变化，说明流量并没有正确打到BurpSuite中。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-066-1773300631843.png)

问题原因：这是因为有的app是不会走系统wifi设置的代理的，就像是windows上虽然设置了clash代理但是terminal、git这样的应用仍然不会走clash的代理通道需要单独设置一样。

解决方法：可以使用Postern来对所有系统的流量强制进行转发到指定端口。

在https://github.com/postern-overwal/postern-stuff/blob/master/Postern-3.1.2.apk进行postern的apk下载并拖入安装。

安装完成后打开，显示版本比较旧，但实测可用。

进入后先点击取消配置VPN，删除现有的所有配置代理和配置规则。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-067-1773300632102.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-068-1773300632292.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-069-1773300632511.png)

随后进入”配置代理-添加代理服务器“，然后配置代理服务器的地址和端口是burpsuite设置好的地址端口，代理类型选择HTTPS/HTTP CONNECT。点击保存。

然后进入”配置规则-添加规则“，然后配置如下面最右边图所示。匹配所有地址、通过代理连接，同时不要勾选”开始抓包“。点击保存。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-070-1773300632733.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-071-1773300632917.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-072-1773300633140.png)

最后，点击”打开VPN“，点击确定。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-073-1773300633337.png)![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-074-1773300633580.png)

## 测试滑呗抓包

配置完成后，再次进入滑呗进行抓包测试。

如下图所示，可以发现再次进入滑呗照片页面后，可以成功抓取到资源。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-075-1773300633815.png)

点击其中的一张图片，在Response界面选择Render，可以看到图片预览图。说明确实成功获取到图片资源。

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-076-1773300634195.png)

# 当前方法的限制

观察图片的Request和Response信息，可以发现能抓取到的图片信息只有两类：

- 700清晰度的带水印图片

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-077-1773300634487.png)

其请求体是：

```HTML
GET /prod/photo_wall/96/2026-03-08/photo/37ee0ee5-ea3f-1190542108089434112_x700.JPG?auth_key=1773287021-45c57fdfb93640e48602a66e10843f6c-0-b63af890daad6c0879ad8d9c09a85382 HTTP/2
Host: imgali.fenxuekeji.com
User-Agent: 
Connection: Keep-Alive
Accept-Encoding: gzip, deflate, br
```

- 300清晰度的不带水印图片

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-078-1773300634755.png)

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

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153016/media-079-1773300634977.png)

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