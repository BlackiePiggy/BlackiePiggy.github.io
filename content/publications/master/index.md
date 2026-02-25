---
title: "基于多源时空信息的 GNSS 事件检测方法及其对高精度定位影响的研究"
authors:
  - 李嘉渝

author_notes:
date: "2026-01-23T00:00:00Z"

# Schedule page publish date (NOT publication's date).
publishDate: "2026-01-23T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ["master-thesis"]

# Publication name and optional abbreviated publication name.
publication: "SJTU Master Degree"
publication_short: "SJTU"

# 摘要
abstract: 全球导航卫星系统（Global Navigation Satellite System, GNSS）的现代化进程中伴随着多种影响系统完好性的GNSS事件。其中两类卫星端具有代表性且影响显著的事件分别是为增强抗干扰能力而主动实施的弹性功率操作，以及由老化或空间环境引发的星载设备被动隐性异常。当前针对此类事件的监测手段在检测性能与隐性异常识别能力上存在不足，且其对用户端精密定位的影响机制尚不明确，制约了高精度服务的可靠性。因此，研究利用多源时空信息，聚焦于这两类关键GNSS事件，从机理分析、异常检测到定位修正三个维度展开深入研究。本文的主要贡献和创新点包括：
  
  1）阐明了弹性功率的运行机理及其时空分布特征，揭示了其导致的载噪比变化与差分码偏差（Differential Code Bias, DCB）漂移规律，表明该类事件是引起观测值异常和硬件偏差漂移的重要原因。 
  
  2）面向信号域弹性功率事件，提出了基于动态时间规整的差分检测方法与基于深度学习的端到端检测方法。前者解决了“整体抬升”事件难以识别的难题，后者利用时空信息实现了无需历史基准的单历元高精度绝对状态判定，显著提升了检测的泛化性与实时性。 
  
  3）面向遥测域星载设备隐性异常事件，针对高维遥测数据噪声干扰及强周期信号掩盖微弱趋势的问题，构建了融合多窗口统计特征与时序分解技术的混合神经网络模型。该方法有效解耦了周期项与趋势项，实现了对星载设备老化等隐性故障的早期可靠预警。 
  
  4）建立了分段DCB修正策略并量化评估了弹性功率事件对精密单点定位（Precise Point Positioning, PPP）性能的影响。实验证明，该策略能显著缩短非差非组合及单频PPP的收敛时间并提升定位精度，有效解决了异常期间定位性能下降的问题。


# 总结【可选】
summary: 

# 关键词
tags:
- GNSS，弹性功率，异常检测，星载设备健康管理，精密单点定位， 差分码偏差
# 是否有featured图
featured: true

# 链接，可添加多个，按照下面的的type+url即可
links:
  # - type: pdf
  #   url: https://www.sciencedirect.com/science/article/pii/S1674984725000850
  # - type: doi
  #   url: http://dx.doi.org/10.1016/j.geog.2025.09.005

# 将封面图`featured.jpg/png`放在这一页面的目录下即可
image:
  caption: 'DLFPD structure'
  focal_point: ""
  preview_only: false

---
