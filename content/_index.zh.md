---
title: ""
date: "2022-10-24T00:00:00.000Z"
type: landing
design:
  spacing: 6rem
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
            brightness: 1
          size: cover
          position: center
          parallax: false
    disabled: false
    sync_key: sec-53baa0161569
  - block: collection
    id: papers
    content:
      title: 精选论文
      filters:
        folders:
          - publications
        featured_only: true
      use_default_language_content: true
    design:
      view: article-grid
      columns: 2
    disabled: false
    sync_key: sec-b676b390fb29
  - block: collection
    id: projects
    content:
      title: 项目
      filters:
        folders:
          - projects
      count: 8
      use_default_language_content: true
    design:
      view: article-grid
      columns: 4
    disabled: false
    sync_key: sec-56fd683fdc18
  - block: collection
    id: talks
    content:
      title: Presentation
      filters:
        folders:
          - event
      use_default_language_content: true
    design:
      view: article-grid
      columns: 1
    disabled: false
    sync_key: sec-916c88428dc4
  - block: collection
    content:
      title: 近期论文
      text: ""
      filters:
        folders:
          - publications
        exclude_featured: false
      use_default_language_content: true
    design:
      view: citation
    disabled: false
    sync_key: sec-f2533e65ee36
  - block: collection
    id: news
    content:
      title: 更多关于我
      subtitle: ""
      text: ""
      page_type: post
      count: 5
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
      use_default_language_content: true
    design:
      view: date-title-summary
      spacing:
        padding:
          - 0
          - 0
          - 0
          - 0
    disabled: true
    sync_key: sec-db787184ce05
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
        css_class: bg-primary-700
        css_style: ""
    disabled: true
    sync_key: sec-4efd74c1c16a
---
