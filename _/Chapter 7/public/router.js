var Router = Backbone.Router.extend({
    initialize: function (options) {
        this.main = options.main;
    },
    routes: {
        '': 'index',
        'play': 'play',
        'play/:level': 'play'
    },
    index: function () {
        this.main.html(new HomeView().render().el);
    },
    play: function (level) {
        var game = new Game();
        if (level) game.level = level;
        game.getWords().then(function () {
            this.main.html(new GameView({ collection: game }).render().el);
        }.bind(this));
    }
});
