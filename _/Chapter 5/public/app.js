_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
};

var App = new Backbone.Marionette.Application();

App.addInitializer(function () {
    App.addRegions({
        main: App.Layout.MainRegion
    });
});

App.on('initialize:after', function () {
    Backbone.history.start({ pushState: true });
});
