#EasyWebApp

## 【项目概述】
**EasyWebApp** 是一个基于 **jQuery API** 的**轻量级 SPA（单页应用）引擎**，**网页设计、后端接口、前端组件 充分解耦** —— 只用**原生 HTML** 做模板，对 **JSON 数据**的结构几无硬性要求，完全兼容现有的 **jQuery 插件**。

本引擎与其作者开发的 [**EasyWebUI**](http://git.oschina.net/Tech_Query/EasyWebUI)（Web 前端 UI 框架）的理念一致 ——
 - **充分利用 HTML 标签、属性 原生的语义、样式、功能，力求 Web 前端代码 表达上的简练、架构上的解耦！**
 - 学习曲线缓，开发成本低，维护效率高

本引擎首个开源稳定版 v1.2 脱胎于一个**移动端网页应用**（微信公众平台）和一个**桌面端网页系统**（某公司开放平台），是一个有较高 **抽象性**、**普适性**的 SPA 引擎，**个人独立开发**、**团队协作开发** 都能轻松胜任~


## 【使用入门】

### 一、加载引擎

本项目的开发最早基于 [**iQuery**](http://git.oschina.net/Tech_Query/iQuery)（相当于 **jQuery v1.x** 的精简与扩展），若要用 **jQuery 官方版**来驱动本引擎，需要同时加载 iQuery 项目中的 [jQuery+.js](http://git.oschina.net/Tech_Query/iQuery/blob/master/jQuery+.js) 来启用扩展的 jQuery API（一些 jQuery 插件）。

### 二、启动引擎
```html
<!DocType HTML>
<html><head>
    <meta http-equiv="X-UA-Compatible" content="IE=Edge, Chrome=1" />
    <script src="path/to/iQuery.js"></script>
    <script src="path/to/EasyWebApp.js"></script>
    <script>
    $(document).ready(function () {
        $('body > section').WebApp();
    });
    </script>
</head><body>
    <header>
        ...
    </header>
    <section>
        ...
    </section>
    <footer>
        ...
    </footer>
</body></html>
```

### 三、模板制作
本引擎的网页模板不采用“自创模板语言”，而直接使用 **原生 HTML** 的常用属性来标记引擎的特性 ——

#### （一）加载内页（AJAX 无刷新）
```html
<div target="_self" href="path/to/page_1.html"
     src="path/to/data/api/{id}" data-arg_1="data_name_1">
    <img src="path/to/logo.png" />XXX
</div>
```
```javascript
(function (BOM, $) {

    $('body > section')
        .onPageRender('page_1.html',  function (iData, Prev_Page) {
            //  iData 是 API 返回的 JSON，格式自定义，默认为 空对象
            if (iData.code > 200)
                return iData.data;

            BOM.alert(iData.message);
            BOM.history.go(-1);
        })
        .WebApp();

})(self, self.jQuery);
```
上述代码加载的内页 可以是 **HTML 代码片段**（包括 所有可见元素、style 元素），无需重复编码。

#### （二）加载外页（传统刷新）
```html
<form method="POST" action="path/to/api/{uid}"
      target="_top" href="path/to/app_1.html" data-arg_2="data_name_2">
    <input type="hidden" name="uid" />
    <input type="email" name="email" placeholder="注册电邮" />
    <input type="password" name="password" placeholder="密码" />
    <input type="submit" />
</form>
```
```javascript
(function ($) {

    $('body > section')
        .on('appExit',  function (This_URL, Next_URL, iData) {
            //  若 被触动的元素 是 form，则 iData 为 表单提交所返回的数据
            if (iData.code > 200) {
                alert(iData.message);
                return false;           //   阻止页面刷新、跳转
            }
        })
        .WebApp();
   
})(self.jQuery);
```
#### （三）调用接口（纯数据，无页面加载）
```html
<button target="_blank" src="path/to/data/api/{id}" data-arg_3="data_name_3">
    喜欢
</button>
```
```javascript
(function ($) {

    $('body > section')
        .on('apiCall',  function (iApp, This_URL, API_URL, iData) {
            //  iData 为 API 返回的数据
            if (iData.code > 200)
                alert(iData.message);
        })
        .WebApp();
   
})(self.jQuery);
```
### 四、数据填充
本引擎模板 把 **HTML name 属性** 推而广之，应用在任何 HTML 元素上，用作 JSON 数据的“**键值对应**”。仅有很少的 宽松规范 ——
 - 出现在**同一页面的不同数据不可重名**（如 用户、App、作品 等的名字，不可都用 name 来作为 JSON 键，无论它们在数据结构的哪一层）
 - 符合 CSS 3 选择器 `ul, ol, dl, *[multiple]:not(input)` 的**数据容器元素**（有 name 属性的），其对应的数据结构是一个**以普通对象为元素的数组**，其子元素（它也可以有子元素）只需有一个，引擎会自动复制这个子元素的作为**数组迭代的模板**

```html
<div multiple name="list" max="6">
    <img name="avatar" src="path/to/logo.png" />XXX
</div>
```


## 【API 总览】

### 一、jQuery 实例方法
```javascript
$_AppRoot
    .onPageRender(
        HTML_Match,    //  二选一，String 或 Regexp，匹配 HTML 文件路径
        JSON_Match,    //  二选一，String 或 Regexp，匹配 JSON API 路径
        Page_Render    //  必选，本引擎加载 HTML、JSON 后，进行错误处理，
                       //  并返回开发者自定义数据结构中的内容对象，以便引擎正确地渲染页面
                       //  （还可以有 更多自定义的逻辑）
    )
    .onPageReady(
        HTML_Match,    // （同上）
        JSON_Match,    // （同上）
        Page_Render    //  必选，本引擎渲染 HTML、JSON 后，执行传统 DOM Ready 回调中的页面逻辑
    )
    .WebApp(
        Init_Data,                         //  可选，一般为 登录后的会话数据
        'http://cross.domain.api/root',    //  可选，API 服务器 与 静态网页资源服务器 不同时设置
        URL_Change                         //  可选，Boolean，控制 地址栏网址 是否改变
    );
```
### 二、jQuery 自定义事件
本引擎不支持“在 jQuery 插件 初始化时传入各种回调函数”的方式，一切**可编程点**均直接在 **实例化 WebApp** 的元素上触发**自定义 DOM 事件**，开发者只需使用 jQuery 标准的事件监听方法，就可以在其回调函数中调用 **WebApp 实例**的方法。

【事件分类】
 - [A] 表示 **异步事件**，一般在 事件名所表示的操作 完成时 触发，可在回调内根据 API 返回值，酌情调用 WebApp 实例方法，**手动控制 WebApp 加载页面**
 - [S] 表示 **同步事件**，一般在 事件名所表示的操作 进行前 触发，可能需要开发者：
   -  判断是否阻止**事件操作**执行 —— return false
   -  在自定义数据格式中提取**内容数据**参与渲染 —— return {...}

【事件总表】
 - [S] **pageRender 事件** 在一个内部页面的模板、数据加载完，准备**用数据渲染模板**时触发。其回调参数如下：
   -  jQuery Event 对象
   -  正在渲染的页面对象
   -  刚切换走的页面对象
   -  API 返回对象
 - [A] **apiCall 事件** 在一个 HTTP API 请求结束时触发。其回调参数如下：
   -  jQuery Event 对象
   -  WebApp 实例对象
   -  当前 HTML URL
   -  API URL
   -  API 返回对象
 - [S] **appExit 事件** 在一个外部页面加载（单页应用实例 销毁）前触发。其回调参数如下：
   -  jQuery Event 对象
   -  当前 HTML URL
   -  将加载的外部页面 URL
   -  事件源元素对应的数据对象（如 id 等 须附加在 URL 后页面才能正常跳转的参数）
 - [S] **formSubmit 事件** 在一个表单提交并返回数据后触发（此时可能会跳转页面）。其回调参数如下：
   -  jQuery Event 对象
   -  当前 HTML URL
   -  当前 form 实际使用的 action URL
   -  表单提交 返回数据
   -  即将跳转到的页面 HTML URL
   -  即将跳转到的内页 JSON URL
 - [A] **pageReady 事件** 在一个内部页面渲染完成时触发。其回调参数如下：
   -  jQuery Event 对象
   -  WebApp 实例对象
   -  刚渲染好的页面对象
   -  刚切换走的页面对象

### 三、WebApp 对象实例方法
WebApp 支持手动调用 本引擎 **HTML 模板规则**（上文【使用入门】第三大节）对应的 JavaScript 实例方法 ——
```javascript
iWebApp
    .loadTemplate(Title, HTML_URL, JSON_URL)    //  加载内页
    .loadJSON(JSON_URL)                         //  调用 API
    .loadPage(HTML_URL);                        //  加载外页
```

## 【项目缘起】
**EasyWebApp** 算是其作者与 产品、设计、后端的各种“撕逼”后，或坚持、或折中的结果。其 **HTML 模板机制** 源于作者早期的一个 PHP 前端项目 [EasyWebTemplate](http://git.oschina.net/Tech_Query/EasyWebTemplate)（基于 **phpQuery**），而其 **事件驱动的 API** 则源于文首提到的开放平台首个版本的**智能表单引擎** JSON_Web.js（强数据格式依赖、不支持不规律的界面设计，未到达开源水准，但会继续吸收其优秀的特性）。虽然前面这些小项目 都有些幼稚，但却又是 **敢于把独立思考成果付诸实践**的有益尝试，若没有这些沉淀，就没有本项目自 2015年6月29日的26天 内即发布**开源稳定版**的成绩~


## 【协作开发】

本项目提炼于其发起人的**日常开发实战**，其本人会**持续更新**，同时欢迎广大 **Web 开发爱好者**在 **OSChina 社区**与其交流、提交 **Pull Request**！~