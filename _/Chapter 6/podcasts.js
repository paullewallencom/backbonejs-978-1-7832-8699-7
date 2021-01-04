var http        = require('http');
var Bourne      = require('bourne');
var Q           = require('q');
var parseString = require('xml2js').parseString;
var pcdb = new Bourne('podcasts.json');
var epdb = new Bourne('episodes.json');

function Podcast(feed, userId) {//{{{
    var self      = this;
    var info      = Q.defer();
    var episodes  = Q.defer();
    this.info     = info.promise;
    this.episodes = episodes.promise;
    this.ready    = Q.all([this.info, this.episodes]);

    if (typeof feed === 'string') {
        get(feed).then(parse).then(function (data) {
            data.info.userId = userId;
            data.info.feed = feed;

            pcdb.insert(data.info, function (err, data) {
                info.resolve(data);
            });

            self.info.then(function (record) {
                data.episodes.forEach(function (e) {
                    e.podcastId = record.id;
                });

                epdb.insertAll(data.episodes, function (err, records) {
                    episodes.resolve(records);            
                });
            });
        });
    } else {
        pcdb.findOne({ id: feed }, function (err, record) {
            info.resolve(record);
        });

        epdb.find({ podcastId: feed }, function (err, records) {
            episodes.resolve(records);
        });
    }
}

Podcast.prototype.update = function () {
    var d = Q.defer();

    this.ready.spread(function (info, oldEpisodes) {
        function resolve () {
            epdb.find({ podcastId: info.id }, function (err, records) {
                d.resolve(records);                       
            });
        }

        var now = +new Date();

        if (now - info.lastUpdated > 86400000) {
            get(info.feed).then(parse).then(function (data) {
                if (data.episodes.length > oldEpisodes.length) {
                    var oldTitles = oldEpisodes.map(function (e) { return e.title; }),
                        newEpisodes = data.episodes.filter(function (e) { 
                            return oldTitles.indexOf(e.title) === -1; 
                        });

                    epdb.insertAll(newEpisodes, resolve);
                } else {
                    resolve();
                }
                pcdb.update({ id: info.id }, { lastUpdated: now });
            });
        } else {
            resolve();
        }
    });
    return d.promise;
};//}}}

function Podcasts (id) {
    this.id = id;
}

Podcasts.prototype.all = function () {
    var d = Q.defer();
    pcdb.find({ userId: this.id }, function (err, records) {
        d.resolve(records);
    });
    return d.promise;
};

Podcasts.prototype.get = function (feed) {
    return new Podcast(feed, this.id);
};

Podcasts.prototype.updateEpisode = function (id, update, callback) {
    epdb.update({ id: id }, update, callback);
};

module.exports = Podcasts;

function get (url) {//{{{
    var deferred = Q.defer();
    var req = http.get(url, function (res) {
        var xml = '';
        res.on('data', function (chunk) {
            xml += chunk;
        });
        res.on('end', function () {
            deferred.resolve(xml);
        });
    });
    return deferred.promise;
};

function parse(xml) {
    var deferred = Q.defer();
    parseString(xml, function (err, result) {
        var rss = result.rss.channel[0];

        var info = {
            title: rss.title[0],
            link:  rss.link[0],
            image: rss['itunes:image'][0].$.href,
            lastUpdated: +new Date()
        };

        var episodes = rss.item.map(function (item) {
            return {
                title:       item.title[0],
                duration:    item['itunes:duration'][0],
                audio:       item.enclosure[0].$.url,
                link:        item.link[0],
                description: item['content:encoded'][0],
                pubDate:     item.pubDate[0],
                listened:    false
            };
        });

        deferred.resolve({ info: info, episodes: episodes });
    });
    return deferred.promise;
}//}}}
