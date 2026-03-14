---
# Leave the homepage title empty to use the site title
title: ""
date: 2022-10-24
type: landing

design:
  # Default section spacing
  spacing: "6rem"

sections:
  - block: resume-biography-3
    content:
      username: admin
      text: ""
      button:
        text: 下载简历
        url: uploads/resume.pdf
    design:
      css_class: dark
      avatar:
        size: medium
        shape: circle
      background:
        color: black
        image:
          filename: bg2.jpg
          filters:
            brightness: 1.0
          size: cover
          position: center
          parallax: false
  - block: collection
    id: papers
    content:
      title: 精选论文
      use_default_language_content: true
      filters:
        folders:
          - publications
        featured_only: true
    design:
      view: article-grid
      columns: 2
  - block: collection
    content:
      title: 近期论文
      text: ""
      use_default_language_content: true
      filters:
        folders:
          - publications
        exclude_featured: false
    design:
      view: citation

  - block: collection
    id: projects
    content:
      title: 项目
      use_default_language_content: true
      filters:
        folders:
          - projects
      count: 8
    design:
      view: article-grid
      columns: 4

  - block: collection
    id: talks
    content:
      title: 展示与分享
      use_default_language_content: true
      filters:
        folders:
          - event
    design:
      view: article-grid
      columns: 1
  - block: collection
    id: news
    content:
      title: 更多关于我
      subtitle: ''
      text: ''
      page_type: post
      count: 5
      use_default_language_content: true
      filters:
        author: ""
        category: ""
        tag: ""
        exclude_featured: false
        exclude_future: false
        exclude_past: false
        publication_type: ""
      offset: 0
      order: desc
    design:
      view: date-title-summary
      spacing:
        padding: [0, 0, 0, 0]
  - block: cta-card
    demo: true
    content:
      title: 👉 像这样搭建属于你自己的个人主页
      text: |-
        这个网站由 Hugo Blox Builder 生成，并在此基础上持续定制。

        你可以用它快速搭建个人主页、项目展示页、学术履历或博客站点。
      button:
        text: 了解 Hugo Blox
        url: https://hugoblox.com/templates/
    design:
      card:
        css_class: "bg-primary-700"
        css_style: ""
---
