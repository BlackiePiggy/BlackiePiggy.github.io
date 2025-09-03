---
title: 测试数据处理与误差分析--最小二乘和回归分析的LabVIEW实现
date: 2023-10-26
links:
  - type: site
tags:
  - Course Project
---

<!--more-->

# 1 模块需求分析与功能设计

- （1）采用最小二乘法实现数据的处理，并将相关参数显示在前面板上；
- （2）采用回归分析实现测试数据点的显示与拟合曲线的显示，并将斜率$k$、截距$b_0$等参数显示在前面板上；
- （3）重复性测量情况下的方差进行分析，分别求出回归平方和$U$、参与平方和$Q$和离差平方和$S$并显示在前面板上；
- （4）对显著性进行检验，分别计算$F、F_1、F_2$，并利用合理的逻辑从$F$表中取出比较值与$F$进行比较，将显著性检验结果显示在前面板；
- （5）对不确定度进行评定，形成不确定度报告，将重要参数显示在前面板；
- （6）对粗大误差进行判定，如果有，指出数据中的粗大误差位置。如果没有，则判断其中没有。如果数据量小于10，采用格罗布斯法，如果数据量大于10，采用$3 \sigma$ 法则。

# 2 程序界面设计

![图2-1 程序前面板](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208092145665.png)

# 3 各模块数据处理原理与实现

## 3.1 测试过程与数据

- 1.测试过程
	- （1）第一次实验上机完成了回归分析的建立，完成了回归直线的显示并得到了相关参数值；
	- （2）第二次实验上机完成了方差分析与显著性检验的功能实现，完成了部分的界面设计；
	- （3）在课后完成了最小二乘法和回归分析两种方法完成了数据处理，并完成了粗大误差与不确定度评定的功能。

- 2.数据分析
  - （1）最后得到的回归曲线直线方程为：$\hat{u} = 4.37w+1.516$；
  - （2）回归系数为4.36826；
  - （3）$R^2$相关系数为0.99，相关性非常高，说明重复性测量消除随机误差的效果较好；
  - （4）$F、F_2$在0.01的水平上高度显著，$F_1$不显著，说明回归方程不显著可能与实验误差有关；
  - （5）不确定度为7.7109，展伸不确定度为17.4248；
  - （6）经过格罗布斯判定法，数据中没有粗大误差；
  - （7）经过手动验算对比，所有的数据均为正确结果。

## 3.2 基于最小二乘原理的传感器标定

### 3.2.1处理原理
**最小二乘法要求最可信赖值应在使参与误差平方和最小的条件下求得。**

为了确定$t$个不可直接测量的未知量$X_1,X_2,\cdots,X_t$的估计量$x_1,x_2,\cdots,x_t$，可对与该$t$个未知量有关函数关系的直接测量量$Y$进行$n$次测量，得测量数据$l_1,l_2,\cdots,l_n$，并有：
$$
\begin{cases}
Y_1=f_1(X_1,X_2,\cdots,X_t)\\
Y_2=f_2(X_1,X_2,\cdots,X_t)\\
\cdots\\
Y_n=f_n(X_1,X_2,\cdots,X_t)
\end{cases}
$$

用矩阵能简化求解该方程的过程：设有列向量

$L=\begin{bmatrix}l_1\\l_2\\\cdots\\l_n\\\end{bmatrix}$ $\hat{X}=\begin{bmatrix}x_1\\x_2\\\cdots\\x_n\\\end{bmatrix}$$V=\begin{bmatrix}v_1\\v_2\\\cdots\\v_n\\\end{bmatrix}$ $A=\begin{bmatrix}a_11&a_12&\cdots& a_1t\\a_21& a_22&\cdots& a_2t\\\cdots&\cdots&\cdots&\cdots\\a_n1& a_n2&\cdots& a_nt\end{bmatrix}$

令$V^TV\rightarrow min\quad or\quad V^TPV\rightarrow min$

经整理可得：
$$
\hat{X}=C^{-1}A^TL=(A^TA)^{-1}A^TL \quad or \quad \hat{X}=C^{-1}A^TL=(A^TPA)^{-1}A^TPL
$$
在本题一元线性回归的情境下
$Y=\begin{bmatrix}y_1\\y_2\\\cdots\\y_n\\\end{bmatrix}$ $X=\begin{bmatrix}1&x_1\\1&x_2\\\cdots&\cdots\\1&x_10\\\end{bmatrix}$ $b=\begin{bmatrix}b_0\\b\end{bmatrix}$ $V=\begin{bmatrix}v_1\\v_2\\\cdots\\v_10\end{bmatrix}$

可利用公式
$$
b=(X^TX)^{-1}X^TY=CB
$$
求得。因此需要将$U$的平均测量一维数组与一个$10\times 1$的常量1数组组合后，利用LabVIEW中的矩阵运算函数进行运算。

### 3.2.2程序实现

![图3-1 最小二乘实现](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208092138364.png)

如图3-1所示，此处Y矩阵为U取平均后的一维数组，X需要将重量一维数组和一个等长度的一维常数组（全1）利用创建数组合成，最后利用各种矩阵运算函数连接相关元素即可。

在前面板中可与线性回归法结果进行对比。结果完全一致，即$\begin{bmatrix}b_0\\b\end{bmatrix}=\begin{bmatrix}1.516\\4.36826\end{bmatrix}$，设计是成功的。

## 3.3 基于回归分析的传感器标定

### 3.3.1 处理原理

此处采用了重复性测量，因此进行重复性测量试验的线性回归分析，这与普通一元线性回归有一定的区别。

计算逻辑如下：


$$
建模序列：x_t,\overline{y_t} \quad (t=1,2,\cdots,N)\\
\\
\overline{y_t}=\frac{1}{m}{\sum_{i=1}^{m}{y_{ti}}}\\
\\
\begin{cases}
l_{xx}=\sum_{t=1}^{N}{{x_t}^2-\frac{1}{N}（\sum_{t=1}^{N}{{x_t}）^2}}\\
l_{xy}=\sum_{t=1}^{N}{{x_t}{\overline{y_t}}-\frac{1}{N}\sum_{t=1}^{N}{{x_t}\sum_{t=1}^{N}{{\overline{y_t}}}}}\\
l_{yy}=\sum_{t=1}^{N}{{\overline{y_t}}^2-\frac{1}{N}（\sum_{t=1}^{N}{{\overline{y_t}}）^2}}\\
\end{cases}\\
\\
\begin{cases}
b=\frac{l_{xy}}{l_{xx}}\\
b_0=\overline{y}-b\overline{x}
\end{cases}\\  

\Rightarrow\hat{y}=b_0+bx
$$

### 3.3.2 程序实现

![图3-2 回归分析](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208092225610.png)

如图3-2所示，步骤主要如下：

1. 读取表格文件，索引数组大小得出观测点数量N以及重复性测量次数m；
2. 索引数组取出横坐标x——重量的一维数组。索引数组取出10组重复性测量的电压数据二维数组；
3. 通过for循环索引重量的值，并进行累加，进行输出，求平均值、平方和等数据。通过索引循环二维数组电压数据的每一列，再次循环索引求出相同重量下重复性测量的平均值，求出电压平均值一维数组；
4. 求出电压平均测量值的平均值、平方和、和等；
5. 求出$l_xx,l_xy,l_yy$；
6. 利用步骤5求出的数据算出$k,b_0,b,R_2$;
7. 利用XY图绘制U的平均值——重量的散点图。同时利用$k,b_0$求出第一个点与最后一个测量点的估计值，将两点连线绘制回归曲线。

## 3.4 方差分析与显著性检验

### 3.4.1 处理原理

- **方差分析**

1. 回归平方和：$U=mbl_{xy}, \quad V_U = 1$

2. 残余平方和：$Q=Q_L+Q_E, \quad V_Q=Nm-2$

$$
\begin{cases}
失拟平方和：Q_L = m(l_{yy}-bl_{xy}),\quad V_L=N-2\\
误差平方和：Q_E = \sum_{t=1}^{N}\sum_{i-1}^{m}(y_{ti}-\overline{y_t})^2,\quad V_{QE}=Nm-N
\end{cases}
$$

3. 离差平方和：$S=U+Q_L+Q_E,\quad V_S=Nm-1$

- **显著性检验**

1. 回归方程显著性检验$F$

   $$
   F=\frac{U/V_U}{Q/V_Q}
   $$
   
   $$
   \begin{cases}
   F显著，说明直线回归方程显著\\
   F不显著，回归方程不显著，可能与失拟或实验误差有关
   \end{cases}
   $$

2. $F_1$ 检验

   $$
   F_1=\frac{Q_L/V_{QL}}{Q_E/V_{QE}}
   $$
   
   $$
   \begin{cases}
   F_1显著，说明失拟误差大\\
   F_1不显著，说明回归方程不显著可实验误差有关
   \end{cases}
   $$

3. $F_2$ 检验
   
   $$
   \begin{cases}
   F_2显著，说明实验误差是回归方程不显著的主要原因\\
   F_2不显著，说明实验误差不是回归方程不显著的唯一原因，可能失拟误差也是回归方程不显著的原因之一
   \end{cases}
   $$

查询F分布表中的$F_{\alpha}(V_U,V_Q),F_{\alpha}(V_L,V_E),F_{\alpha}(V_U,V_E) $，进行比较，得出显著性结果。$F>F_{\alpha}(V_U,V_Q)$表示显著（在$\alpha$水平上），否则不显著。

### 3.4.2 程序实现

- 方差分析

![图3-3 方差分析](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208092250167.png)

根据公式对数据进行运算处理。如图3-3，分别求得$U,Q,S$。

- 显著性检验

![图3-4 显著性检验](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208092251055.png)

如图3-4所示，主要步骤如下：

1. 利用公式分别求出$F,F_1,F_2$以及$V_Q,V_{QE},V_{QL},V_U$；
2. 建立三个F表常量二维数组（如图3-7所示），根据不同的$V_Q,V_{QE},V_{QL},V_U$从F表中利用正确逻辑取出比较值。由于F表行列往后不再按照整数+1递增，因此采用公式节点进行数值的计算，例如图3-5中所示逻辑；
3. 将$F_n$与取出的比较值进行比较，比较逻辑可见图3-6所示。根据不同的比较结果，使用条件结构对输出字符串结果进行对应输出。

![图3-6(1) 比较逻辑](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208092301161.png)

<center>
<img src="https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208092258332.png"><img src = "https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208092258196.png">
    <br>
    图3-6(2) 比较逻辑
</center>

![图3-7 各个表格](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208151106854.png)

## 3.5  测量不确定度评定

### 3.5.1 处理原理

1. A类评定

   通过一系列观测数据的统计分析来评定。

   常用评定方法：贝塞尔法、Peters法、极差法、最大误差法。

   如果用贝塞尔法，评定步骤如下：

   1. 由一系列观测值：$x_1,x_2,...,x_n.$

      用公式计算：
      $$
      \sigma = \sqrt{\frac{\sum_{i=1}^n{(x_i-\overline{x})^2}}{n-1}}
      $$
      2.用单词测量值作为测量估计值时，$u=\sigma$.

      3.用算术平均值作为测量估计值时，$u=\frac{\sigma}{\sqrt{n}}$.

2. B类评定

   基于经验或其他信息所认定的概率分布来评定。

   1. 分辨率

      实验仪器的电压表最小分辨率为1mV，区间半宽度为$a=0.5mV$，假设为均匀分布，则对应的包含因子为$k=\sqrt{3}$，则由分辨力引起的标准不确定度为$u_0=\frac{a}{\sqrt{3}}$.
   
   2. 示值误差
   
      假设示值误差为$U_x=3.5\times10^{-6}\times10V, k=3, u_{x2}=\frac{U_x}{k}.$
   
   3. 稳定性
   
      假设24h内电压表稳定度不超过$\pm15\mu V$，均匀分布，则$u_{x3}=\frac{15\mu V}{\sqrt{3}}.$
### 3.5.2 程序实现

![图3-8 不确定度评定](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/img-for-typora/202208151106184.png)

如图3-8，主要步骤如下：

1. 利用贝塞尔公式对索引出来的电压值进行不确定度进行计算，并且进一步运算得到重复性不确定度；
2. 利用格罗布斯法，索引得到了一列中的最大值和最小值，方法为循环索引并与移位寄存器中上次比较得到的较大（小）值进行比较；
3. 求出格罗布斯法公式求出$g$值；
4. 建立格罗布斯表，根据重复性测量次数索引出比较值；
5. 将两值进行比较，判定是否存在粗大误差，并将结果利用字符串在前面板进行显示。
