/**
 * Playlist Loader
*/

import Event from '../events';
import EventHandler from '../event-handler';
import {ErrorTypes, ErrorDetails} from '../errors';
import URLHelper from '../utils/url';
import AttrList from '../utils/attr-list';
import {logger} from '../utils/logger';

class PlaylistLoader extends EventHandler {

  constructor(hls) {
    super(hls,
      Event.MANIFEST_LOADING,
      Event.LEVEL_LOADING);
  }

  destroy() {
    if (this.loader) {
      this.loader.destroy();
      this.loader = null;
    }
    this.url = this.id = null;
    EventHandler.prototype.destroy.call(this);
  }

  onManifestLoading(data) {
    this.load(data.url, null);
  }

  onLevelLoading(data) {
    this.load(data.url, data.level, data.id);
  }

  load(url, id1, id2) {
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
    if(this.id === null) {
      retry = config.manifestLoadingMaxRetry;
      timeout = config.manifestLoadingTimeOut;
      retryDelay = config.manifestLoadingRetryDelay;
    } else {
      retry = config.levelLoadingMaxRetry;
      timeout = config.levelLoadingTimeOut;
      retryDelay = config.levelLoadingRetryDelay;
    }
    this.loader = typeof(config.pLoader) !== 'undefined' ? new config.pLoader(config) : new config.loader(config);
    this.loading = true;
    this.loader.load(url, '', this.loadsuccess.bind(this), this.loaderror.bind(this), this.loadtimeout.bind(this), timeout, retry, retryDelay);
  }

  resolve(url, baseUrl) {
    return URLHelper.buildAbsoluteURL(baseUrl, url);
  }

  parseMasterPlaylist(string, baseurl) {
    let levels = [], result;

    // https://regex101.com is your friend
    const re = /#EXT-X-STREAM-INF:([^\n\r]*)[\r\n]+([^\r\n]+)/g;
    while ((result = re.exec(string)) != null){
      const level = {};

      var attrs = level.attrs = new AttrList(result[1]);
      level.url = this.resolve(result[2], baseurl);

      var resolution = attrs.decimalResolution('RESOLUTION');
      if(resolution) {
        level.width = resolution.width;
        level.height = resolution.height;
      }
      level.bitrate = attrs.decimalInteger('AVERAGE-BANDWIDTH') || attrs.decimalInteger('BANDWIDTH');
      level.name = attrs.NAME;

      var codecs = attrs.CODECS;
      if(codecs) {
        codecs = codecs.split(',');
        for (let i = 0; i < codecs.length; i++) {
          const codec = codecs[i];
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
  createInitializationVector (segmentNumber) {
    var uint8View = new Uint8Array(16);

    for (var i = 12; i < 16; i++) {
      uint8View[i] = (segmentNumber >> 8 * (15 - i)) & 0xff;
    }

    return uint8View;
  }

  /**
   * Utility method for parseLevelPlaylist to get a fragment's decryption data from the currently parsed encryption key data
   * @param levelkey - a playlist's encryption info
   * @param segmentNumber - the fragment's segment number
   * @returns {*} - an object to be applied as a fragment's decryptdata
   */
  fragmentDecryptdataFromLevelkey (levelkey, segmentNumber) {
    var decryptdata = levelkey;

    if (levelkey && levelkey.method && levelkey.uri && !levelkey.iv) {
      decryptdata = this.cloneObj(levelkey);
      decryptdata.iv = this.createInitializationVector(segmentNumber);
    }

    return decryptdata;
  }

  avc1toavcoti(codec) {
    var result, avcdata = codec.split('.');
    if (avcdata.length > 2) {
      result = avcdata.shift() + '.';
      result += parseInt(avcdata.shift()).toString(16);
      result += ('000' + parseInt(avcdata.shift()).toString(16)).substr(-4);
    } else {
      result = codec;
    }
    return result;
  }

  cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  parseLevelPlaylist(string, baseurl, id) {
    var currentSN = 0,
        fragdecryptdata,
        totalduration = 0,
        level = {version: null, type: null, url: baseurl, fragments: [], live: true, startSN: 0},
        levelkey = {method : null, key : null, iv : null, uri : null},
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
      result = result.filter(function(n) { return (n !== undefined); });
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
        case '': // url
          if (!isNaN(duration)) {
            var sn = currentSN++;
            fragdecryptdata = this.fragmentDecryptdataFromLevelkey(levelkey, sn);
            var url = result[1] ? this.resolve(result[1], baseurl) : null;
            frag = {url: url,
                    duration: duration,
                    title: title,
                    start: totalduration,
                    sn: sn,
                    level: id,
                    cc: cc,
                    decryptdata : fragdecryptdata,
                    programDateTime: programDateTime};
            // only include byte range options if used/needed
            if(byteRangeStartOffset !== null) {
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
          var keyAttrs = new AttrList(decryptparams);
          var decryptmethod = keyAttrs.enumeratedString('METHOD'),
              decrypturi = keyAttrs.URI,
              decryptiv = keyAttrs.hexadecimalInteger('IV');
          if (decryptmethod) {
            levelkey = { method: null, key: null, iv: null, uri: null };
            if ((decrypturi) && (decryptmethod === 'AES-128')) {
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
          let startParams = result[1];
          let startAttrs = new AttrList(startParams);
          let startTimeOffset = startAttrs.decimalFloatingPoint('TIME-OFFSET');
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
          logger.warn(`line parsed but not handled: ${result}`);
          break;
      }
    }
    //logger.log('found ' + level.fragments.length + ' fragments');
    if(frag && !frag.url) {
      level.fragments.pop();
      totalduration-=frag.duration;
    }
    level.totalduration = totalduration;
    level.endSN = currentSN - 1;
    return level;
  }

  loadsuccess(event, stats) {
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
        let levelDetails = this.parseLevelPlaylist(string, url, id || 0);
        levelDetails.tload = stats.tload;
        if (id === null) {
        // first request, stream manifest (no master playlist), fire manifest loaded event with level details
          hls.trigger(Event.MANIFEST_LOADED, {levels: [{url: url, details : levelDetails}], url: url, stats: stats});
        }
        stats.tparsed = performance.now();
        hls.trigger(Event.LEVEL_LOADED, {details: levelDetails, level: id || 0, id: id2, stats: stats});
      } else {
        levels = this.parseMasterPlaylist(string, url);
        // multi level playlist, parse level info
        if (levels.length) {
          hls.trigger(Event.MANIFEST_LOADED, {levels: levels, url: url, stats: stats});
        } else {
          hls.trigger(Event.ERROR, {type: ErrorTypes.NETWORK_ERROR, details: ErrorDetails.MANIFEST_PARSING_ERROR, fatal: true, url: url, reason: 'no level found in manifest'});
        }
      }
    } else {
      hls.trigger(Event.ERROR, {type: ErrorTypes.NETWORK_ERROR, details: ErrorDetails.MANIFEST_PARSING_ERROR, fatal: true, url: url, reason: 'no EXTM3U delimiter'});
    }
  }

  loaderror(event) {
    var details, fatal;
    if (this.id === null) {
      details = ErrorDetails.MANIFEST_LOAD_ERROR;
      fatal = true;
    } else {
      details = ErrorDetails.LEVEL_LOAD_ERROR;
      fatal = false;
    }
    if (this.loader) {
      this.loader.abort();
    }
    this.loading = false;
    this.hls.trigger(Event.ERROR, {type: ErrorTypes.NETWORK_ERROR, details: details, fatal: fatal, url: this.url, loader: this.loader, response: event.currentTarget, level: this.id, id: this.id2});
  }

  loadtimeout() {
    var details, fatal;
    if (this.id === null) {
      details = ErrorDetails.MANIFEST_LOAD_TIMEOUT;
      fatal = true;
    } else {
      details = ErrorDetails.LEVEL_LOAD_TIMEOUT;
      fatal = false;
    }
    if (this.loader) {
      this.loader.abort();
    }
    this.loading = false;
    this.hls.trigger(Event.ERROR, {type: ErrorTypes.NETWORK_ERROR, details: details, fatal: fatal, url: this.url, loader: this.loader, level: this.id, id: this.id2});
  }
}

export default PlaylistLoader;