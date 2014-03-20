(function ($) {

    //拓展date方法
    Date.prototype.addDays = function (n) {
        this.setDate(this.getDate() + n);
        this.tempDate = this.getDate();
    };
    Date.prototype.addMonths = function (n) {
        if (this.tempDate == null) {
            this.tempDate = this.getDate();
        }
        this.setDate(1);
        this.setMonth(this.getMonth() + n);
        this.setDate(Math.min(this.tempDate, this.getMaxDays()));
    };
    Date.prototype.addYears = function (n) {
        if (this.tempDate == null) {
            this.tempDate = this.getDate();
        }
        this.setDate(1);
        this.setFullYear(this.getFullYear() + n);
        this.setDate(Math.min(this.tempDate, this.getMaxDays()));
    };
    Date.prototype.getMaxDays = function() {
        var tmpDate = new Date(Date.parse(this)),
            d = 28, m;
        m = tmpDate.getMonth();
        d = 28;
        while (tmpDate.getMonth() == m) {
            d ++;
            tmpDate.setDate(d);
        }
        return d - 1;
    };
    /**
     *  插件名字
     */
    var _NAME = "myTimeLine";

    //时间类型
    if (typeof date_type == "undefined") {
        var date_type = {
            day: "day", week: "week", month: "month", year: "year"
        }
    }

    /**
     *
     * @type {{name: string, hasTop: boolean, hasMiddle: boolean, width: number, height: number, barHeight: number, buttonWidth: number, date_type: string, data: Array}}
     */
    var defaults = {
        name: "myTimeLine",
        hasTop: true, //是否显示上面的时间选择栏
        hasMiddle: true, //是否显示中间栏的左右按钮
        width: 300, //时间轴的宽度
        height: 200, //时间轴的高度
        barHeight: 20, //上下两边栏的高度px
        buttonWidth: 20,//左右两边的按钮宽度px
        interval : 1000*60*5, //一格代表多少毫秒
        date_type: date_type.day, //时间类型
        start_date: new Date(),
        asyncUrl:"",
        otherArgs:{}, //传递给异步请求的其他参数
        onLoad: function (obj) {
        }, //做动画用
        onClick: function (startDate, endDate) {
        },
        onLoadFinish: function (obj) {
        },
        onMouseMove: function (startDate) {
        }, //鼠标移动事件
        data: [],//显示的数据
        time:[] //对应上面数据点的时间

    };


    //本地用的常量
    var constant = {};

    var initConstant = function (obj) {
        constant[obj.id] = $.extend({},defaults);
        //时间线最大高度
        constant[obj.id].LINE_MAX_HEIGHT = defaults.height - 2 * defaults.barHeight;
        //时间轴最大宽度
        constant[obj.id].CONTAINER_MAX_WIDTH =  defaults.width - 2 * defaults.buttonWidth;
        if( typeof constant[obj.id].start_date == "object" ){
            constant[obj.id].start_date = date2str(constant[obj.id].start_date,"yyyy/MM/dd hh:mm:ss")
        }
    }

    /**
     * 创建时间轴的骨架
     */
    var createSkeleton = function (obj) {
        $(obj).removeClass("mytimeline").addClass("mytimeline").css({
            width: constant[obj.id].width,
            height: constant[obj.id].height
        });
        //时间轴包装
        $(obj).html('<div class="wrapper" id="' + constant[obj.id].name +
            '">' + (constant[obj.id].hasTop ? '<div class="top" style="height: ' + constant[obj.id].barHeight + 'px;"></div>' : '') +
            '<div class="middle" style="height: ' + constant[obj.id].LINE_MAX_HEIGHT + 'px">' +
            (constant[obj.id].hasMiddle ? '<div class="mainleft" style="width:' + constant[obj.id].buttonWidth + 'px"></div>' : '') +
            '<div class="maincenter" style="width:' + (constant[obj.id].hasMiddle ? constant[obj.id].CONTAINER_MAX_WIDTH : constant[obj.id].width) +
            'px">' + '<div class="timeline_container" style=""></div>' + '</div>' +
            (constant[obj.id].hasMiddle ? '<div class="mainright" ' +
                'style="width:' + constant[obj.id].buttonWidth + 'px"></div>' : '') +
            '</div>' +
            '<div class="bottom" style="height: ' + constant[obj.id].barHeight +
            'px;"></div>' +
            '<input id="start_date" type="hidden" value="">' +
            '<input type="hidden" name="beginDate" typ="text" id="beginDate">'+
            '<input type="hidden" name="endDate" typ="text" id="endDate">'+
            '</div>')
        //添加左右按钮
        $(obj).find(".mainleft").html('<div>«</div>')
        $(obj).find(".mainright").html('<div>»</div>')
    }

    var tag_count = 5;
    /**
     * 塞数据
     */
    var appendData = function (obj) {
        if (typeof obj == "object" && obj.length > 0) {
            obj = obj[0];
        }
        var height = constant[obj.id].LINE_MAX_HEIGHT;
        var data = constant[obj.id].data;
        var maxline = Math.max.apply(Math,data);
        maxline = maxline == 0 ? 1 : maxline;
        //间隔数
        var date_count = get_date_count(obj, constant[obj.id].date_type,constant[obj.id].start_date);
        constant[obj.id].date_count=date_count;
        //鼠标框的宽度
        constant[obj.id].cursor_width=constant[obj.id].CONTAINER_MAX_WIDTH / date_count;

        var timeline_container = $(obj).find(".timeline_container");
        var timelines = "";
        var interval =  constant[obj.id].interval; //一格
        $.each(data, function (i, v) {
            if (constant[obj.id].time.length != 0){
                var tsp = constant[obj.id].time[i];
                var index = (tsp - Date.parse(constant[obj.id].start_date.replace(/-/g,"/")))/interval;
            }else{
                index = i;
            }

            timelines += '<div class="line" style="'
                + 'left:' + index*constant[obj.id].cursor_width + 'px;'
                + 'height:' + v/maxline*height + 'px;'
                + '"></div>'
        })
        timeline_container.html(timelines)
        var start_date ;
        if( typeof constant[obj.id].start_date != "object"){
            start_date = new Date(constant[obj.id].start_date.replace(/-/g,"/ "));
        }else{
            start_date =constant[obj.id].start_date;
        }
        if (start_date != "Invalid Date") {
            constant[obj.id].start_date = start_date;
        } else {
            constant[obj.id].start_date = new Date();
        }

        //添加事件间隔
        var tags = generateTimeTag(obj, start_date, constant[obj.id].date_type);
        $(obj).find(".bottom").html(tags)
        var startDate = new Date(start_date);
        var top_left_date = '<span>' + format_button(obj, startDate, constant[obj.id].date_type) +
            '</span>';
        $(obj).find(".top").html('<div>' + top_left_date + '</div>');
        bindNavigatorAction(obj, startDate);
    }

    /**
     * 生成时间栏
     */
    var generateTimeTag = function (obj, start_date, date_type) {
        var offset = constant[obj.id].CONTAINER_MAX_WIDTH / tag_count;
        var tags = '<table style="margin-left:' + constant[obj.id].buttonWidth + 'px"><tr>';
        for (var i = 0; i < tag_count; i++) {
            (function (i) {
                tags += '<td width="' + offset +
                    'px">' + getDate(start_date, i, date_type) +
                    '</td>'
            })(i)
        }
        return tags + '</tr></table>';
    }

    /**
     * 日期格式化
     * @param x Date类型
     * @param y string格式"yyyy-MM-dd hh,mm,ss"
     * @returns {XML|string}
     */
    function date2str(x, y) {
        var z = {M: x.getMonth() + 1, d: x.getDate(), h: x.getHours(), m: x.getMinutes(), s: x.getSeconds()};
        y = y.replace(/(M+|d+|h+|m+|s+)/g, function (v) {
            return ((v.length > 1 ? "0" : "") + eval('z.' + v.slice(-1))).slice(-2)
        });
        return y.replace(/(y+)/g, function (v) {
            return x.getFullYear().toString().slice(-v.length)
        });
    }

    /**
     * 生成时间栏标记的
     * @param start_date
     * @param i
     * @param type
     * @returns {*}
     */
    var getDate = function (start_date, i, type) {
        switch (type) {
            case date_type.day:
                var date = new Date(start_date - 0 + i * 1000 * 3600 * 24 / 5);
                return date2str(date, "hh:mm");
                break;
            case date_type.week:
                var date = new Date(start_date - 0 + i * 1000 * 3600 * 24 * 7 / 5);
                return date2str(date, "dd") + "日";
                break;
            case date_type.month:
                var date = new Date(start_date - 0 + i * 1000 * 3600 * 24 * 30 / 5);
                return date2str(date, "dd") + "日";
                break;
            case date_type.year:
                var date = new Date(start_date - 0 + i * 1000 * 3600 * 24 * 30 * 12 / 5);
                return date2str(date, "MM") + "月";
                break;
            default:
                throw "unknown data type";
        }

    }

    /**
     * 获取日期数
     * @param date_type
     * @returns {number}
     */
    var get_date_count = function (obj, type, start_date) {
        switch (type) {
            case date_type.day:
                constant[obj.id].interval =60 * 5 * 1000;
                return 12 * 24;
                break;
            case date_type.week:
                constant[obj.id].interval =3600 * 24 * 1000;
                return 7;
                break;
            case date_type.month:
                 var date_count = new Date(start_date.replace(/-/g,"/ ")).getMaxDays();
                constant[obj.id].interval = 3600 * 24 * 1000;
                return date_count;
                break;
            case date_type.year:
                constant[obj.id].interval =31 * 3600 * 24 * 1000;
                return 12;
                break;
            default:
                throw "unknown data type";
        }
    }
    /**
     * 格式化左上角的时间按钮
     * @param obj  时间轴对象 dom
     * @param date 鼠标当前日期
     * @param type 日期类型
     * @returns {string}
     */
    var format_button = function (obj, date, type) {
        switch (type) {
            case date_type.day:
                return '<span class="year">' +
                    '<a href="javascript:void(0)" >' + date.getFullYear() + "年" +
                    '</a>›</span><span class="month">' +
                    '<a href="javascript:void(0)" >' + (date.getMonth() + 1) + "月" +
                    '</a>›</span><span class="day">' +
                    '<a href="javascript:void(0)" >' + date.getDate() + "日" +
                    '</a>›</span>' + date2str(date, "hh:mm");
                break;
            case date_type.week:
                return '<span class="year">' +
                    '<a href="javascript:void(0)">' + date.getFullYear() + "年" +
                    '</a>›</span><span class="month">' +
                    '<a href="javascript:void(0)" >' + (date.getMonth() + 1) + "月" +
                    '</a>›</span><span class="day">' +
                    date.getDate() + "日";
                break;
            case date_type.month:
                return '<span class="year">' +
                    '<a href="javascript:void(0)" >' + date.getFullYear() + "年" +
                    '</a>›</span><span class="month">' +
                    '<a href="javascript:void(0)" >' + (date.getMonth() + 1) + "月" +
                    '</a>›</span><span class="day">' +
                    date.getDate() + "日";
                break;
            case date_type.year:
                return '<span class="year"><a href="javascript:void(0)">'
                    + date.getFullYear() + "年" +
                    '</a>›</span><span class="month">' +
                    '<a href="javascript:void(0)" >' +
                    (date.getMonth() + 1) + "月";
                break;
            default:
                throw "unknown data type";
        }
    }
    /**
     * 绑定鼠标事件
     * @param obj
     */
    var bindMouse = function (obj) {

        //鼠标
        var date_type = constant[obj.id].date_type;
        var start_date = constant[obj.id].start_date;
        var cursor_width =constant[obj.id].cursor_width;
        var interval =constant[obj.id].interval;
        var date_count = constant[obj.id].date_count;
        var mouse_cursor = '<div class="mouse_cursor" style="left:0;display:none;"></div>';
        var current_index = 0;
        var index = 0;
        var endDate = new Date(start_date);
        $(obj).find(".maincenter").unbind().hover(function () {
            var cursor = $(obj).find(".timeline_container").find(".mouse_cursor");
            if (cursor.size() == 0) {
                var line = $(obj).find(".timeline_container").find(".line:first");
                if (line.size() == 0) {
                    $(obj).find(".timeline_container").html(mouse_cursor);
                } else {
                    line.after(mouse_cursor);
                }
                var mouse_rec = $(obj).find(".mouse_cursor"); //鼠标滑块div
                var center = $(obj).find(".maincenter"); //时间轴的主体部分
                mouse_rec.css('width', cursor_width + "px");
                var center_left = (center.offset().left); //时间轴和左边的偏移
                var cursor_fix = center_left + cursor_width / 2; //修正鼠标在中间

                var per_width = (center.width() / date_count); //单个的跨度
                var ranges = [];
                for (var i = 0; i < date_count; i++) {
                    var range = i * per_width;
                    ranges.push(range);
                }

                if (mouse_rec.size() != 0) {
                    $(obj).find(".timeline_container").unbind().bind("mousemove", $.debounce(function (event) {
                        index = Math.floor((event.pageX - center_left) / per_width);
                        var previous_index = -1;
                        if (index >= 0 && index < date_count) {
                            if (previous_index != index) {
                                mouse_rec.show();
                                mouse_rec.clearQueue();
                                mouse_rec.css({'left': ranges[index] + 'px'});
                                previous_index = index;
                            }
                        }
                        endDate = new Date(new Date(start_date) - 0 + index * interval);
                        var top_left_date = '<span>' + format_button(obj, endDate, date_type) + '</span>';

                        $(obj).find(".top").html('<div>' + top_left_date + '</div>');
                        bindDateOperation(obj, endDate);
                    },10,true));
                    bindNavigatorAction(obj,endDate);
                }
                mouse_rec.bind('click', function () {
                    current_index = index;
                    var mouse_cursor_current = '<div class="mouse_cursor_current" style="left:' +ranges[current_index]+
                        'px;width:' +cursor_width+
                        'px"></div>';
                    $(obj).find(".mouse_cursor_current").remove();
                    line.after(mouse_cursor_current);
                    constant[obj.id].onClick(endDate, new Date(endDate - 1000 + 1 * interval));
                })
            }
        }, function () {
            endDate = new Date(new Date(start_date) - 0 + current_index * interval);
            var top_left_date = '<span>' + format_button(obj, endDate, date_type) + '</span>';
            $(obj).find(".top").html('<div>' + top_left_date + '</div>');
            $(obj).find(".timeline_container").find(".mouse_cursor").remove();
        })

    }
    //绑定时间点击按钮
    var bindDateOperation = function (obj, endDate) {

        //绑定鼠标事件
        $(obj).find(".year>a").die().live('click', function (){
            var begin = new Date((""+endDate.getFullYear()+"-1-1").replace(/-/g,"/"));
            var _beginDate = date2str(begin,"yyyy-MM-dd hh:mm:ss");
            var temp = begin;
            temp.addYears(1);
            temp.addDays(-1);
            var _endDate = date2str(temp,"yyyy-MM-dd hh:mm:ss")
            asyncData(obj,_beginDate,_endDate ,date_type.year)
        });
        $(obj).find(".month>a").die().live('click', function (){
            var begin =new Date((""+date2str(endDate,"yyyy-MM")+"-1").replace(/-/g,"/"));
            var _beginDate = date2str(begin,"yyyy-MM-dd hh:mm:ss");
            var temp = begin;
            temp.addMonths(1);
            temp.addDays(-1);
            var _endDate = date2str(temp,"yyyy-MM-dd hh:mm:ss");
            asyncData(obj,_beginDate,_endDate ,date_type.month)
        });
        $(obj).find(".day>a").die().live('click', function (){
            var begin = new Date(""+date2str(endDate,"yyyy-MM-dd").replace(/-/g,"/"));
            begin.setHours(0);
            begin.setMinutes(0);
            var _beginDate = date2str(begin,"yyyy-MM-dd hh:mm:ss");
            var temp = begin;
            temp.addDays(1);
            temp=temp-1;
            var _endDate = date2str(new Date(temp),"yyyy-MM-dd hh:mm:ss")
            asyncData(obj,_beginDate,_endDate ,date_type.day)
        });
    }

    /**
     * 奕步获取数据
     * @param obj
     */
    var asyncData = function(obj,beginDate,endDate,date_type){

        $.ajax({
            url:constant[obj.id].asyncUrl,
            type:'post',
            dataType:'json',
            data:$.extend({
                beginDate:beginDate,
                endDate:endDate,
                date_type:date_type
            },constant[obj.id].otherArgs),
            success:function(result){
                constant[obj.id] = $.extend(constant[obj.id], {
                    date_type:date_type,
                    start_date:date2str(new Date(beginDate.replace(/-/g,"/")),"yyyy/MM/dd hh:mm:ss")
                });
                constant[obj.id].data=result.data;
                constant[obj.id].time=result.time;
                appendData(obj);
                bindMouse(obj);
            }
        })
    }
    //绑定左右按钮
    var bindNavigatorAction = function (obj, startDate) {
        $(obj).find(".mainright").die().live('click', function () {
            var type = constant[obj.id].date_type;
            var _beginDate = new Date(startDate);
            var _endDate =  new Date(startDate);
            switch (type) {
                case date_type.day:
                    _beginDate.addDays(1);
                    _endDate.addDays(2);
                    break;
                case date_type.week:
                    _beginDate.addDays(7);
                    _endDate.addDays(14);
                    break;
                case date_type.month:
                    _beginDate.addMonths(1);
                    _endDate.addMonths(2);
                    _endDate.addDays(-1);
                    break;
                case date_type.year:
                    _beginDate.addYears(1);
                    _endDate.addYears(2);
                    _endDate.addDays(-1);
                    break;
                default:
                    throw "unknown data type";
            }
            var _beginDate = date2str(_beginDate,"yyyy-MM-dd hh:mm:ss")
            var _endDate = date2str(_endDate,"yyyy-MM-dd hh:mm:ss")
            asyncData(obj,_beginDate,_endDate ,type)
        });
        $(obj).find(".mainleft").die().live('click', function () {
            var type = constant[obj.id].date_type;
            var _beginDate = new Date(startDate);
            var _endDate =  new Date(startDate);
            switch (type) {
                case date_type.day:
                    _beginDate.addDays(-1);
                    _endDate.addDays(0);
                    break;
                case date_type.week:
                    _beginDate.addDays(-7);
                    _endDate.addDays(0);
                    break;
                case date_type.month:
                    _beginDate.addMonths(-1);
                    _endDate.addMonths(0);
                    _endDate.addDays(-1);
                    break;
                case date_type.year:
                    _beginDate.addYears(-1);
                    _endDate.addYears(0);
                    _endDate.addDays(-1);
                    break;
                default:
                    throw "unknown data type";
            }
            var _beginDate = date2str(_beginDate,"yyyy-MM-dd hh:mm:ss")
            var _endDate = date2str(_endDate,"yyyy-MM-dd hh:mm:ss")
            asyncData(obj,_beginDate,_endDate ,type)
//                var begin = new Date(""+endDate.getFullYear()+"-1-1");
//                var _beginDate = date2str(begin,"yyyy-MM-dd hh:mm:ss");
//                var temp = begin;
//                temp.addYears(1);
//                temp.addDays(-1);
//                var _endDate = date2str(temp,"yyyy-MM-dd hh:mm:ss")
//                asyncData(obj,_beginDate,_endDate ,constant[obj.id].date_type)
        });
    }

    /**
     * 创建时间轴的主函数
     */
    var createTimeLine = function (obj) {
        initConstant(obj);
        constant[obj.id].onLoad(obj);
        createSkeleton(obj);
        appendData(obj);
        bindMouse(obj);
        constant[obj.id].onLoadFinish(obj);
    }

    /**
     * 定义插件名字
     * @param options
     */
    $.fn.myTimeLine = function (options) {
        var timeline = this;
        $.extend(defaults, options);
        this.each(function () {
            createTimeLine(this);
//            initConstant(this);
        });
        return {
            /**
             * 装载数据
             * @param data json对象类型{data_type:string,data:Array,start_date:string}
             */
            loadData: function (data) {
                $.extend(defaults, data);
                if (typeof timeline == "object" && timeline.length > 0) {
                    var line = timeline[0];
                }
                initConstant(line)
                appendData(line);
                bindMouse(line);

            },
            //销毁用的
            destroy:function(){
                if (typeof timeline == "object" && timeline.length > 0) {
                    var id = timeline[0].id;
                }else{
                    var id = timeline.id;
                }
                constant.pop(id)
            }
        }
    }

})(jQuery)