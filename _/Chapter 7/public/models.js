
var Token = Backbone.Model.extend({});
var Tokens = Backbone.Collection.extend({
    model: Token
});
var Word = Backbone.Model.extend({
    initialize: function () {
        this.set('points', this.get('word').length + this.get('level'));
    },
    parts: function () {
        return Word.split(this.get('word'));
    }
}, {
    split: function (word) {
        word = word.split('');
        var tokens = [];

        var rand234 = Word.weightedRandomGenerator([[2, 0.2], [3, 0.4], [4,0.4]]),
            rand23  = Word.weightedRandomGenerator([[2, 0.5], [3, 0.5]]),
            rand24  = Word.weightedRandomGenerator([[2, 0.5], [4, 0.5]]);

        var w, length;
        while (word.length > 0) {
            w = word.length;
            if      (w  >  5) length = rand234();
            else if (w === 5) length = rand23();
            else if (w === 4) length = rand24();
            else              length = w;

            tokens.push(word.splice(0, length).join(''));
        }
        return tokens;
    },
    weightedRandomGenerator: function (items) {
        var total = items.reduce(function (prev, cur) { return prev + cur[1]; }, 0),
            sum = 0,
            list = [];
        for (var i = 0; i < items.length; i++) {
            sum = (sum*100 + items[i][1]*100) / 100;
            list.push(sum);
        }
        return function () {
            var random = Math.random() * total;
            for (var i = 0; i < list.length; i++) {
                if (random <= list[i]) {
                    return items[i][0];
                }
            }
        }
    }
});
var Game = Backbone.Collection.extend({
    model: Word,
    initialize: function (models, options) {
        this.guessedCorrectly = [];
        this.seconds = -1;
        this.score = 0;
        this.level = 1;
    },
    getWords: function () {
        return Backbone
            .ajax("/game/" + this.level)
            .then(this.reset.bind(this));
    },
    start: function (callback) {
        this.callback = callback;
        this.loop();
    },
    loop: function () {
        this.seconds++;
        this.callback(this.time());
        this.timeout = setTimeout(this.loop.bind(this), 1000);
    },
    stop: function () {
        clearTimeout(this.timeout);
        Backbone.ajax({
          url: '/game',
          method: 'POST', 
          data: {
            time: this.seconds,
            score: this.score,
            date: new Date().toJSON()
          }
        });
    },
    time: function () {
        var hrs = parseInt(this.seconds / 3600),
            min = parseInt((this.seconds % 3600) / 60),
            sec = (this.seconds % 3600) % 60;

        if (min < 10) min = "0" + min;
        if (sec < 10) sec = "0" + sec;
        var time = min + ":" + sec;

        if (hrs === 0) return time;

        if (hrs < 10) hrs = "0" + hrs;
        return hrs + ":" + time;
    },
    tokens: function () {
        var tokens = _.flatten(this.invoke('parts'));
        return new Tokens(tokens.map(function (token) {
            return { text: token };
        }));
    },
    guess: function (word) {
        var results = {
            word: this.findWhere({ word: word }),
            complete: false
        };
        if (results.word) {
            results.word.set('correct', true);
            var score = results.word.get('points');
            var mult = 10 - parseInt(this.seconds / 15);
            if (mult <= 0) mult = 1;
            this.score += score * mult;
            results.complete = this.where({
                correct:true
            }).length === this.length;
        }
        return results;
    }
});
