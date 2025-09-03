---
title: "AFPD-DTW: An Adaptive Flex Power Detection Method for Post-processing and Real-time Applications"
authors:
- Jiayu Li
- Yan Xiang
- Chengeng Su
- Xiaolin Jia
- Qianyi Ren
- Yabing Wang
- Ling Pei
author_notes:
date: "2025-09-01T00:00:00Z"

# Schedule page publish date (NOT publication's date).
publishDate: "2025-09-01T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ["article-journal"]

# Publication name and optional abbreviated publication name.
publication: "GPS Solution"
publication_short: "GPSS"

abstract: Flex power is a capability of GPS satellites that allows programmable output power redistribution. It impacts satellite product estimation strategies and positioning accuracy significantly. Therefore, it is crucial to detect its changes. We propose a flex power detection method Adaptive Flex Power Detector–Dynamic Time Warping (AFPD-DTW) based on carrier-to-noise density ratio (C/N0) diurnal patterns. Compared to previous methods relying on historical data and pre-built models, this approach requires less data while effectively detecting both step lift and overall lift patterns. We employ dynamic time warping (DTW) to address the temporal shift challenge caused by GPS orbital periodicity. The method requires data from as few as 8 stations for reliable detection, substantially fewer than the existing method, Flex Power Detector (FPD). The method is applicable for both post-processing (daily) and real-time (point-by-point) detection scenarios, achieving 0.9983 and 0.9988 accuracy, respectively. In addition, the AFPD-DTW's post-processing speed is 20 times faster than FPD, making it particularly suitable for large-scale historical data analysis.

# Summary. An optional shortened abstract.
summary: A novel flex power detector based on day-to-day C/N0 difference

tags:
- GPS; flex power; DTW; diurnal pattern; flex power detection
featured: true

links:
  - type: pdf
    url: under review
  - type: code
    url: http://github.com/BlackiePiggy/AFPD#

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder. 
image:
  caption: 'AFPD: [**structure**]'
  focal_point: ""
  preview_only: false

---