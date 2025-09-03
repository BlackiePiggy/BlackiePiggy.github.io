---
title: 自动控制原理Matlab仿真
date: 2023-10-26
links:
  - type: site
tags:
  - Course Project
---

<!--more-->

# 题目一
![20250903155253](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903155253.png2025-09-03-15-52-53)

## 1 Source Code

```
%源代码-实验-题目1%
t = 0:0.1:12; num = [1];            %步长；传递函数分母
Zeta1 = 0.1;den1 = [1 2*Zeta1 1];   %Zeta_n即阻尼比取值
Zeta2 = 0.4;den2 = [1 2*Zeta2 1];
Zeta3 = 0.6;den3 = [1 2*Zeta3 1];
Zeta4 = 0.8;den4 = [1 2*Zeta4 1];
Zeta5 = 1;den5 = [1 2*Zeta5 1];
Zeta6 = 0.707;den6 = [1 2*Zeta6 1];
[y1,x,t] = step(num,den1,t);        %构建阶跃响应函数
[y2,x,t] = step(num,den2,t);
[y3,x,t] = step(num,den3,t);
[y4,x,t] = step(num,den4,t);
[y5,x,t] = step(num,den5,t);
[y6,x,t] = step(num,den6,t);
plot(t,y1,t,y2,t,y3,t,y4,t,y5,t,y6);    %将六个曲线画在一个图上
grid on;
xlabel('t/s');ylabel('c(t)');
title('Unit-Step Response of \phi(s)=\omegan^2/(s^2+2\xi\omegans+\omegan^2)')
text(2.2,1.399,' \leftarrow \xi=0.1','FontSize',13);    %箭头注释阻尼比
text(2.6,1.15,' \leftarrow \xi=0.4','FontSize',13);
text(2.8,1.006,' \leftarrow \xi=0.6','FontSize',13);
text(2.8,0.9283,' \leftarrow \xi=0.707','FontSize',13);
text(2.8,0.8705,' \leftarrow \xi=0.8','FontSize',13);
text(2.8,0.7689,' \leftarrow \xi=1','FontSize',13);
str = {'\omegan=1'};                %注释Wn取值
text(1,1.7,str,'FontSize',13)
```

## 2 分析

题目要求为画二阶系统阶跃响应，故选用step相关指令。由于此处涉及到对t的显示范围和步长的设置，故应用[y0,x,t] = step(num,den,t)指令。此处num为闭环传递函数的分子。由题可知，Wn=1，故num为1，六根曲线可共用。den为分母。此处从0、1到1取6个量0.1, 0.4, 0.6, 0.7, 0.8, 1，分别用变量Zeta n来表示不同阻尼比。

Wn=1，故分母1s^2+2ξs+1，其系数分别为1，2ξ，1，故den n = [1 2*Zetan 1]。之后利用[yn,x,t] = step(num,den,t)和plot(t,y,...)来将六根曲线绘制在同一张图上。同时，题目要求进行标注，此处我采用text指令，括号内从左至右分别表示坐标、左箭头、标注内容、字体大小。通过Figure工具栏中的数据游标功能可以确定想添加注释的坐标。

## 3 结果

如图1-1所示。

![20250903155339](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903155339.png2025-09-03-15-53-40)

从图中可以观察到，当阻尼比ξ位于0.1～1之间时，随着ξ的增大，有：超调量Mp%变小，故系统的稳定性变高；曲线第一次与y=1的交点不断右移，即上升时间tr变大；峰值横坐标不断右移，即峰值时间tp变大；调节时间ts变小。即阻尼比越大，时域前期响应变慢，但更快趋于稳定。

当阻尼比ξ=1时，曲线一直处于y=1下方，即没有超调。但前期响应较慢，快速性不及ξ<1时的系统。ξ=0.707时，具有较好的综合性能。

## 4 反思总结

联想到课程中学习的内容，在二阶系统阶跃时域响应中存在一个"最佳阻尼比"的概念，在本题目中我也将其绘制在了图中。可以看到，在最佳阻尼比的情况下，超调量很小，且响应速度也比较可观，在"快、准、稳"上有一个比较好的平衡。

另外，对于阻尼比的理解，我将其比喻为"一个反向力"。在阻尼比为0时，即任其震荡，时域响应反应为等幅震荡。随着这个"反向力"增大，其振幅的衰减会加快。当阻尼比大于等于1时，这个力便会大到直接让其不发生震荡。

# 题目二

![20250903155415](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903155415.png2025-09-03-15-54-16)

## 1 Source Code
```
%源代码-实验一-题目3%
Zeta1 = 1; num1 = [1*Zeta1];    %K=1的开环传递函数分子
Zeta2 = 3; num2 = [1*Zeta2];    %K=3
Zeta3 = 5; num3 = [1*Zeta3];    %K=5
den = [1 2 3 2];                %开环传递函数公共分母
den4 = [1 2 3 3];               %K=1的闭环传递函数分母
den5 = [1 2 3 5];               %K=3
den6 = [1 2 3 7];               %K=5
num = [1];                      %闭环传递函数公共分子

figure(1);                      %画图1
subplot(211);
sys1 = tf(num1,den);            %K=1的开环传递函数
margin(sys1);                   %画Bode图并求裕度
subplot(212);
nyquist(sys1);                  %画nyquist图
grid on;

figure(2);
subplot(211);
sys2 = tf(num2,den);
margin(sys2);
subplot(212);
nyquist(sys2);
grid on;

figure(3);
subplot(211);
sys3 = tf(num3,den);
margin(sys3);
subplot(212);
nyquist(sys3);
grid on;

figure(4);
sys4 = tf(num,den4);            %K=1的闭环传递函数
sys5 = tf(num,den5);            
sys6 = tf(num,den6);            
t = linspace(0,50);            %横轴取值范围0到50
y = linspace(-5,5);             %横轴取值范围-5到5
y1 = step(sys4,t);              %构建K=1时的阶跃响应函数
y2 = step(sys5,t);
y3 = step(sys6,t);
plot(t,y1,t,y2,t,y3);           %将三个时域响应函数画在一张图上
```

## 2 分析过程

由于将三个Bode图画在同一张图上容易看不清，故将k=1，3，5分别画出其Bode图与Nyquist图。

由于此处需要求出Bode图的两个裕度，故采用margin()指令，可简易完成该操作，只需分别构建margin()对象系统。分别构建k=1，3，5时的开环函数分子与分母，用sys n = tf(num,n,den)指令对传递函数进行构建。将构建好的sys1,sys2,sys3分别用margin()和nyquist()画图即可。最后，为比较时域动态性能，将三个系统的闭环函数分别构建为sys4，sys5，sys6，并用题目1中的方法画在同一张图上对比。

## 3.结果

如图2-1，当k=1时，由于转折频率前的幅频曲线（对数）直接与L(w)=0dB重合，由margin()指令结果可知，相位裕度为Inf，即无穷大；相位交界频率Wg=1.73rad/s，增益裕度为12dB。两裕量均为正值，故系统稳定。从下方奈氏图可以看出：

N=0
通过计算开环极点可知P=0，故
Z=N+P=0
即系统稳定。与Bode图判断相吻合。系统中频段Bode图与L(w)=0交界处斜率为0，故稳定性好。但由于wc小，其响应没那么快。

![20250903155519](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903155519.png2025-09-03-15-55-20)


如图2-2，k=3时，右上图数据可得wc=1.56rad/s，相位裕度为17.1°，wg不变，增益裕度为2.5dB。此时，系统虽裕量不大，但仍能满足稳定要求。用对数稳定判据可得，相频曲线在wc左侧无穿越，同样可得系统稳定。从奈氏图中可以看出

N=0
同理  P=0
故  Z=P+N=0
故系统稳定。与Bode图结论吻合。系统中频段wc处以斜率-20dB/dec通过，且离斜率为0的频段较近，具有一定的稳定性，但没有k=1时稳定。wc比k=1时大，故响应变快。

![20250903155537](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903155537.png2025-09-03-15-55-37)

如图2-3，k=5时，由图上数据可得wc=1.86rad/s，相位裕度为-9.91°，wg不变，增益裕度为-1.93dB。裕量均为负数，故系统不稳定。从奈氏图中可以看出N=2，因为绕（-1，0）顺时针转了2圈，

同理  P=0
故  Z=P+N=2不等于0
故系统不稳定。与Bode图判断吻合。系统中频段wc处以斜率-20通过，但离斜率为0的段较远，导致了系统的不稳定。wc相比k=3增大，响应更加快速。

![20250903155545](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903155545.png2025-09-03-15-55-46)

## 4.反思与总结

对于中频段特性与时域动态性能的关系研究上，我还绘制了k在三个值下的时域响应曲线。可以从曲线上发现：k越大，系统响应越快，稳定性越差，调节时间越短，增益越大。但当k太大时，会出现失稳的情况，时域曲线表现为发散。如下图所示，与前面对于中频段特性的判断相吻合。

通过本实验，可以推断：欲使系统稳定，应保证Bode图上w0处斜率尽可能小，且离斜率更小的段更近，离斜率大的段更远。同时，也应使裕量更大，wc在wg左方较远处。这与教材中的结论一致。

