/**
 * jquery.calendar.js - A flexible JQuery Calendar Plugin based on dot.js Templates.
 *
 * Dependencies:
 * - dot.js (http://olado.github.com/doT/) for templating
 * - moment.js (http://momentjs.com) for date operations
 *
 * @author Roger Dudler <roger.dudler@gmail.com>
 */
(function ($) {

    $.fn.calendar = function(options) {

        // set default settings
        var settings = $.extend({
            'months': 2, // how many months should be displayed
            'weeks': 5,
            'containerSelector': '.calendar', // selector for the calendar container
            'daySelector': '.day', // selector for a day
            'nextSelector': '.btn-month-next', // selector for next month button
            'prevSelector': '.btn-month-prev', // selector for previous month button
            'format': 'DD.MM.YYYY', // date format for input field
            'appendTo': 'body', // where to append the flyout
            'offset': 0, // month offset (selected month + offset as initial month)
            'weekdayOffset': 1, // when to start the week, 1 = Monday, 0 = Sunday
            'position': 'top', // position of flyout
            'language': 'de', // language (be sure to include moment.js language files)
            'changed': function(data) {} // override to handle date changes
        }, options);

        // set language
        moment.lang(settings.language);

        // initialize date object for now
        var now = moment();

        // initialize template cache
        var template = [];

        // iterate over selected elements
        return this.each(function() {
            var $this = $(this);

            // read initial date from input
            var initial = moment($this.val(), settings.format);

            // prepare calendar template, use cache if available
            var templateId = $this.data('template');
            if (!template[templateId]) {
                template[templateId] = doT.template($($this.data('template')).text());
            }
            
            // get data and render calendar template
            var data = _data(0);
            var $calendar = $(template[templateId](data));

            // bind events
            $calendar.on('mousedown', function() {
                return false;
            });

            // update value on click on a day, close calendar afterwards
            $calendar.on('click', settings.daySelector, function() {
                var day = $(this).data('day');
                var month = $(this).data('month');
                var year = $(this).data('year');
                var date = moment(new Date(year, month, day));
                $this.val(date.format(settings.format));
                $calendar.hide();
                return false;
            });

            // switch to previous month(s)
            $calendar.on('click', settings.prevSelector, function() {
                data = _data(--settings.offset);
                var $newcalendar = $(template[templateId](data));
                $calendar.html($newcalendar.html());
                return false;
            });

            // switch to next month(s)
            $calendar.on('click', settings.nextSelector, function() {
                data = _data(++settings.offset);
                var $newcalendar = $(template[templateId](data));
                $calendar.html($newcalendar.html());
                return false;
            });

            // validate inputs
            $this.on('keypress', function(e) {
                if ((e.keyCode > 47 && e.keyCode < 58) || e.keyCode == 46) {
                    return true;
                }
                return false;
            });

            // update position of calendar container (e.g. flyout)
            $this.on('focus', function() {
                switch (settings.position) {
                    case 'top':
                    default:
                        $calendar.css({
                            'left': $this.offset().left,
                            'top': $this.offset().top - $calendar.height()
                        });
                        break;
                }
                $calendar.show();
            });

            // close calendar on blur of input
            $this.on('blur', function() {
                $calendar.hide();
            });

            // generate data for calendar display
            function _data(offset) {
                var weekdays = [
                    moment.weekdaysMin[(settings.weekdayOffset)%7],
                    moment.weekdaysMin[(settings.weekdayOffset+1)%7],
                    moment.weekdaysMin[(settings.weekdayOffset+2)%7],
                    moment.weekdaysMin[(settings.weekdayOffset+3)%7],
                    moment.weekdaysMin[(settings.weekdayOffset+4)%7],
                    moment.weekdaysMin[(settings.weekdayOffset+5)%7],
                    moment.weekdaysMin[(settings.weekdayOffset+6)%7]
                ];
                var data = { 'days': [], 'weekdays': weekdays };
                var thisMonth = (offset == 0);
                
                // build month
                var monthindex = 0;
                for (var m = offset; m < settings.months + offset; m++) {

                    // initialize moment date objects
                    var momentCurrentMonth = initial.clone().add('months', m);
                    var momentLastMonth = initial.clone().add('months', m - 1);
                    var momentNextMonth = initial.clone().add('months', m + 1);

                    // initialize values
                    var days = momentCurrentMonth.daysInMonth();
                    var daysInLastMonth = momentLastMonth.daysInMonth();
                    var startOfMonth = momentCurrentMonth.clone().startOf('month').day();
                    var beginning = startOfMonth >= settings.weekdayOffset ? settings.weekdayOffset : settings.weekdayOffset - 7;
                    var day = momentCurrentMonth.clone().startOf('month').day(beginning).date();
                    var weeks = settings.weeks;

                    // in which month is the current day
                    var prevMonth = day > 1;
                    var currentMonth = day === 1;
                    var nextMonth = false;

                    // pre-fill data object with information about months
                    data.days[monthindex] = {
                        'month': momentCurrentMonth.month(),
                        'name': moment.months[momentCurrentMonth.month()],
                        'year': momentCurrentMonth.year(),
                        'prev': {
                            'month': momentLastMonth.month(),
                            'name': moment.months[momentLastMonth.month()],
                            'year': momentLastMonth.year()
                        },
                        'next': {
                            'month': momentNextMonth.month(),
                            'name': moment.months[momentNextMonth.month()],
                            'year': momentNextMonth.year()
                        },
                        'items': []
                    };

                    for (var w = 0; w <= weeks; w++) {
                        data.days[monthindex]['items'][w] = [];
                        for (var i = 0; i <= 6; i++) {
                            
                            var weekday = (i + settings.weekdayOffset) > 6 ? (i + settings.weekdayOffset) % 7 : (i + settings.weekdayOffset);

                            // current month
                            if (currentMonth) {
                                data.days[monthindex]['items'][w][i] = {
                                    'day': day,
                                    'weekday': weekday,
                                    'month': data.days[monthindex].month,
                                    'year': data.days[monthindex].year
                                };
                                if (day == now.date() &&
                                    data.days[monthindex].month == now.month() &&
                                    data.days[monthindex].year == now.year()) {
                                    data.days[monthindex]['items'][w][i].today = true;
                                }
                                if (day == days) {
                                    currentMonth = false;
                                    nextMonth = true;
                                    day = 1;
                                } else {
                                    day = day < days ? ++day : 1;
                                }
                                continue;
                            }

                            // previous month in current month block
                            if (prevMonth) {
                                data.days[monthindex]['items'][w][i] = {
                                    'prev': true,
                                    'day': day,
                                    'weekday': weekday,
                                    'month': data.days[monthindex].prev.month,
                                    'year': data.days[monthindex].prev.year
                                };
                                if (day == now.date() &&
                                    data.days[monthindex].prev.month == now.month() &&
                                    data.days[monthindex].prev.year == now.year()) {
                                    data.days[monthindex]['items'][w][i].today = true;
                                }
                                if (day == daysInLastMonth) {
                                    day = 1;
                                    prevMonth = false;
                                    currentMonth = true;
                                } else {
                                    day++;
                                }
                                continue;
                            }
                            // next month in current month block
                            if (nextMonth) {
                                data.days[monthindex]['items'][w][i] = {
                                    'next': true,
                                    'day': day,
                                    'weekday': weekday,
                                    'month': data.days[monthindex].next.month,
                                    'year': data.days[monthindex].next.year
                                };
                                if (day == now.date() &&
                                    data.days[monthindex].next.month == now.month() &&
                                    data.days[monthindex].next.year == now.year()) {
                                    data.days[monthindex]['items'][w][i].today = true;
                                }
                                day++;
                                continue;
                            }
                        }
                    }
                    thisMonth = false;
                    monthindex++;
                }
                return data;
            }

            // insert calendar after input field
            return $(settings.appendTo).append($calendar);
        });
    };
})(jQuery);