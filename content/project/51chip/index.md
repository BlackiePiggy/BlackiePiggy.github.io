---
title: 微机原理51单片机综合实验
date: 2023-10-26
links:
  - type: site
tags:
  - Course Project
---

<!--more-->

## 题目要求

![20250903154605](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154605.png2025-09-03-15-46-07)

## 1 实验原理图
![20250903154622](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154622.png2025-09-03-15-46-23)

(本图片未更新，图中有错误，74LS138的G1应该连接P2.7)


## 2 Soure Code

```

;程序名称：微机原理及应用综合实验
;作者：李嘉渝
;学号：2019213109
;班级：测控19-3班
;----------------------------以下为主程序框架-------------------------------
;----------------------------以下为主程序框架-------------------------------
;----------------------------以下为主程序框架-------------------------------
    ORG    0000H
    LJMP  INIT
    ORG    000BH
    LJMP  ISR_T0
    ORG    0013H
    LJMP  ISR_INT1

INIT:
    LCALL  INIT_T0      ;初始化定时器0
    LCALL  INIT_INT1    ;初始化按键中断1
    LCALL  INIT_UART    ;初始化串口
    MOV    R5,#0  
    MOV    R7,#100
    
MAIN:
    JNB    F0,$      ;若F0为1，则主程序可执行
    LCALL  ADC_TO_R6    ;ADC采样，将采样数据存R6
    LCALL  ADC_TO_RAM    ;将R6中存储的ADC数据存到片外RAM0500H-050AH单元中
    LCALL  READ_N_OPE    ;读PA口状态,将读数与AD转换结果做异或运算，结果存储至40H单元中
    LCALL  DAC0832      ;取40H单元数送DAC0832转换
    LCALL  UART_SEND    ;串口发送R6和40H单元的数值
    CLR    F0        
    SJMP  MAIN
    
ISR_T0:
    MOV    TH0,#0FCH
    MOV    TL0,#66H    ;定时1ms
    DJNZ  R7,NEXT_T    ;不到0.1s直接返回主程序
    MOV    R7,#100      ;0.1s时重新赋值
    SETB  F0        ;使F0=1，可以进入程序执行主体
NEXT_T:
    RETI
    
ISR_INT1:
    CPL    TR0        
    RETI
;----------------------------以下为封装函数-------------------------------
;----------------------------以下为封装函数-------------------------------
;----------------------------以下为封装函数-------------------------------

;------------------------------------------------------------------------
;函数名称：INIT_T0
;函数功能：初始化配置定时器0与其中断，使之每1ms进入一次中断
;函数说明：
;------------------------------------------------------------------------

INIT_T0:
    ORL    TMOD,#01H    ;定时器1设置为8位自动重装，定时器0设置为16位模式1
    MOV    TH0,#0FCH
    MOV    TL0,#66H    ;定时1ms
    SETB  ET0        ;开启定时器0中断
    SETB  EA        ;开启总中断
    SETB  TR0        ;启动定时器0
    RET
    
;------------------------------------------------------------------------
;函数名称：INIT_INT1
;函数功能：初始化按键1中断
;函数说明：
;------------------------------------------------------------------------
    
INIT_INT1:
    SETB  EX1        ;开启按键1中断
    SETB  PX1        ;调整使INT1中断最高优先级，这样在定时器0中断时也可以触发按键中断
    SETB  IT1        ;下降沿触发
    RET
    
;------------------------------------------------------------------------
;函数名称：INIT_UART
;函数功能：初始化串口
;函数说明：波特率9600
;;------------------------------------------------------------------------

INIT_UART:
    ORL    TMOD,#20H
    MOV    SCON,#40H    ;配置串口输出模式
    MOV    TH1,#0FDH
    MOV    TL1,#0FDH    ;配置定时器1串口波特率为9600，默认SMOD=0
    SETB  TR1        ;开启定时器1
    RET
    
;------------------------------------------------------------------------
;函数名称：ADC_TO_R6
;函数功能：ADC采样，将采样数据存R6
;函数说明：采用数据总线连接方式，端口地址为C000H
;------------------------------------------------------------------------

ADC_TO_R6:
    MOV    DPTR,#0C000H  ;送ADC0809端口地址
    MOV    A,#2      ;送IN2通道地址
    MOVX  @DPTR,A      ;锁存通道地址并启动A/D
    NOP
    NOP
    JNB    P3.2,$      ;等待ADC转换完成
  
    MOVX  A,@DPTR      ;读ADC转换数据
    MOV    R6,A      ;将转换数据放入R6当中
    
    RET
    
;------------------------------------------------------------------------
;函数名称：ADC_TO_RAM
;函数功能：将R6中存储的ADC数据存到片外RAM0500H-0509H单元中
;函数说明：每进一个数据，所有数据往左移一位，原0500H数字被挤掉，新进的数字放在0509H中
;------------------------------------------------------------------------

ADC_TO_RAM:
    MOV    R1,#9      ;搬移数据9次
    MOV    R0,#01H      ;转移对象指针
    MOV    R3,#00H      ;转移目标指针
LOOP:
    MOV    DPTR,#0500H    ;赋起始地址
    MOV    DPL,R0      ;加上转移对象指针，指向被转移对象
    MOVX  A,@DPTR      ;取数至ACC
    
    MOV    DPL,R3      ;指向被转移目标
    MOVX  @DPTR,A      ;转移完成
    
    INC    R3        
    INC    R0        ;下一次转移
    DJNZ  R1,LOOP
    
    MOV    A,R6      ;将ADC转化结果放到ACC
    MOV    DPTR,#0509H  
    MOVX  @DPTR,A      ;存至第十个单元
    RET
    
;------------------------------------------------------------------------
;函数名称：READ_N_OPE
;函数功能：将ADC数据送至PB口。读PA口状态,将读数与AD转换结果做异或运算，结果存储至40H单元中。
;函数说明：端口地址B000H
;------------------------------------------------------------------------

READ_N_OPE:
    MOV    A,#99H      ;8255选择模式0，A口输入，B口输出，C口输入
    MOV    DPTR,#0B003H  ;CONTROL口地址
    MOVX  @DPTR,A      ;将控制字写给CONTROL口
    
    MOV    DPTR,#0B001H  ;PB口地址
    MOV    A,R6      
    MOVX  @DPTR,A      ;将R6的数送PB口
    
    MOV    DPTR,#0B000H  ;PA口地址
    MOVX  A,@DPTR      ;读取PA口地址至ACC
    
    MOV    B,A        ;PA口数据暂存B
    MOV    A,R6      ;取AD转换结果
    XRL    A,B        ;做异或运算
    MOV    40H,A      ;结果保存至RAM40H单元中
    
    RET
    
;------------------------------------------------------------------------
;函数名称：DAC0832
;函数功能：取40H单元数送DAC0832转换
;函数说明：端口地址D000H
;------------------------------------------------------------------------

DAC0832:
    MOV    A,40H
    MOV    DPTR,#0D000H
    MOVX  @DPTR,A
    RET
    
;------------------------------------------------------------------------
;函数名称：UART_SEND
;函数功能：串口发送R6和40H单元的数值
;函数说明：
;------------------------------------------------------------------------

UART_SEND:
    MOV    A,R6
    MOV    SBUF,A
    JNB    TI,$
    CLR    TI        ;串口发送R6数值
    
    MOV    A,40H
    MOV    SBUF,A
    JNB    TI,$
    CLR    TI        ;串口发送40H单元数值
    
    RET
    
    END
```


## 3 软件流程图

![20250903154750](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154750.png2025-09-03-15-47-52)

## 4 Proteus仿真

![20250903154807](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154807.png2025-09-03-15-48-08)

## 5 实验报告
![20250903154849](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154849.png2025-09-03-15-48-50)

![20250903154855](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154855.png2025-09-03-15-48-56)

![20250903154859](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154859.png2025-09-03-15-49-01)

![20250903154905](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154905.png2025-09-03-15-49-06)

![20250903154910](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154910.png2025-09-03-15-49-11)

![20250903154919](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154919.png2025-09-03-15-49-20)

![20250903154928](https://raw.githubusercontent.com/BlackiePiggy/homepage_picbed/master/homepage_img/20250903154928.png2025-09-03-15-49-29)