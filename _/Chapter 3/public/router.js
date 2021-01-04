/*jslint sloppy:true */
/*global $, Backbone, console, EventsView, EditEventView, CreateEventView, ControlsView */

var AppRouter = Backbone.Router.extend({
    initialize: function (options) {
        this.main = options.main;
        this.events = options.events;
        this.nav = this.navigate.bind(this);
    },
    routes: {
        '': 'index',
        'create': 'create',
        'edit/:id': 'edit'
    },
    index: function () {
        var cv = new ControlsView({
            nav: this.nav
        }),
            av = new EventsView({
                collection: this.events,
                nav: this.nav
            });
        this.main.html(cv.render().el);
        this.main.append(av.render().el);
    },
    create: function () {
        var cv = new CreateEventView({
            collection: this.events,
            nav: this.nav
        });
        this.modal(cv);
    },
    edit: function (id) {
        var ev = new EditEventView({
            model: this.events.get(parseInt(id, 10)),
            nav: this.nav
        });
        this.modal(ev);
    },
    modal: function (view) {
        if ($("ul.nav").length === 0) {
            this.index();
        }
        this.main.prepend(view.render().el);
    }
});