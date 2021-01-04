function Region(selector) {
    this.el = $(selector); 
}
Region.prototype.show = function (views) {
    this.el.empty();
    if (!_.isArray(views)) { views = [views]; }
    views.forEach(function (view) {
        this.el.append(view.render().el); 
    }.bind(this));
};

var layout = {
    podcasts: new Region('#podcasts'),
    episodes: new Region('#episodes'),
    episode:  new Region('#episode')
}

var Router = Backbone.Router.extend({
    routes: {
        '': 'index',
        'podcasts/new': 'newPodcast',
        'podcasts/:id': 'podcast'
    },
    initialize: function (options) {
        window.podcasts = this.podcasts = options.podcasts;
        this.nav = new NavView();
    },
    index: function () {
        layout.podcasts.show(new PodcastListView({ collection: this.podcasts }));
    },
    newPodcast: function () {
        var pv = new PodcastListView({ collection: this.podcasts });
        layout.podcasts.show(pv);
        pv.$el.append(new NewPodcastView({ collection: this.podcasts }).render().el);
    },
    podcast: function (id) {
        layout.podcasts.show(new PodcastListView({ 
            collection: this.podcasts, 
            current: parseInt(id, 10) 
        }));
        var podcast = this.podcasts.get(id);
        var episodes = podcast.episodes();
        episodes.fetch();
        layout.episodes.show([
                new EpisodesToolsView({ model: podcast, collection: episodes }),
                //new CoverArtView({ model: podcast }),
                new EpisodesView({ collection: episodes, layout: layout.episode })
        ]);
    }
});
