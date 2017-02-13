'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * XHR based logger
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */

var _logger = require('../utils/logger');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var XhrLoader = function () {
  function XhrLoader(config) {
    _classCallCheck(this, XhrLoader);

    if (config && config.xhrSetup) {
      this.xhrSetup = config.xhrSetup;
    }
  }

  _createClass(XhrLoader, [{
    key: 'destroy',
    value: function destroy() {
      this.abort();
      this.loader = null;
    }
  }, {
    key: 'abort',
    value: function abort() {
      var loader = this.loader,
          timeoutHandle = this.timeoutHandle;
      if (loader && loader.readyState !== 4) {
        this.stats.aborted = true;
        loader.abort();
      }
      if (timeoutHandle) {
        window.clearTimeout(timeoutHandle);
      }
    }
  }, {
    key: 'load',
    value: function load(url, responseType, onSuccess, onError, onTimeout, timeout, maxRetry, retryDelay) {
      var onProgress = arguments.length <= 8 || arguments[8] === undefined ? null : arguments[8];
      var frag = arguments.length <= 9 || arguments[9] === undefined ? null : arguments[9];

      this.url = url;
      if (frag && !isNaN(frag.byteRangeStartOffset) && !isNaN(frag.byteRangeEndOffset)) {
        this.byteRange = frag.byteRangeStartOffset + '-' + (frag.byteRangeEndOffset - 1);
      }
      this.responseType = responseType;
      this.onSuccess = onSuccess;
      this.onProgress = onProgress;
      this.onTimeout = onTimeout;
      this.onError = onError;
      this.stats = { trequest: performance.now(), retry: 0 };
      this.timeout = timeout;
      this.maxRetry = maxRetry;
      this.retryDelay = retryDelay;
      this.loadInternal();
    }
  }, {
    key: 'loadInternal',
    value: function loadInternal() {
      var xhr;

      if (typeof XDomainRequest !== 'undefined') {
        xhr = this.loader = new XDomainRequest();
      } else {
        xhr = this.loader = new XMLHttpRequest();
      }

      xhr.onreadystatechange = this.readystatechange.bind(this);
      xhr.onprogress = this.loadprogress.bind(this);

      xhr.open('GET', this.url, true);
      if (this.byteRange) {
        xhr.setRequestHeader('Range', 'bytes=' + this.byteRange);
      }
      xhr.responseType = this.responseType;
      var stats = this.stats;
      stats.tfirst = 0;
      stats.loaded = 0;
      if (this.xhrSetup) {
        this.xhrSetup(xhr, this.url);
      }
      // first timeout to track HEADERS_RECEIVED, set to half total timeout.
      this.timeoutHandle = window.setTimeout(this.loadtimeout.bind(this), this.timeout / 2);
      xhr.send();
    }
  }, {
    key: 'readystatechange',
    value: function readystatechange(event) {
      var xhr = event.currentTarget,
          readystate = xhr.readyState,
          stats = this.stats;
      // don't proceed if xhr has been aborted
      if (!stats.aborted) {
        // HEADERS_RECEIVED
        if (readystate >= 2) {
          if (stats.tfirst === 0) {
            stats.tfirst = Math.max(performance.now(), stats.trequest);
            // clear first timeout after headers have been received
            window.clearTimeout(this.timeoutHandle);
            // reset timeout to total timeout duration minus the time it took to receive headers
            this.timeoutHandle = window.setTimeout(this.loadtimeout.bind(this), this.timeout - (stats.tfirst - stats.trequest));
          }
          if (readystate === 4) {
            var status = xhr.status;
            // http status between 200 to 299 are all successful
            if (status >= 200 && status < 300) {
              window.clearTimeout(this.timeoutHandle);
              stats.tload = Math.max(stats.tfirst, performance.now());
              this.onSuccess(event, stats);
            } else {
              // if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error
              if (stats.retry >= this.maxRetry || status >= 400 && status < 499) {
                window.clearTimeout(this.timeoutHandle);
                _logger.logger.error(status + ' while loading ' + this.url);
                this.onError(event);
              } else {
                _logger.logger.warn(status + ' while loading ' + this.url + ', retrying in ' + this.retryDelay + '...');
                this.destroy();
                this.timeoutHandle = window.setTimeout(this.loadInternal.bind(this), this.retryDelay);
                // exponential backoff
                this.retryDelay = Math.min(2 * this.retryDelay, 64000);
                stats.retry++;
              }
            }
          }
        }
      }
    }
  }, {
    key: 'loadtimeout',
    value: function loadtimeout(event) {
      _logger.logger.warn('timeout while loading ' + this.url);
      this.onTimeout(event, this.stats);
    }
  }, {
    key: 'loadprogress',
    value: function loadprogress(event) {
      var stats = this.stats;
      stats.loaded = event.loaded;
      if (this.onProgress) {
        this.onProgress(event, stats);
      }
    }
  }]);

  return XhrLoader;
}();

exports.default = XhrLoader;