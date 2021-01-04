App.module('Layout', function (Layout) {
    Layout.Layout = Backbone.Marionette.Layout.extend({
        template: '#appLayout',
        regions: {
            users: '#users',
            rooms: '#rooms',
            conversation: '#conversation',
            controls: '#controls' 
        }
    });

    Layout.MainRegion = Backbone.Marionette.Region.extend({
        el: '#main'
    });
});
