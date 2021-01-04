window.App = window.App || {};

App.Views = {};

App.Views.Month = Backbone.View.extend({
    template: JST.month,
    events: {
        'click .prev': 'prev',
        'click .next': 'next'
    },
    render: function () {
        this.el.innerHTML = this.template(this.model.toJSON());
        var weeks = this.model.get('weeks');
        for (var i = 0; i < weeks; i++) {
            this.$("tbody").append(new App.Views.WeekRow({
                week  : i,
                model : this.model,
                collection: this.collection
            }).render().el);
        }
        return this;
    },
    prev: function () {
        var route = this.model.moment()
            .subtract(1, 'month').format('YYYY/MM');
        App.Router.navigate(route, { trigger: true });
    },
    next: function () {
        var route = this.model.moment()
            .add(1, 'month').format('YYYY/MM');
        App.Router.navigate(route, { trigger: true });
    }
});

App.Views.WeekRow = Backbone.View.extend({
    tagName: 'tr',
    initialize: function (options) {
        if (options) {
            this.week = options.week;
        }
    },
    render: function () {
        var month = this.model;

        if (this.week === 0) {
            var firstDay = month.moment().day();
            for (var i = 0; i < firstDay; i++) {
                this.$el.append("<td>");
            }
        }

        month.weekDates(this.week).forEach(function (date) {
            date = month.moment().date(date);
            this.$el.append(new App.Views.DayCell({
                model: date,
                collection: this.collection.onDate(date)
            }).render().el);
        }, this);

        return this;
    }
});

App.Views.DayCell = Backbone.View.extend({
    tagName: 'td',
    template: JST.dayCell,
    events: {
        'click': 'switchToDayView'
    },
    render: function () {
        this.el.innerHTML = this.template({ 
            num: this.model.date(),
            titles: this.collection.pluck('title') 
        });
        return this;
    },
    switchToDayView: function () {
        App.Router.navigate(this.model.format('YYYY/MM/DD'), { trigger: true });
    }
});//}}}

App.Views.Day = Backbone.View.extend({
    template: JST.day,
    initialize: function (options) {
        this.date = options.date;
        this.listenTo(this.collection, 'hover', this.showDetails);
    },
    events: {
        'click .back' : 'backToMonth'
    },
    render: function () {
        this.el.innerHTML = this.template({ 
            date: this.date.format("MMMM D, YYYY") 
        });
        this.$('div').append(new App.Views.DayTable({
            date: this.date,
            collection: this.collection
        }).render().el);

        var div = this.$('div').append('<div>')

        this.details = new App.Views.Details();
        div.append(this.details.el);

        div.append(new App.Views.CreateEvent({
            date: this.date.format('YYYY-MM-DD'),
            collection: this.collection
        }).render().el);

        return this;
    },
    backToMonth: function () {
        App.Router.navigate(this.date.format('/YYYY/MM'), { trigger: true });
    },
    showDetails: function (model) {
        this.details.changeModel(model);
    }
});

App.Views.DayTable = Backbone.View.extend({//{{{
    tagName: 'table',
    className: 'day',
    template: JST.dayTable,
    events: {
        'mouseover tr.highlight td.event': 'hover',
        'mouseout  tr.highlight td.event': 'hover'
    },
    initialize: function (options) {
        this.date = options.date;
        this.listenTo(this.collection, 'add', this.addEvent)
        this.listenTo(this.collection, 'destroy', this.destroyEvent)
        this.hours = {};
    },
    render: function () {
        this.el.innerHTML = this.template();

        for (var i = 0; i < 24; i++) {
            var time = moment(i, "H").format('h:mm A');
            this.hours[time] = new App.Views.Hour({ time: time });
            this.$('tbody').append(this.hours[time].render().el);
        }
        this.collection.onDate(this.date).forEach(this.addEvent, this);
        return this;
    },
    addEvent: function (evt) {
        evt.hours().forEach(function (hour) {
            this.hours[hour].displayEvent(evt);
        }, this);
    },
    destroyEvent: function (evt) {
        evt.hours().forEach(function (hour) {
            this.hours[hour].removeEvent();
        }, this);
    },
    hover: function (e) {
        var evt = this.collection.get( 
            parseInt(e.currentTarget.getAttribute('data-id'), 10)
        );

        evt.hours().forEach(function (hour) {
            this.hours[hour].hover();
        }, this);
        
        this.collection.trigger("hover", evt);
    }
});

App.Views.Hour = Backbone.View.extend({
    tagName: 'tr',
    template: JST.hour,
    initialize: function (options) {
        this.time = options.time;
    },
    render: function () {
        this.el.innerHTML = this.template({ time: this.time });
        return this;
    },
    displayEvent: function (model) {
        this.$el.addClass("highlight");
        this.$('.event').attr('data-id', model.get('id'));
        this.$(".event").text(model.get('title'));
    },
    removeEvent: function () {
        this.$el.removeClass('highlight');
        this.$('.event').removeAttr('data-id');
        this.$('.event').text('');
    },
    hover: function () {
        this.$el.toggleClass('hover');
    }
});

App.Views.CreateEvent = Backbone.View.extend({
    tagName: 'form',
    template: JST.createEvent,
    initialize: function (options) {
        this.date = options.date;
    },
    events: {
        'click button': 'createEvent'
    },
    render: function () {
        this.el.innerHTML = this.template();
        return this;
    },
    createEvent: function (evt) {
        evt.preventDefault();

        var model = new App.Models.Event({
            collection: this.collection.onDate(this.date),
            title: this.$("#eventTitle").val(),
            date: this.date,
            startTime: this.$("#eventStartTime").val(),
            endTime: this.$("#eventEndTime").val()
        });

        if (model.isValid()) {
            this.collection.create(model, { wait: true });
            this.el.reset();
            this.$(".error").text('');
        } else {
            this.$(".error").text(model.validationError);
        }

        return false;
    }
});
//*/

App.Views.Details = Backbone.View.extend({
    template: JST.details,
    events: {
        'click button': 'delete'
    },
    initialize: function () {
        this.data = {
            title: "Hover over an event to see details",
            start: ''
        };
        this.render();
    },
    render: function () {
        this.el.innerHTML = this.template(this.data);
        return this;
    },
    changeModel: function (model) {
        this.model = model;
        var s = this.model.start(),
            e = this.model.end();
        this.data = {
            title: model.get('title'),
            start: s.format('h:mm A'),
            end: e.format('h:mm A'),
            duration: e.diff(s,'hour') + ' hours'
        }
        return this.render();
    },
    delete: function () {
        this.model.destroy();
    }
});
//*/
