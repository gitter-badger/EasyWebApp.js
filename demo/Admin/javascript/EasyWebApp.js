//
//                    >>>  EasyWebApp.js  <<<
//
//
//      [Version]     v2.1  (2015-11-15)  Beta
//
//      [Based on]    iQuery  |  jQuery with jQuery+,
//
//                    [ marked.js ]  (for MarkDown rendering)
//
//      [Usage]       A Light-weight WebApp Framework
//                    jQuery Compatible API.
//
//
//              (C)2015    shiy2008@gmail.com
//


(function (BOM, DOM, $) {

    var $_BOM = $(BOM);


/* ---------- [object InnerPage] ---------- */

    function InnerPage(App_Instance, Page_Info) {
        $.extend(this, {
            ownerApp:    App_Instance,
            title:       DOM.title,
            URL:         BOM.location.href,
            HTML:        DOM.URL,
            method:      'Get',
            JSON:        '',
            time:        $.now(),
            link:        [ ]
        }, Page_Info);
    }

    InnerPage.prototype.valueOf = function () {
        return {
            title:     this.title,
            URL:       this.URL,
            HTML:      this.HTML,
            method:    this.method,
            JSON:      this.JSON
        };
    };

/* ---------- [object InnerHistory] ---------- */

    function InnerHistory(App_Instance, $_Root) {
        var _This_ = $.extend(this, {
                length:       0,
                ownerApp:     App_Instance,
                root:         $_Root,
                lastIndex:    -1
            });

        $_BOM.on('popstate',  function () {
            var iState = arguments[0].state;
            var iHistory = _This_[ (iState || { }).DOM_Index ];

            if (! iHistory)  return;

            _This_.move(iState);
            iHistory.$_Page.appendTo($_Root).fadeIn();

            $_BOM.trigger('pageChange',  [iState.DOM_Index - _This_.lastIndex]);
            _This_.prevIndex = _This_.lastIndex;
            _This_.lastIndex = iState.DOM_Index;
        });
    }

    $.extend(InnerHistory.prototype, {
        splice:    Array.prototype.splice,
        push:      Array.prototype.push,
        slice:     Array.prototype.slice,
        move:      function () {
            if ($.isPlainObject( arguments[0] ))
                var iState = arguments[0];
            else
                var iLink = arguments[0];

            var $_Page = iLink.getTarget().children().detach();

            if ((! iState)  ||  ((iState.DOM_Index + 2) == this.length))
                this[this.length - 1].$_Page = $_Page;
        },
        write:     function (iLink) {
            if (this.length)  this.move(iLink);

            this.prevIndex = this.lastIndex++ ;
            this.splice(this.lastIndex,  this.length);

            iLink = iLink || { };

            var iNew = new InnerPage(this.ownerApp, {
                    title:     iLink.title,
                    URL:       iLink.alt,
                    HTML:      iLink.href,
                    JSON:      iLink.src,
                    method:    iLink.method
                });
            this.push(iNew);

            BOM.history.pushState(
                {DOM_Index:  this.lastIndex},
                iNew.title,
                iNew.URL
            );
            return iNew;
        },
        cache:     function () {
            var iNew = this[this.lastIndex];

            for (var i = 0;  i < this.lastIndex;  i++)
                if (
                    ((iNew.time - this[i].time) < 60000)  &&
                    (! (iNew.method + this[i].method).match(/Post|Put/i))  &&
                    $.isEqual(iNew, this[i])
                )
                    return  this[i].$_Page;
        },
        last:      function () {
            return  (this[this.lastIndex] || { }).valueOf();
        },
        prev:      function () {
            return  (this[this.prevIndex] || { }).valueOf();
        }
    });

/* ---------- [object DataStack] ---------- */

    function DataStack() {
        this.history = arguments[0];

        var iStack = this.stack = [ ];

        $_BOM.on('pageChange',  function () {
            iStack.length += arguments[1];
        });
    }
    $.extend(DataStack.prototype, {
        pushStack:    function (iData) {
            if (this.stack.length < this.history.length)
                this.stack.push(null);

            var Old_Sum = this.stack.length - 1 - this.history.lastIndex;
            if (Old_Sum > 0)  this.stack.length -= Old_Sum;

            this.stack.push(iData);
            return iData;
        },
        value:        function (iName, Need_Array) {
            for (var i = this.history.lastIndex + 1, iObject, iData;  i > -1;  i--) {
                iObject = this.stack[i];
                if (! iObject)  continue;

                if (Need_Array && (iObject instanceof Array))
                    return iObject;

                iData = iObject[iName];
                if (Need_Array) {
                    if (iData instanceof Array)
                        return iData;
                } else if ( $.isData(iData) )
                    return iData;
            }
        },
        flush:        function () {
            var _Data_ = arguments[0].serializeArray(),  iData = { };

            for (var i = 0;  i < _Data_.length;  i++)
                iData[_Data_[i].name] = _Data_[i].value;

            _Data_ = this.stack;
            if (! _Data_[_Data_.length - 1])
                _Data_[_Data_.length - 1] = { };
            $.extend(_Data_[_Data_.length - 1],  iData);

            return arguments[0];
        }
    });

/* ---------->> WebApp Constructor <<---------- */

    function WebApp($_Root, API_Root, URL_Change) {
        if (! ($_Root instanceof $))
            $_Root = $($_Root);

        var Split_Index = API_Root  &&  (API_Root.match(/(\w+:)?\/\//) || [ ]).index;
        API_Root = Split_Index ? [
            API_Root.slice(Split_Index),
            API_Root.slice(0, Split_Index)
        ] : [API_Root];

        $.extend(this, {
            domRoot:      $_Root,
            apiRoot:      API_Root[0] || '',
            urlChange:    URL_Change,
            history:      new InnerHistory(this, $_Root),
            loading:      false,
            proxy:        API_Root[1] || ''
        });
        this.dataStack = new DataStack(this.history);
    }

    var RE_Str_Var = /\{(.+?)\}/g;

    WebApp.prototype.makeURL = function (iURL, iData, iArgs) {
        iURL = $.split(iURL, '?', 2);
        iData = iData || { };

        var iJSONP = iURL[1].match(/&?([^=]+)=\?/);
        iJSONP = iJSONP && iJSONP[1];

        var This_App = this,
            URL_Param = $.param(
                $.extend(iArgs || { },  $.paramJSON(
                    iURL[1].replace(iJSONP + '=?',  '')
                ))
            );
        iURL = [
            BOM.decodeURIComponent(iURL[0]).replace(RE_Str_Var,  function () {
                return  iData[arguments[1]] || This_App.dataStack.value(arguments[1]);
            }),
            (! iJSONP)  ?  URL_Param  :  [
                URL_Param,  URL_Param ? '&' : '',  iJSONP,  '=?'
            ].join('')
        ].join('?');

        iURL = (
            iURL.match(/^(\w+:)?\/\/[\w\d]+/) ? '' : this.apiRoot
        ) + iURL;

        return  this.proxy + (
            this.proxy ? BOM.encodeURIComponent(iURL) : iURL
        );
    };

/* ---------- [object PageLink] ---------- */

    function PageLink(This_App, Link_DOM, iArgument, iData) {
        this.app = This_App;
        this.$_DOM = $.isPlainObject(Link_DOM) ?
            this.createDOM(Link_DOM, iArgument, iData)  :
            $(Link_DOM);
        this.$_DOM.data('EWA_PageLink', this);

        $.extend(this, this.$_DOM.attr([
            'target', 'title', 'alt', 'href', 'method', 'src'
        ]));
        this.href = this.href || this.app.history.last().HTML;
        this.method = (this.method || 'Get').toLowerCase();
        this.data = this.$_DOM.data('EWA_Model') || { };
    }

    var Prefetch_Tag = $.browser.modern ? 'prefetch' : 'next';

    PageLink.prefetchClear = function () {
        $('head link[rel="' + Prefetch_Tag + '"]').remove();
    };

    $.extend(PageLink.prototype, {
        createDOM:    function (iAttribute, iArgument, iData) {
            if ( $.isPlainObject(iArgument) )
                for (var iName in iArgument) {
                    iArgument['data-' + iName] = iArgument[iName];
                    delete iArgument[iName];
                }
            var $_Link = $('<button />', $.extend({
                style:    'display: none',
                rel:      'nofollow'
            }, iAttribute, iArgument));

            if ((iData instanceof Array)  ||  $.isPlainObject(iData))
                $_Link.data('EWA_Model', iData);

            return $_Link;
        },
        getTarget:    function () {
            return  (this.target == '_self')  ?
                this.app.domRoot  :  $('[name="' + this.target + '"]');
        },
        getArgs:      function () {
            var This_App = this.app,  iData = this.data;

            return  $.map(this.$_DOM[0].dataset,  function (iName) {
                var _Arg_ = iData[iName] || This_App.dataStack.value(iName);

                return  (_Arg_ !== undefined)  ?  _Arg_  :  iName;
            });
        },
        getURL:       function () {
            return  this.app.makeURL(
                this.src || '',
                this.data,
                this.method.match(/Get|Delete/i)  &&  this.getArgs()
            );
        },
        prefetch:     function () {
            if ((this.target == '_self')  &&  this.href) {
                var $_Prefetch = $('<link />', {
                        rel:     Prefetch_Tag,
                        href:    this.href
                    });

                if (
                    this.method.match(/Get/i)  &&
                    (this.src  &&  (! this.src.match(RE_Str_Var)))  &&
                    $.isEmptyObject( this.$_DOM[0].dataset )
                )
                    $_Prefetch.add(
                        $('<link />', {
                            rel:     Prefetch_Tag,
                            href:    this.getURL()
                        })
                    );

                $_Prefetch.appendTo(DOM.head);
            }
            return this;
        },
        valueOf:      function () {
            return {
                target:    this.target,
                title:     this.title,
                alt:       this.alt,
                href:      this.href,
                method:    this.method,
                src:       this.src
            };
        },
        loadData:        function (Data_Ready) {
            var $_Form = $(this.$_DOM).parents('form').eq(0);
            if ($_Form.length)
                this.app.dataStack.flush($_Form);

            var iLink = this,  This_App = this.app,
                API_URL = this.getURL();

            function AJAX_Ready() {
                Data_Ready.call(
                    iLink,
                    This_App.domRoot.triggerHandler('apiCall', [
                        This_App,
                        This_App.history.last().HTML,
                        This_App.proxy  ?
                            BOM.decodeURIComponent( API_URL.slice(This_App.proxy.length) )  :
                            API_URL,
                        arguments[0]
                    ]) || arguments[0]
                );
            }
            if (! this.src)
                return  AJAX_Ready.call(this, this.$_DOM.data('EWA_Model'));

            switch (this.method) {
                case 'get':       ;
                case 'delete':
                    $[this.method](API_URL,  Data_Ready && AJAX_Ready);    break;
                case 'post':      ;
                case 'put':
                    $[this.method](
                        API_URL,  this.getArgs(),  Data_Ready && AJAX_Ready
                    );
            }
        }
    });

    function Multiple_API(iRender) {
        var $_Link = $('head link[src]');

        if (! $_Link.length)  return iRender.call(this);

        Load_Process();

        var iData = { },  Data_Ready = $_Link.length;

        for (var i = 0;  i < $_Link.length;  i++)
            (new PageLink(this, $_Link[i])).loadData(function () {
                $.extend(iData, arguments[0]);

                if (--Data_Ready > 0)  return;

                iRender.call(this, iData);
                $_Link.remove();
            });
    }

    function Load_Template(iLink, Page_Load) {
        var MarkDown_File = /\.(md|markdown)$/i,
            This_App = this;

        $.get(iLink.href,  (! iLink.href.match(MarkDown_File)) ?
            function (iHTML) {
                if (typeof iHTML != 'string')  return;

                var not_Fragment = iHTML.match(/<\s*(html|head|body)(\s|>)/i),
                    no_Link = (! iHTML.match(/<\s*link(\s|>)/i)),
                    iSelector = This_App.domRoot.selector;

                if ((! not_Fragment)  &&  no_Link) {
                    $(iHTML).appendTo( This_App.domRoot ).fadeIn();
                    return  Multiple_API.call(This_App, Page_Load);
                }
                $_Body.sandBox(
                    iHTML,
                    ((iSelector && no_Link) ? iSelector : 'body > *')  +  ', head link[src]',
                    function ($_Content) {
                        $_Content.filter('link').appendTo('head');
                        This_App.domRoot.append( $_Content.not('link').fadeIn() );

                        Multiple_API.call(This_App, Page_Load);
                    }
                );
            } :
            function (iMarkDown) {
                if (typeof BOM.marked == 'function')
                    $( BOM.marked(iMarkDown) )
                        .appendTo( This_App.domRoot.empty() ).fadeIn()
                        .find('a[href]').each(function () {
                            this.setAttribute(
                                'target',  this.href.match(MarkDown_File) ? '_self' : '_top'
                            );
                        });
                else
                    This_App.domRoot.text(iMarkDown);

                This_Page.onReady();
            }
        );
    }
    $.extend(PageLink.prototype, {
        loadTemplate:    function () {
            var iReturn = this.app.domRoot.triggerHandler('pageLoad', [
                    this.app.history.last(),
                    this.app.history.prev()
                ]);
            if (iReturn === false)  return;

            this.app.loading = true;

            var This_Page = this.app.history.write(this);

        /* ----- Load DOM  from  Cache ----- */
            var $_Cached = this.app.history.cache(),
                Whole_Page = (this.target == '_self'),
                $_Target = this.getTarget();

            if ($_Cached) {
                $_Cached.appendTo($_Target).fadeIn();
                return This_Page.onReady();
            }

        /* ----- Load DOM  from  Network ----- */
            var iData,
                Load_Stage = (this.src && Whole_Page)  ?  2  :  1;

            function Page_Load() {
                if (arguments[0])  iData = arguments[0];

                if (--Load_Stage != 0)  return;

                This_Page.render(this.$_DOM, iData).onReady();
            }

            this.loadData(Page_Load);

            if (Whole_Page)  Load_Template.call(this.app, this, Page_Load);
        },
        loadPage:        function () {
            var iReturn = this.app.domRoot.triggerHandler('appExit', [
                    this.app.history.last().HTML,
                    this.href,
                    this.data
                ]);
            if (iReturn === false)  return;

            this.app.history.move();
            BOM.sessionStorage.EWA_Model = BOM.JSON.stringify(
                $.isPlainObject(iReturn) ? iReturn : this.data
            );
            BOM.location.href = this.href  +  '?'  +  $.param( this.getArgs() );
        }
    });

/* ---------- Manual Navigation ---------- */

    var $_Body = $(DOM.body);

    function Proxy_Trigger(iType, iAttribute, iArgument) {
        if (typeof iAttribute == 'string')
            iAttribute = (iType == '_blank') ? {
                src:    iAttribute
            } : {
                href:    iAttribute
            };
        else if ( $.isPlainObject(iAttribute.src) ) {
            var iJSON = iAttribute.src;
            delete iAttribute.src;
        }

        this.loading = false;
        (new PageLink(this, iAttribute.valueOf(), iArgument, iJSON))
            .$_DOM.appendTo($_Body).click();

        return this;
    }

    var _Concat_ = Array.prototype.concat,
        Target_Method = {
            _top:      'loadPage',
            _blank:    'loadData',
            _self:     'loadTemplate'
        };

    $.each(Target_Method,  function (iTarget) {
        WebApp.prototype[ arguments[1] ] = function () {
            return  Proxy_Trigger.apply(this,  _Concat_.apply([iTarget], arguments));
        };
    });

/* ---------- [object ListView] ---------- */

    function ListView($_Root, iData) {
        this.$_Root = $_Root;
        this.$_Template = $_Root.children().eq(0).clone(true);
        this.data = iData || [ ];
    }
    ListView.listSelector = 'ul, ol, dl, tbody, *[multiple]';

    $.extend(ListView.prototype, {
        renderLine:    function (iValue) {
            var $_Clone = this.$_Template.clone(true);

            $_Clone.data('EWA_Model', iValue)
                .find('*').add($_Clone)
                .filter('*[name]').value(function () {
                    return iValue[arguments[0]];
                });
            return $_Clone;
        },
        render:        function (iData) {
            if (iData)
                this.data = _Concat_.apply(iData, this.data);

            var iLimit = parseInt( this.$_Root.attr('max') )  ||  Infinity;
            iLimit = (this.data.length > iLimit) ? iLimit : this.data.length;

            var $_List = $();

            for (var i = 0;  i < iLimit;  i++)
                $_List.add( this.renderLine( this.data[i] ) );

            $_List.appendTo( this.$_Root.empty() );
        },
        insert:        function (iData, Index) {
            Index = Index || 0;

            this.data.splice(Index, 0, iData);
            this.$_Root.eq(Index).before( this.renderLine(iData) );
        },
        delete:        function (Index) {
            Index = parseInt(Index);
            if (isNaN( Index ))  return;

            this.data.splice(Index, 1);
            this.$_Root.eq(Index).remove();
        }
    });

/* ---------- Auto Navigation ---------- */

    var $_Data_Box;

    function Load_Process($_Loaded_Area) {
        if (! $_Loaded_Area)
            $_Data_Box = $_Body.find('*[name]');
        else if ($_Data_Box && $_Data_Box.length)
            $_Data_Box = $_Data_Box.not( $_Loaded_Area.find('*[name]') );
        else  return;

        $.shadowCover.clear();
        $_Data_Box.sameParents().eq(0).shadowCover('<h1>Data Loading...</h1>', {
            ' h1':    {
                color:    'white'
            }
        });
    }
    InnerPage.prototype.render = function ($_Source, iData) {
        var This_App = this.ownerApp;

        /* ----- Data Stack Change ----- */
        iData = $.extend(true,  $_Source && $_Source.data('EWA_Model'),  iData);

        var iReturn = This_App.domRoot.triggerHandler('pageRender', [
                This_App.history.last(),
                This_App.history.prev(),
                iData
            ]);
        iData = This_App.dataStack.pushStack(iReturn || iData);

        if (iReturn === false)  return this;

        /* ----- View Init ----- */
        var $_List = This_App.domRoot,
            iLink = $_Source && $_Source.data('EWA_PageLink');
        if (iLink  &&  (iLink.target != '_self'))
            $_List = iLink.getTarget().parent();
        $_List = $_List.find( ListView.listSelector ).not('input');

        for (var i = 0, $_LV;  i < $_List.length;  i++) {
            $_LV = $_List.eq(i);
            if (! $_LV.data('EWA_ListView'))
                $_LV.data('EWA_ListView',  new ListView($_LV));
        }
        /* ----- Data Render ----- */
        if (iData instanceof Array) {
            $_List.eq(0).data('EWA_ListView').render(iData);
            Load_Process($_List);
        } else
            Load_Process(
                $_Body.value(function (iName) {
                    var $_This = $(this);
                    var iValue = This_App.dataStack.value(iName, $_This.is($_List));

                    if (iValue instanceof Array)
                        $_This.data('EWA_ListView').render(iValue);
                    else if ( $.isPlainObject(iValue) )
                        $_This.data('EWA_Model', iValue).value(iValue);
                    else
                        return iValue;
                })
            );
        return this;
    };

    InnerPage.prototype.onReady = function () {
        $_Body.find('button[target]:hidden').remove();
        $.shadowCover.clear();

        var This_App = this.ownerApp;

        PageLink.prefetchClear();

        var $_Link = (This_App.history.lastIndex ? This_App.domRoot : $_Body).find('*[target]');

        for (var i = 0;  i < $_Link.length;  i++)
            this.link.push(
                (new PageLink(This_App, $_Link[i])).prefetch()
            );

        This_App.loading = false;
        This_App.domRoot.trigger('pageReady', [
            This_App,
            This_App.history.last(),
            This_App.history.prev()
        ]);

        return this;
    };

    WebApp.prototype.loadModule = function (iLink) {
        var This_Page = this.history.write(iLink);

        This_Page.render(iLink.$_DOM, iLink.src).onReady();
    };

/* ---------- User Event Switcher ---------- */

    function Event_Filter() {
        var iTagName = this.tagName.toLowerCase(),
            iEvent = arguments.callee.caller.arguments[0];

        switch (iEvent.type) {
            case 'click':     ;
            case 'tap':       {
                if (iTagName == 'a')  iEvent.preventDefault();

                return  iTagName.match(/form|input|textarea|select/);
            }
            case 'change':    return  (this !== iEvent.target);
        }
    }

    $_Body.on(
        ($.browser.mobile ? 'tap' : 'click') + ' change',
        '*[target]',
        function () {
            if ( Event_Filter.call(this) )  return;

            var iLink = $(this).data('EWA_PageLink');

            switch (iLink.target) {
                case '_self':     {
                    if (iLink.href)  iLink.loadTemplate();
                    break;
                }
                case '_blank':    {
                    if (iLink.src)  iLink.loadData();
                    break;
                }
                case '_top':      {
                    if (iLink.href)  iLink.loadPage();
                    break;
                }
                default:          iLink.loadTemplate();
            }
        }
    );
    WebApp.prototype.boot = function () {
        if (this.history.length)  throw 'This WebApp has been booted !';

        this.loading = true;

        var This_App = this,
            This_Page = this.history.write(
                new PageLink(this, {
                    target:    ''
                }, null, arguments[0])
            );

        this.domRoot.on('submit',  'form:visible',  function () {
            if (This_App.loading)  return false;

            var $_Form = This_App.dataStack.flush( $(this) );

            $_Form.attr('action',  function () {

                return  This_App.makeURL(arguments[1]);

            }).ajaxSubmit(function (iData) {

                var iLink = new PageLink(This_App, $_Form);

                var iReturn = This_App.domRoot.triggerHandler('formSubmit', [
                        This_App.history.last().HTML,
                        this.action,
                        iData,
                        iLink.href
                    ]);
                if ((iReturn === false)  ||  (! this.target))  return;

                iLink.src = iLink.src || iReturn || iData;

                This_App[
                    Target_Method[this.target] || 'loadTemplate'
                ](iLink);

            }).trigger('submit');

            return false;
        });

        Multiple_API.call(this,  function () {
            This_Page.render(null, arguments[0]);

            /* ----- URL Hash Navigation ----- */
            var iHash = BOM.location.hash.slice(1);

            if (iHash) {
                var iHash_RE = RegExp('\\/?' + iHash + '\\.\\w+$', 'i');

                $_Body.find('*[target][href]').each(function () {
                    var $_This = $(this);

                    if ( $_This.attr('href').match(iHash_RE) ) {
                        $_This[(this.tagName.toLowerCase() != 'form') ? 'click' : 'submit']();
                        return false;
                    }
                });
            }
            This_Page.onReady();
        });

        return this;
    };

/* ---------->> jQuery Wrapper <<---------- */

    $.fn.WebApp = function () {
        var iArgs = $.makeArray(arguments);

        var Init_Data = $.extend(
                $.parseJSON(BOM.sessionStorage.EWA_Model || '{ }'),
                $.paramJSON(),
                $.isPlainObject(iArgs[0])  &&  iArgs.shift()
            );
        var API_Root = (typeof iArgs[0] == 'string') && iArgs.shift();
        var URL_Change = (typeof iArgs[0] == 'boolean') && iArgs[0];

        (new WebApp(this, API_Root, URL_Change)).boot(Init_Data);

        return this;
    };

    $.fn.onPageRender = function () {
        var iArgs = $.makeArray(arguments);

        var iHTML = $.type(iArgs[0]).match(/String|RegExp/i) && iArgs.shift();
        var iJSON = $.type(iArgs[0]).match(/String|RegExp/i) && iArgs.shift();
        var iCallback = (typeof iArgs[0] == 'function') && iArgs[0];

        if (iCallback  &&  (iHTML || iJSON))
            this.on('pageRender',  function (iEvent, This_Page, Prev_Page, iData) {
                var Page_Match = (iHTML && iJSON) ? 2 : 1;

                if (This_Page.HTML && This_Page.HTML.match(iHTML))
                    Page_Match-- ;
                if (This_Page.JSON && This_Page.JSON.match(iJSON))
                    Page_Match-- ;

                if (Page_Match === 0)
                    return  iCallback.call(this, iData, Prev_Page);
            });

        return this;
    };

    $.fn.onPageReady = function () {
        var iArgs = $.makeArray(arguments);

        var iHTML = $.type(iArgs[0]).match(/String|RegExp/i) && iArgs.shift();
        var iJSON = $.type(iArgs[0]).match(/String|RegExp/i) && iArgs.shift();
        var iCallback = (typeof iArgs[0] == 'function') && iArgs[0];

        if (iCallback  &&  (iHTML || iJSON))
            this.on('pageReady',  function (iEvent, iApp, This_Page, Prev_Page) {
                var Page_Match = (iHTML && iJSON) ? 2 : 1;

                if (This_Page.HTML && This_Page.HTML.match(iHTML))
                    Page_Match-- ;
                if (This_Page.JSON && This_Page.JSON.match(iJSON))
                    Page_Match-- ;

                if (Page_Match === 0)
                    iCallback.call(this, iApp, Prev_Page);
            });

        return this;
    };

})(self, self.document, self.jQuery);