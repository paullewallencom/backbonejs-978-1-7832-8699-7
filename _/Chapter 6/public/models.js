var Episode = Backbone.Model.extend({
    urlRoot: '/episode',
    listen: function () {
        this.save({ listened: true });
    }
});
var Episodes = Backbone.Collection.extend({
    model: Episode,
    initialize: function (models, options) {
        this.podcast = options.podcast;
    },
    url: function () {
        return this.podcast.url() + '/episodes';
    },
    comparator: function (a, b) {
      return +new Date(b.get('pubDate')) - +new Date(a.get('pubDate'));
    }
});

var Podcast = Backbone.Model.extend({
    episodes: function () {
        return this.episode || (this.episode = new Episodes([], { podcast: this }));
    }
});

var Podcasts = Backbone.Collection.extend({
    model: Podcast,
    url: '/podcasts',
});
