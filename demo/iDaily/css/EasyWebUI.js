//
//          >>>  EasyWebUI Component Library  <<<
//
//
//      [Version]     v1.2  (2015-12-15)  Stable
//
//      [Based on]    iQuery v1  or  jQuery (with jQuery+)
//
//      [Usage]       A jQuery Plugin Library which almost
//                    isn't dependent on EasyWebUI.css
//
//
//            (C)2014-2015    shiy2008@gmail.com
//


(function (BOM, DOM, $) {

/* ---------- Flex Box 补丁  v0.2 ---------- */

    var CSS_Attribute = {
            Float:        {
                absolute:    true,
                fixed:       true
            },
            Display:      {
                block:    true,
                table:    true
            },
            Prefix:       (function (iUA) {
                try {
                    return ({
                        webkit:     '-webkit-',
                        gecko:      '-moz-',
                        trident:    '-ms-'
                    })[
                        iUA.match(/Gecko|WebKit|Trident/i)[0].toLowerCase()
                    ];
                } catch (iError) {
                    return '';
                }
            })(navigator.userAgent),
            Flex_Size:    {
                horizontal:    {
                    length:    'width',
                    margin:    ['left', 'right']
                },
                vertical:      {
                    length:    'height',
                    margin:    ['top', 'bottom']
                }
            }
        };

    function FlexFix() {
        var $_Box = $(this);

        var Size_Name = CSS_Attribute.Flex_Size[
                $_Box.css(CSS_Attribute.Prefix + 'box-orient')
            ];

        var Flex_Child = $.extend([ ], {
                sum:       0,
                sum_PX:    (
                    $_Box[Size_Name.length]() -
                    parseFloat( $_Box.css('padding-' + Size_Name.margin[0]) ) -
                    parseFloat( $_Box.css('padding-' + Size_Name.margin[1]) )
                )
            });
        $_Box.children().each(function () {
            var $_This = $(this);
            if (
                ($_This.css('position') in CSS_Attribute.Float) ||
                ($_This.css('display') == 'none')
            )
                return;

            var iDisplay = $_This.css('display').match(
                    RegExp(['(', CSS_Attribute.Prefix, ')?', '(inline)?-?(.+)?$'].join(''),  'i')
                );
            if ( iDisplay[2] )
                $_This.css({
                    display:    iDisplay[3] ?
                        (
                            ((iDisplay[3] in CSS_Attribute.Display) ? '' : CSS_Attribute.Prefix) +
                            iDisplay[3]
                        ) :
                        'block'
                });

            var _Index_ = Flex_Child.push({$_DOM:  $_This}) - 1,
                _Length_ = $_This[Size_Name.length]();

            if (! _Length_) {
                Flex_Child.pop();
                return;
            }

            Flex_Child[_Index_].scale = parseInt(
                $_This.css(CSS_Attribute.Prefix + 'box-flex')
            );

            Flex_Child.sum += Flex_Child[_Index_].scale;
            Flex_Child.sum_PX -= (
                _Length_ +
                parseFloat(
                    $_This.css('margin-' + Size_Name.margin[0])
                ) +
                parseFloat(
                    $_This.css('margin-' + Size_Name.margin[1])
                )
            );
        });
        if (Flex_Child.sum_PX < 0)  Flex_Child.sum_PX = 0;

        var iUnit = Flex_Child.sum_PX / Flex_Child.sum;
        for (var i = 0; i < Flex_Child.length; i++)
            Flex_Child[i].$_DOM[Size_Name.length](
                Flex_Child[i].$_DOM[Size_Name.length]() + (Flex_Child[i].scale * iUnit)
            );
    }

    var Need_Fix,
        _addClass_ = $.fn.addClass;

    $.fn.addClass = function () {
        _addClass_.apply(this, arguments);

        if (Need_Fix  &&  ($.inArray('Flex-Box', arguments[0].split(' ')) > -1))
            return  this.each(FlexFix);

        return this;
    };

    $(DOM).ready(function () {
        Need_Fix = isNaN(
            parseInt( $('body').css(CSS_Attribute.Prefix + 'flex') )
        );

        if (Need_Fix)  $('.Flex-Box').each(FlexFix);
    });

/* ---------- Input Range 补丁  v0.1 ---------- */
    function Pseudo_Bind() {
        var iStyleSheet = $.cssPseudo([arguments[0]]),
            iStyle = [ ];

        for (var i = 0;  i < iStyleSheet.length;  i++)
            if ($.inArray('before', iStyleSheet[i].pseudo) > -1)
                iStyle.push(iStyleSheet[i].style);

        $(this).change(function () {
            var iPercent = ((this.value / this.max) * 100) + '%';

            for (var i = 0;  i < iStyle.length;  i++)
                iStyle[i].setProperty('width', iPercent, 'important');
        });
    }

    Pseudo_Bind.No_Bug = (Math.floor($.browser.webkit) > 533);

    $.fn.Range = function () {
        return  this.each(function () {
                var $_This = $(this);

                //  Fill-Lower for Gecko and WebKit
                if (Pseudo_Bind.No_Bug && (! $_This.hasClass('Detail')))
                    $_This.cssRule({
                        ':before': {
                            width:    (($_This[0].value / $_This[0].max) * 100) + '%  !important'
                        }
                    }, Pseudo_Bind);

                //  Data-List for All Cores
                var $_List = $('<datalist />', {
                        id:    $.uuid('Range')
                    });

                $_This.attr('list', $_List[0].id);

                if (this.min) {
                    var iSum = (this.max - this.min) / this.step;

                    for (var i = 0;  i < iSum;  i++)
                        $_List.append('<option />', {
                            value:    Number(this.min + (this.step * i))/*,
                            text:     */
                        });
                }

                $_This.before($_List);
            });
    };

})(self,  self.document,  self.jQuery || self.Zepto);



(function (BOM, DOM, $) {

    /* ---------- 密码确认插件  v0.3 ---------- */

    //  By 魏如松

    var $_Hint = $('<div class="Hint" />').css({
            position:         'absolute',
            width:            '0.625em',
            'font-weight':    'bold'
        });

    function showHint() {
        var iPosition = this.position();

        $_Hint.clone().text( arguments[0] ).css({
            color:    arguments[1],
            left:     (iPosition.left + this.width() - $_Hint.width()) + 'px',
            top:      (iPosition.top + this.height() * 0.2) + 'px'
        }).appendTo(
            this.parent()
        );
    }

    $.fn.pwConfirm = function () {
        var pwGroup = { },
            $_passwordAll = this.find('input[type="password"][name]');

        //  密码明文查看
        var $_visible = $('<div class="visible" />').css({
                position:       'absolute',
                right:          '5%',
                top:            '8%',
                'z-index':      1000000,
                'font-size':    '26px',
                cursor:         'pointer'
            });
        $_passwordAll.parent().css('position', 'relative').append( $_visible.clone() )
            .find('.visible').html('&#10002;').click(function(){
                var $_this = $(this);

                if($_this.text() == '✒')
                    $_this.html('&#10001;').siblings('input').attr('type', 'text');
                else
                    $_this.html('&#10002;').siblings('input').attr('type', 'password');
            });

        //  密码输入验证
        $_passwordAll.each(function (){
            if (! pwGroup[this.name])
                pwGroup[this.name] = $_passwordAll.filter('[name="' + this.name + '"]');
            else
                return;

            var $_password = pwGroup[this.name],
                _Complete_ = 0;

            if ($_password.length < 2)  return;

            $_password.blur(function () {
                var $_this = $(this);

                $_this.parent().find('.Hint').remove();

                if (! this.value) return;

                if (! this.checkValidity())
                    showHint.call($_this, '×', 'red');
                else if (++_Complete_ == 2) {
                    var $_other = $_password.not(this);

                    showHint.apply(
                        $_this,
                        (this.value == $_other[0].value)  ?  ['√', 'green']  :  ['×', 'red']
                    );

                    _Complete_ = 0;
                } else
                    showHint.call($_this, '√', 'green');
            });
        });

        return this;
    };


/* ---------- 面板控件  v0.1 ---------- */

    $.fn.iPanel = function () {
        var $_This = this.is('.Panel') ? this : this.find('.Panel');

        return  $_This.each(function () {
            var $_Body = $(this).children('.Body');

            if (! ($_Body.length && $_Body.height()))
                $(this).addClass('closed');
        }).children('.Head').dblclick(function () {
            var $_Head = $(this);
            var $_Panel = $_Head.parent();
            var $_Head_Height =
                    Number( $_Head.css('height').slice(0, -2) )
                    + Number( $_Head.css('margin-top').slice(0, -2) )
                    + Number( $_Head.css('margin-bottom').slice(0, -2) )
                    + Number( $_Panel.css('padding-top').slice(0, -2) ) * 2;

            if (! $_Panel.hasClass('closed')) {
                $_Panel.data('height', $_Panel.height());
                $_Panel.stop().animate({height:  $_Head_Height});
                $_Panel.addClass('closed');
            } else {
                $_Panel.stop().animate({height:  $_Panel.data('height')});
                $_Panel.removeClass('closed');
            }
        });
    };

/* ---------- 标签页 控件  v0.4 ---------- */

    var Tab_Type = ['Point', 'Button', 'Monitor'];

    function Tab_Active() {
        var $_Label = this.children('label');
        var $_Active = $_Label.filter('.active');

        ($_Active.length ? $_Active : $_Label)[0].click();
    }

    $.fn.iTab = function () {
        return  this.on('click',  'label[for]',  function () {

            var $_This = $(this);

            if (! $_This.hasClass('active'))
                $_This.addClass('active').siblings().removeClass('active');

        }).each(function () {

            var $_Tab_Box = $(this),  iName = $.uuid('iTab'),  iType;

            for (var i = 0;  i < Tab_Type.length;  i++)
                if ($_Tab_Box.hasClass( Tab_Type[i] )) {
                    iType = Tab_Type[i];
                    $_Tab_Box.attr('data-tab-type', iType);
                }

            var $_Child = $_Tab_Box.children();
            var $_Label = $_Child.filter('label');

            var $_LT = $_Label.eq(0),  Index = 0,
                $_Tab_Set = $_Child.not($_Label).not(
                    $_Child.filter('input[type="radio"]').remove()
                );

            $.ListView(this,  'div:visible',  function ($_Tab_Body) {

                var $_This_Label = this.$_View.children('label').eq(Index++),
                    _UUID_ = $.uuid();
                if (! $_This_Label.length) {
                    $_This_Label = $_LT.clone(true).removeClass('active');
                    $_LT.before( $_This_Label );
                }
                $_This_Label.attr('for', _UUID_);

                var _Radio_ = $([
                        '<input type="radio" name=',  iName,  ' id=',  _UUID_,  ' />'
                    ].join('"'));
                var _Tab_ = $_Tab_Body.after(_Radio_);

                if (! $.browser.modern)
                    _Radio_.change(function () {
                        $_Tab_Set.hide();
                        _Tab_.show();
                    });

                if (Index == 1)  $_Tab_Body.remove();

            }).on('remove',  function () {
                $([
                    'label[for=',
                    $(arguments[0][0].previousElementSibling).remove()[0].id,
                    ']'
                ].join('"')).remove();

                Tab_Active.call( this.$_View );

            }).render(
                $.map($_Tab_Set,  function () { return 1; }),
                (iType !== 'Point')
            );

            Tab_Active.call( $_Tab_Box );

        }).swipe(function (iEvent, swipeX, swipeY) {
            if (
                (typeof swipeX != 'number')  ||
                (Math.abs(swipeY)  >  Math.abs(swipeX))
            )
                return;

            var $_This = $(this),  $_Target = $(iEvent.target);

            var $_Path = $_Target.parentsUntil(this),
                $_Tab_Body = $_This.children().not('label, input');

            $_Target = $_Path.length ? $_Path.slice(-1) : $_Target;

            var Index = $_Tab_Body.index( $_Target )  +  ((swipeX < 0)  ?  1  :  -1);

            $_Target = $_Tab_Body.eq(Index % $_Tab_Body.length);

            $('label[for="' + $_Target[0].previousElementSibling.id + '"]')[0]
                .click();
        });
    };

/* ---------- 元素禁止选中  v0.1 ---------- */

    $.fn.noSelect = function () {
        return  this.attr('unSelectable', 'on').css({
               '-moz-user-select':      '-moz-none',
             '-khtml-user-select':           'none',
            '-webkit-user-select':           'none',
                 '-o-user-select':           'none',
                '-ms-user-select':           'none',
                    'user-select':           'none',
            '-webkit-touch-callout':         'none'
        }).bind('selectStart', false).bind('contextmenu', false)
            .css('cursor', 'default');
    };


/* ---------- 首屏渲染 自动启用组件集 ---------- */
    $(DOM).ready(function () {

        $(DOM.body).addClass('Loaded');

        $('form').pwConfirm();

        $('form input[type="range"]').Range();

        $('.Panel').iPanel();

        $('.Tab').iTab();

        $('*:button,  a.Button,  .No_Select,  .Panel > .Head,  .Tab > ol')
            .noSelect();
    });

})(self,  self.document,  self.jQuery || self.Zepto);