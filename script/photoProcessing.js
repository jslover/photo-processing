/**
* @Static
* @description 照片处理
* @author http://jslover.com
* @version 1.0  20120929
*/
(function ($) {
    /*
    图片处理
    YH 20120926
    */
    var PP = {
        //主入口 
        Main: {}
        , Cache: {
            //延时变量
            Timer: {}
            //窗口高
            , winHeight: 0
            //容器宽高 
            , boxWidth: 0
            , boxHeight: 0
            //图片实际宽高
            , imgWidth: 0
            , imgHeight: 0
            //图片当前宽高
            , currImgWidth: 0
            , currImgHeight: 0
            //大小比例
            , scale: 1
            //当前相册照片
            , album: ''
            , photo: ''
            //当前图片地址
            , photoSrc: ''
            , $img: null
            , currRotate: 0
        }
        //公用处理方法
        , Common: {}
        //剪裁功能
        , Cut: {}
        //拖拽调整大小
        , Resize: {}
        //旋转
        , Rotate: {}
        //水印
        , Logo: {}
    };

    /*公用方法*/
    PP.Common = {
        //获取地址栏参数
        queryString: function (key) {
            var result = location.search.match(new RegExp("[\?\&]" + key + "=([^\&]+)", "i"));
            if (result == null || result.length < 1) {
                return "";
            }
            return result[1];
        }
    };

    //主框架
    PP.Main = {
        init: function () {
            var _this = this;
            var _h = $(window).height();
            //自适应高度
            $("#sidebar").css('height', _h - 30);
            $("#main").css('height', _h - 30);
            //缓存信息
            PP.Cache.winHeight = _h;
            PP.Cache.boxHeight = _h - 60;
            PP.Cache.boxWidth = $("#main").width() - 20;
            PP.Cache.album = PP.Common.queryString('album');
            PP.Cache.photo = PP.Common.queryString('photo');
            PP.Cache.photoSrc = 'test.jpg';
            //加载图片
            _this.loadImg();
            //绑定事件
            _this.bindEvent();

        }
        //缓存DOM事件
        , bindEvent: function () {
            $('a').focus(function () {
                $(this).blur();
            });
            //剪裁
            $("#btnCut").click(function () {
                var $btn = $(this);
                PP.Cut.init();
                $btn.parents('ul:first').find('.action-bar').hide();
                $btn.next().show();
            });
            //缩放
            $("#btnResize").click(function () {
                PP.Resize.init();
                var $btn = $(this);
                $btn.parents('ul:first').find('.action-bar').hide();
                $btn.next().show();
            });
            //取消事件
            $(".btn-cancel").click(function (e) {
                var $p = $(this).parent().hide();
                var $li = $p.parent();
                switch ($li.attr('data-action')) {
                    case 'cut':
                        PP.Cut.cutApi.destroy();
                        PP.Cut.cutApi = null;
                        $("#currImg img").css('visibility', 'visible');
                        break;
                    case 'resize':
                        PP.Resize.resizeApi.destroy();
                        PP.Resize.resizeApi = null;
                        break;
                    case 'rotate':
                        PP.Rotate.init(0);
                        break;
                    default:
                        break;
                }
            });
            //确认事件
            $(".btn-ok").click(function (e) {
                var $li = $(this).parent().parent();
                switch ($li.attr('data-action')) {
                    case 'cut':
                        PP.Cut.saveCut();
                        break;
                    case 'resize':
                        PP.Resize.saveResize();
                        break;
                    case 'rotate':
                        PP.Rotate.saveRotate();
                        break;
                    case 'logo':
                        PP.Logo.saveLogo();
                    default:
                        break;
                }
            });
            //左转
            $("#btnLeft").click(function (e) {
                var $btn = $(this);
                PP.Rotate.init('left');
                $btn.parents('ul:first').find('.action-bar').hide();
                $btn.parents('li:first').find('.action-bar').show();
            });
            //右转
            $("#btnRight").click(function (e) {
                var $btn = $(this);
                PP.Rotate.init('right');
                $btn.parents('ul:first').find('.action-bar').hide();
                $btn.parents('li:first').find('.action-bar').show();
            });

            $("#btnLogo").click(function () {
                var $btn = $(this);
                PP.Rotate.init(0);
                $btn.parents('ul:first').find('.action-bar').hide();
                $btn.parents('li:first').find('.action-bar').show();
            });

        }
        //加载图片
        , loadImg: function () {
            var $img = $('<img src="' + PP.Cache.photoSrc + '" />');
            var $loading = $("#loadding").html('加载图片...').show();
            $img.load(function () {
                $("#currImg img").replaceWith($img);
                //自适应计算
                var _w = $img.width();
                var _h = $img.height();
                var _f = 1;
                var _currW = _w, _currH = _h;
                if (_currW > PP.Cache.boxWidth) {
                    _currW = PP.Cache.boxWidth;
                    _f = _currW / _w;
                    _currH = _h * _f;
                }
                if (_currH > PP.Cache.boxHeight) {
                    _currH = PP.Cache.boxHeight;
                    _f = _currH / _h;
                    _currW = _w * _f;
                }
                $img.css({ width: _currW, height: _currH });
                //同步到缩放
                $("#imgResize").attr('src', PP.Cache.photoSrc);
                //显示比例
                $('#scaleBar label').html(Math.floor(_f * 100));
                $loading.hide();
                //缓存参数
                PP.Cache.imgHeight = _h;
                PP.Cache.imgWidth = _w;
                PP.Cache.currImgHeight = _currH;
                PP.Cache.currImgWidth = _currW;
                PP.Cache.scale = _f;
                //缓存图片对象
                PP.Cache.$img = $img;
                var _top = (PP.Cache.boxHeight - PP.Cache.currImgHeight) / 2;
                //上下居中
                $("#currImg").css('padding-top', _top);
            });
        }
    };
    //图片剪裁
    PP.Cut = {
        init: function () {
            //初始化旋转
            PP.Rotate.init(0);
            var _this = this;
            if (_this.cutApi) {
                _this.cutApi.destroy();
                _this.cutApi = null;
            }
            if (PP.Resize.resizeApi) {
                PP.Resize.resizeApi.destroy();
                PP.Resize.resizeApi = null;
            }
            $("#resizeImg").hide();
            $("#currImg").show();
            //计算拉框大小位置
            var _jcropW = PP.Cache.currImgWidth * 0.8;
            var _jcropH = PP.Cache.currImgHeight * 0.8;
            var x0 = (PP.Cache.currImgWidth - _jcropW) / 2;
            var y0 = (PP.Cache.currImgHeight - _jcropH) / 2;
            var x1 = x0 + _jcropW;
            var y1 = y0 + _jcropH;
            //初始化拉框
            $("#currImg img").Jcrop({
                setSelect: [x0, y0, x1, y1]
                , onDblClick: function () {
                    _this.saveCut();
                }
                , createHandles: ['n', 's', 'e', 'w', 'nw', 'ne', 'se', 'sw']
            }, function () {
                _this.cutApi = this;
            });
        }
        //保存剪裁
        , saveCut: function () {
            var _this = this;
            if (!_this.cutApi) {
                return;
            }
            //获取点阵
            var result = _this.cutApi.tellSelect();
            _this.cutApi.disable();
            var _f = PP.Cache.scale;
            //通过比例计算实际大小
            var x = Math.floor(result.x / _f);
            var y = Math.floor(result.y / _f);
            var w = Math.floor(result.w / _f);
            var h = Math.floor(result.h / _f);
            var $loading = $("#loadding").html('保存图片...').show();
            //保存开始
            $.post('/Finder/Cut', { album: PP.Cache.album, name: PP.Cache.photo, x: x, y: y, width: w, height: h }, function (data) {
                $loading.hide();
                if (data.HasError) {
                    alert(data.ErrorMessage || '出错');
                    _this.cutApi.destroy();
                    _this.cutApi = null;
                    return;
                }
                location.reload();

            }, 'JSON');

        }
        //图片剪裁API
        , cutApi: null
    };

    //缩放
    PP.Resize = {
        init: function () {
            var _this = this;
            if (PP.Cut.cutApi) {
                PP.Cut.cutApi.destroy();
                PP.Cut.cutApi = null;
            }
            if (_this.resizeApi) {
                _this.resizeApi.destroy();
                _this.resizeApi = null;
            }
            //动态插入一个节点用于拉框初始化
            $('#imgResize').after('<p id="divResize"></p>');
            $("#currImg").hide();
            $("#resizeImg").show();
            $("#divResize,#imgResize").css({
                width: PP.Cache.currImgWidth
                , height: PP.Cache.currImgHeight
            });
            //左右、上下居中
            var _left = (PP.Cache.boxWidth - PP.Cache.currImgWidth) / 2 + 10;
            var _top = (PP.Cache.boxHeight - PP.Cache.currImgHeight) / 2;
            //初始化拉框
            $('#divResize').Jcrop({
                bgColor: ''
                , boxWidth: PP.Cache.currImgWidth
                , allowSelect: false
                , onChange: function (data) {
                    //同步更新到图片
                    $("#imgResize").css({ width: data.w, height: data.h, top: data.y + _top, left: data.x + _left })
                }
                , onDblClick: function () {
                    _this.saveResize();
                }
                //区域
                , setSelect: [0, 0, PP.Cache.currImgWidth + 10, PP.Cache.currImgHeight + 10]
                //宽高比例
                , aspectRatio: PP.Cache.currImgWidth / PP.Cache.currImgHeight
            }, function () {
                _this.resizeApi = this;
                $("#resizeImg .jcrop-holder").css('top', _top);
            });

        }
        //保存结果
        , saveResize: function () {
            var _this = this;
            if (!_this.resizeApi) {
                return;
            }
            var result = _this.resizeApi.tellSelect();
            _this.resizeApi.disable();
            var _f = PP.Cache.scale;
            var w = Math.floor(result.w / _f);
            var h = Math.floor(result.h / _f);
            var $loading = $("#loadding").html('保存图片...').show();
            $.post('/Finder/Zoom', { album: PP.Cache.album, name: PP.Cache.photo, rate: Math.round(w * 100 / PP.Cache.imgWidth) }, function (data) {
                $loading.hide();
                if (data.HasError) {
                    alert(data.ErrorMessage || '出错');
                    _this.resizeApi.destroy();
                    _this.resizeApi = null;
                    return;
                }
                location.reload();
            }, 'JSON');
        }
        , resizeApi: null
    };
    //旋转
    PP.Rotate = {
        init: function (rotate) {
            if (PP.Cut.cutApi) {
                PP.Cut.cutApi.destroy();
                PP.Cut.cutApi = null;

            }
            if (rotate == 'left') {
                rotate = 270;
            } else if (rotate == 'right') {
                rotate = 90;
            } else {
                PP.Cache.currRotate = 0;
                rotate = 0;
            }
            $("#resizeImg").hide();
            $("#currImg").show();
            $("#currImg img").css('visibility', 'visible');
            PP.Cache.currRotate += rotate;
            PP.Cache.currRotate = PP.Cache.currRotate % 360;
            //IE使用滤镜，FF/chrome使用css3
            if (document.all) {
                $("#currImg img").css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + PP.Cache.currRotate / 90 + ')');
            } else {
                $("#currImg img").css('-moz-transform', 'rotate(' + PP.Cache.currRotate + 'deg)');
                $("#currImg img").css('-webkit-transform', 'rotate(' + PP.Cache.currRotate + 'deg)');
            }
        }
        //保存结果
        , saveRotate: function () {
            if (PP.Cache.currRotate == 0) {
                $("#btnRight").parent().next().hide();
                return;
            }
            var $loading = $("#loadding").html('保存图片...').show();
            $.post('/Finder/Rotate', { album: PP.Cache.album, name: PP.Cache.photo, angle: PP.Cache.currRotate }, function (data) {
                $loading.hide();
                if (data.HasError) {
                    alert(data.ErrorMessage || '出错');
                    return;
                }
                location.reload();
            }, 'JSON');
        }
    };
    //水印
    PP.Logo = {
        init: function () {

        }
        //保存
        , saveLogo: function () {
            var txt = $.trim($("#logoText").val());
            if (txt == '') {
                $("#logoText").focus();
                return;
            }
            var font = $("#logoFont").val();
            var fontSize = $("#logoFontSize").val();
            var position = $("#logoPosition input:checked").val();
            var $loading = $("#loadding").html('保存图片...').show();
            $.post('/Finder/AddWaterMark', { album: PP.Cache.album, name: PP.Cache.photo, markText: txt, fontName: font, fontSize: fontSize, position: position }, function (data) {
                $loading.hide();
                if (data.HasError) {
                    alert(data.ErrorMessage || '出错');
                    return;
                }
                location.reload();
            }, 'JSON');
        }
    };


    //初始化
    PP.Main.init();
})(jQuery);