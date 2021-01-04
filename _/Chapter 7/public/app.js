_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };//{{{

var TokenView = Backbone.View.extend({
    className: 'token',
    events: {
        'click': 'choose'
    },
    render: function () {
        this.model.view = this;
        this.el.innerHTML = this.model.get('text');
        return this;
    },
    choose: function () {
        Backbone.trigger('token', this.model);
        this.hide();
    },
    hide: function () {
        this.$el.addClass('hidden');
    },
    show: function () {
        this.$el.removeClass('hidden');
    }
});

var ClueView = Backbone.View.extend({
    tagName: 'tr',
    template: _.template($('#clue').html()),
    initialize: function () {
        Backbone.on('correct', this.correct, this);
    },
    render: function () {
        this.el.innerHTML = this.template(this.model.toJSON());
        return this;
    },
    correct: function (word) {
        if (this.model.get('word') === word.get('word')) {
            this.$el.addClass('correct');
            this.$('.word').removeClass('clue').text(word.get('word'));
        }
    }
});
var CluesView = Backbone.View.extend({
    tagName: 'table',
    render: function () {
        this.collection.forEach(function (word) {
            this.el.appendChild(new ClueView({ model: word }).render().el);
        }, this);
        return this;
    }
});
var TokensView = Backbone.View.extend({
    render: function () {
        this.collection.tokens().shuffle().forEach(this.addToken, this);
        return this;
    },
    addToken: function (token) {
        this.el.appendChild(new TokenView({ model: token }).render().el);
    }
});//}}}
var GuessView = Backbone.View.extend({//{{{
    className: 'guess',
    template: _.template($('#guess').html()),
    events: {
        'click #guessBtn': 'guess',
        'mouseover #guessBtn': 'color',
        'mouseout #guessBtn': 'color'
    },
    color: function () {
        this.$el.toggleClass('border');
    },
    initialize: function () {
        Backbone.on('token', this.add, this);
        this.currentTokens = [];
    },
    render: function () {
        this.el.innerHTML = this.template();
        this.guessText = this.$('.text');
        return this;
    },
    add: function (token) {
        this.currentTokens.push(token);
        this.guessText.append(token.get('text'));
    },
    guess: function (evt) {
        var results = this.collection.guess(this.guessText.text());
        if (results.word) {
            Backbone.trigger('correct', results.word);
        } else {
            this.currentTokens.forEach(function (token) {
                token.view.show();
            });
        }
        this.currentTokens = [];
        this.guessText.text('');
        if (results.complete) Backbone.trigger('completed', this.collection);
    }
});
var InfoView = Backbone.View.extend({
    className: 'info',
    template: _.template($('#info').html()),
    initialize: function () {
        this.listenTo(Backbone, 'correct', this.updateScore);
        this.collection.listenTo(Backbone, 'completed', this.collection.stop);
    },
    render: function () {
        this.el.innerHTML = this.template();
        this.time = this.$('.timer');
        this.score = this.$('.score');
        this.collection.start(this.time.text.bind(this.time));
        return this;
    },
    updateScore: function () {
        this.score.text(this.collection.score + ' points');
    }
});//}}}
var GameView = Backbone.View.extend({//{{{
    render: function () {
        var tv = new InfoView({ collection: this.collection }),
            cv = new CluesView({ collection: this.collection }),
            gv = new GuessView({ collection: this.collection }),
            pv = new TokensView({ collection: this.collection });

        this.$el.append(tv.render().el)
                .append(cv.render().el)
                .append(gv.render().el)
                .append(pv.render().el);

        return this;
    }
});//}}}
var HomeView = Backbone.View.extend({
    template: _.template($('#home').html()),
    events: {
        'click a' : 'chooseLevel'
    },
    render: function () {
        this.el.innerHTML = this.template();
        return this;
    },
    chooseLevel: function (evt) {
        evt.preventDefault();
        this.remove();
        Backbone.history.navigate(evt.currentTarget.pathname, { trigger: true });
        return false;
    }
});
