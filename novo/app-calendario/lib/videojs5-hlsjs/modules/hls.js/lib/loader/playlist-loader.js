'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _errors = require('../errors');

var _url = require('../utils/url');

var _url2 = _interopRequireDefault(_url);

var _attrList = require('../utils/attr-list');

var _attrList2 = _interopRequireDefault(_attrList);

var _logger = require('../utils/logger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Playlist Loader
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var PlaylistLoader = function (_EventHandler) {
  _inherits(PlaylistLoader, _EventHandler);

  function PlaylistLoader(hls) {
    _classCallCheck(this, PlaylistLoader);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(PlaylistLoader).call(this, hls, _events2.default.MANIFEST_LOADING, _events2.default.LEVEL_LOADING));
  }

  _createClass(PlaylistLoader, [{
    key: 'destroy',
    value: function destroy() {
      if (this.loader) {
        this.loader.destroy();
        this.loader = null;
      }
      this.url = this.id = null;
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onManifestLoading',
    value: function onManifestLoading(data) {
      this.load(data.url, null);
    }
  }, {
    key: 'onLevelLoading',
    value: function onLevelLoading(data) {
      this.load(data.url, data.level, data.id);
    }
  }, {
    key: 'load',
    value: function load(url, id1, id2) {
      var config = this.hls.config,
          retry,
          timeout,
          retryDelay;

      if (this.loading && this.loader) {
        if (this.url === url && this.id === id1 && this.id2 === id2) {
          // same request than last pending one, don't do anything
          return;
        } else {
          // one playlist load request is pending, but with different params, abort it before loading new playlist
          this.loader.abort();
        }
      }

      this.url = url;
      this.id = id1;
      this.id2 = id2;
      if (this.id === null) {
        retry = config.manifestLoadingMaxRetry;
        timeout = config.manifestLoadingTimeOut;
        retryDelay = config.manifestLoadingRetryDelay;
      } else {
        retry = config.levelLoadingMaxRetry;
        timeout = config.levelLoadingTimeOut;
        retryDelay = config.levelLoadingRetryDelay;
      }
      this.loader = typeof config.pLoader !== 'undefined' ? new config.pLoader(config) : new config.loader(config);
      this.loading = true;
      this.loader.load(url, '', this.loadsuccess.bind(this), this.loaderror.bind(this), this.loadtimeout.bind(this), timeout, retry, retryDelay);
    }
  }, {
    key: 'resolve',
    value: function resolve(url, baseUrl) {
      return _url2.default.buildAbsoluteURL(baseUrl, url);
    }
  }, {
    key: 'parseMasterPlaylist',
    value: function parseMasterPlaylist(string, baseurl) {
      var levels = [],
          result = void 0;

      // https://regex101.com is your friend
      var re = /#EXT-X-STREAM-INF:([^\n\r]*)[\r\n]+([^\r\n]+)/g;
      while ((result = re.exec(string)) != null) {
        var level = {};

        var attrs = level.attrs = new _attrList2.default(result[1]);
        level.url = this.resolve(result[2], baseurl);

        var resolution = attrs.decimalResolution('RESOLUTION');
        if (resolution) {
          level.width = resolution.width;
          level.height = resolution.height;
        }
        level.bitrate = attrs.decimalInteger('AVERAGE-BANDWIDTH') || attrs.decimalInteger('BANDWIDTH');
        level.name = attrs.NAME;

        var codecs = attrs.CODECS;
        if (codecs) {
          codecs = codecs.split(',');
          for (var i = 0; i < codecs.length; i++) {
            var codec = codecs[i];
            if (codec.indexOf('avc1') !== -1) {
              level.videoCodec = this.avc1toavcoti(codec);
            } else {
              level.audioCodec = codec;
            }
          }
        }

        levels.push(level);
      }
      return levels;
    }

    /**
     * Utility method for parseLevelPlaylist to create an initialization vector for a given segment
     * @returns {Uint8Array}
     */

  }, {
    key: 'createInitializationVector',
    value: function createInitializationVector(segmentNumber) {
      var uint8View = new Uint8Array(16);

      for (var i = 12; i < 16; i++) {
        uint8View[i] = segmentNumber >> 8 * (15 - i) & 0xff;
      }

      return uint8View;
    }

    /**
     * Utility method for parseLevelPlaylist to get a fragment's decryption data from the currently parsed encryption key data
     * @param levelkey - a playlist's encryption info
     * @param segmentNumber - the fragment's segment number
     * @returns {*} - an object to be applied as a fragment's decryptdata
     */

  }, {
    key: 'fragmentDecryptdataFromLevelkey',
    value: function fragmentDecryptdataFromLevelkey(levelkey, segmentNumber) {
      var decryptdata = levelkey;

      if (levelkey && levelkey.method && levelkey.uri && !levelkey.iv) {
        decryptdata = this.cloneObj(levelkey);
        decryptdata.iv = this.createInitializationVector(segmentNumber);
      }

      return decryptdata;
    }
  }, {
    key: 'avc1toavcoti',
    value: function avc1toavcoti(codec) {
      var result,
          avcdata = codec.split('.');
      if (avcdata.length > 2) {
        result = avcdata.shift() + '.';
        result += parseInt(avcdata.shift()).toString(16);
        result += ('000' + parseInt(avcdata.shift()).toString(16)).substr(-4);
      } else {
        result = codec;
      }
      return result;
    }
  }, {
    key: 'cloneObj',
    value: function cloneObj(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  }, {
    key: 'parseLevelPlaylist',
    value: function parseLevelPlaylist(string, baseurl, id) {
      var currentSN = 0,
          fragdecryptdata,
          totalduration = 0,
          level = { version: null, type: null, url: baseurl, fragments: [], live: true, startSN: 0 },
          levelkey = { method: null, key: null, iv: null, uri: null },
          cc = 0,
          programDateTime = null,
          frag = null,
          result,
          regexp,
          duration = null,
          title = null,
          byteRangeEndOffset = null,
          byteRangeStartOffset = null;

      regexp = /(?:(?:#(EXTM3U))|(?:#EXT-X-(PLAYLIST-TYPE):(.+))|(?:#EXT-X-(MEDIA-SEQUENCE):(\d+))|(?:#EXT-X-(TARGETDURATION):(\d+))|(?:#EXT-X-(KEY):(.+))|(?:#EXT-X-(START):(.+))|(?:#EXT(INF):(\d+(?:\.\d+)?)(?:,(.*))?)|(?:(?!#)()(\S.+))|(?:#EXT-X-(BYTERANGE):(\d+(?:@\d+(?:\.\d+)?))|(?:#EXT-X-(ENDLIST))|(?:#EXT-X-(DIS)CONTINUITY))|(?:#EXT-X-(PROGRAM-DATE-TIME):(.+))|(?:#EXT-X-(VERSION):(\d+))|(?:(#)(.*):(.*))|(?:(#)(.*)))(?:.*)\r?\n?/g;
      while ((result = regexp.exec(string)) !== null) {
        result.shift();
        result = result.filter(function (n) {
          return n !== undefined;
        });
        switch (result[0]) {
          case 'VERSION':
            level.version = parseInt(result[1]);
            break;
          case 'PLAYLIST-TYPE':
            level.type = result[1].toUpperCase();
            break;
          case 'MEDIA-SEQUENCE':
            currentSN = level.startSN = parseInt(result[1]);
            break;
          case 'TARGETDURATION':
            level.targetduration = parseFloat(result[1]);
            break;
          case 'EXTM3U':
            break;
          case 'ENDLIST':
            level.live = false;
            break;
          case 'DIS':
            cc++;
            break;
          case 'BYTERANGE':
            var params = result[1].split('@');
            if (params.length === 1) {
              byteRangeStartOffset = byteRangeEndOffset;
            } else {
              byteRangeStartOffset = parseInt(params[1]);
            }
            byteRangeEndOffset = parseInt(params[0]) + byteRangeStartOffset;
            break;
          case 'INF':
            duration = parseFloat(result[1]);
            title = result[2] ? result[2] : null;
            break;
          case '':
            // url
            if (!isNaN(duration)) {
              var sn = currentSN++;
              fragdecryptdata = this.fragmentDecryptdataFromLevelkey(levelkey, sn);
              var url = result[1] ? this.resolve(result[1], baseurl) : null;
              frag = { url: url,
                duration: duration,
                title: title,
                start: totalduration,
                sn: sn,
                level: id,
                cc: cc,
                decryptdata: fragdecryptdata,
                programDateTime: programDateTime };
              // only include byte range options if used/needed
              if (byteRangeStartOffset !== null) {
                frag.byteRangeStartOffset = byteRangeStartOffset;
                frag.byteRangeEndOffset = byteRangeEndOffset;
              }
              level.fragments.push(frag);
              totalduration += duration;
              duration = null;
              title = null;
              byteRangeStartOffset = null;
              programDateTime = null;
            }
            break;
          case 'KEY':
            // https://tools.ietf.org/html/draft-pantos-http-live-streaming-08#section-3.4.4
            var decryptparams = result[1];
            var keyAttrs = new _attrList2.default(decryptparams);
            var decryptmethod = keyAttrs.enumeratedString('METHOD'),
                decrypturi = keyAttrs.URI,
                decryptiv = keyAttrs.hexadecimalInteger('IV');
            if (decryptmethod) {
              levelkey = { method: null, key: null, iv: null, uri: null };
              if (decrypturi && decryptmethod === 'AES-128') {
                levelkey.method = decryptmethod;
                // URI to get the key
                levelkey.uri = this.resolve(decrypturi, baseurl);
                levelkey.key = null;
                // Initialization Vector (IV)
                levelkey.iv = decryptiv;
              }
            }
            break;
          case 'START':
            var startParams = result[1];
            var startAttrs = new _attrList2.default(startParams);
            var startTimeOffset = startAttrs.decimalFloatingPoint('TIME-OFFSET');
            if (startTimeOffset) {
              level.startTimeOffset = startTimeOffset;
            }
            break;
          case 'PROGRAM-DATE-TIME':
            programDateTime = new Date(Date.parse(result[1]));
            break;
          case '#':
            result.shift();
            break;
          default:
            _logger.logger.warn('line parsed but not handled: ' + result);
            break;
        }
      }
      //logger.log('found ' + level.fragments.length + ' fragments');
      if (frag && !frag.url) {
        level.fragments.pop();
        totalduration -= frag.duration;
      }
      level.totalduration = totalduration;
      level.endSN = currentSN - 1;
      return level;
    }
  }, {
    key: 'loadsuccess',
    value: function loadsuccess(event, stats) {
      var target = event.currentTarget,
          string = target.responseText,
          url = target.responseURL,
          id = this.id,
          id2 = this.id2,
          hls = this.hls,
          levels;

      this.loading = false;
      // responseURL not supported on some browsers (it is used to detect URL redirection)
      if (url === undefined) {
        // fallback to initial URL
        url = this.url;
      }
      stats.tload = performance.now();
      stats.mtime = new Date(target.getResponseHeader('Last-Modified'));
      if (string.indexOf('#EXTM3U') === 0) {
        if (string.indexOf('#EXTINF:') > 0) {
          var levelDetails = this.parseLevelPlaylist(string, url, id || 0);
          levelDetails.tload = stats.tload;
          if (id === null) {
            // first request, stream manifest (no master playlist), fire manifest loaded event with level details
            hls.trigger(_events2.default.MANIFEST_LOADED, { levels: [{ url: url, details: levelDetails }], url: url, stats: stats });
          }
          stats.tparsed = performance.now();
          hls.trigger(_events2.default.LEVEL_LOADED, { details: levelDetails, level: id || 0, id: id2, stats: stats });
        } else {
          levels = this.parseMasterPlaylist(string, url);
          // multi level playlist, parse level info
          if (levels.length) {
            hls.trigger(_events2.default.MANIFEST_LOADED, { levels: levels, url: url, stats: stats });
          } else {
            hls.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: _errors.ErrorDetails.MANIFEST_PARSING_ERROR, fatal: true, url: url, reason: 'no level found in manifest' });
          }
        }
      } else {
        hls.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: _errors.ErrorDetails.MANIFEST_PARSING_ERROR, fatal: true, url: url, reason: 'no EXTM3U delimiter' });
      }
    }
  }, {
    key: 'loaderror',
    value: function loaderror(event) {
      var details, fatal;
      if (this.id === null) {
        details = _errors.ErrorDetails.MANIFEST_LOAD_ERROR;
        fatal = true;
      } else {
        details = _errors.ErrorDetails.LEVEL_LOAD_ERROR;
        fatal = false;
      }
      if (this.loader) {
        this.loader.abort();
      }
      this.loading = false;
      this.hls.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: details, fatal: fatal, url: this.url, loader: this.loader, response: event.currentTarget, level: this.id, id: this.id2 });
    }
  }, {
    key: 'loadtimeout',
    value: function loadtimeout() {
      var details, fatal;
      if (this.id === null) {
        details = _errors.ErrorDetails.MANIFEST_LOAD_TIMEOUT;
        fatal = true;
      } else {
        details = _errors.ErrorDetails.LEVEL_LOAD_TIMEOUT;
        fatal = false;
      }
      if (this.loader) {
        this.loader.abort();
      }
      this.loading = false;
      this.hls.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: details, fatal: fatal, url: this.url, loader: this.loader, level: this.id, id: this.id2 });
    }
  }]);

  return PlaylistLoader;
}(_eventHandler2.default);

exports.default = PlaylistLoader;