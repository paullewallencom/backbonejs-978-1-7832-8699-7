window.App = window.App || {};

App.Router = Backbone.Router.extend({
    initialize: function (options) {
        this.main = options.main;
        this.calendar = options.calendar;
        App.Router.navigate = this.navigate.bind(this);
    },
    routes: {
        '': 'month',
        ':year/:month': 'month',
        ':year/:month/:day': 'day'
    },
    month: function (year, month) {
        var c = this.clean(year, month);
        
        this.main.html(new App.Views.Month({
            collection: this.calendar,
            model: new App.Models.Month({ year: c[0], month: c[1] })
        }).render().el);
    },
    day: function (year, month, day) {
        var date = moment(this.clean(year, month, day)); 
        this.main.html(new App.Views.Day({
            date: date,
            collection: this.calendar
        }).render().el);
    },
    clean: function (year, month, day) {
        var now = moment();
        year  = parseInt(year, 10)             || now.year();
        month = (parseInt(month, 10) - 1) % 12 || now.month();
        day   = parseInt(day, 10)              || now.day();
        return [year, month, day];
    }
});
