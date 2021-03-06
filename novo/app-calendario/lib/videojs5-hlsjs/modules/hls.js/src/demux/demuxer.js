import Event from '../events';
import DemuxerInline from '../demux/demuxer-inline';
import DemuxerWorker from '../demux/demuxer-worker';
import {logger} from '../utils/logger';
import Decrypter from '../crypt/decrypter';
import {ErrorTypes, ErrorDetails} from '../errors';

class Demuxer {

  constructor(hls) {
    this.hls = hls;
    var typeSupported = {
      mp4 : MediaSource.isTypeSupported('video/mp4'),
      mp2t : hls.config.enableMP2TPassThrough && MediaSource.isTypeSupported('video/mp2t')
    };
    if (hls.config.enableWorker && (typeof(Worker) !== 'undefined')) {
        logger.log('demuxing in webworker');
        try {
          let work = require('webworkify');
          let w = this.w = work(DemuxerWorker);
          this.onwmsg = this.onWorkerMessage.bind(this);
          w.addEventListener('message', this.onwmsg);
          w.onerror = function(event) { hls.trigger(Event.ERROR, {type: ErrorTypes.OTHER_ERROR, details: ErrorDetails.INTERNAL_EXCEPTION, fatal: true, event : 'demuxerWorker', err : { message : event.message + ' (' + event.filename + ':' + event.lineno + ')' }});};
          w.postMessage({cmd: 'init', typeSupported : typeSupported});
        } catch(err) {
          logger.error('error while initializing DemuxerWorker, fallback on DemuxerInline');
          this.demuxer = new DemuxerInline(hls,typeSupported);
        }
      } else {
        this.demuxer = new DemuxerInline(hls,typeSupported);
      }
      this.demuxInitialized = true;
  }

  destroy() {
    let w = this.w;
    if (w) {
      w.removeEventListener('message', this.onwmsg);
      w.terminate();
      this.w = null;
    } else {
      let demuxer = this.demuxer;
      if (demuxer) {
        demuxer.destroy();
        this.demuxer = null;
      }
    }
    let decrypter = this.decrypter;
    if (decrypter) {
      decrypter.destroy();
      this.decrypter = null;
    }
  }

  pushDecrypted(data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration) {
    let w = this.w;
    if (w) {
      // post fragment payload as transferable objects (no copy)
      w.postMessage({cmd: 'demux', data: data, audioCodec: audioCodec, videoCodec: videoCodec, timeOffset: timeOffset, cc: cc, level: level, sn : sn, duration: duration}, [data]);
    } else {
      let demuxer = this.demuxer;
      if (demuxer) {
        demuxer.push(new Uint8Array(data), audioCodec, videoCodec, timeOffset, cc, level, sn, duration);
      }
    }
  }

  push(data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration, decryptdata) {
    if ((data.byteLength > 0) && (decryptdata != null) && (decryptdata.key != null) && (decryptdata.method === 'AES-128')) {
      if (this.decrypter == null) {
        this.decrypter = new Decrypter(this.hls);
      }

      var localthis = this;
      this.decrypter.decrypt(data, decryptdata.key, decryptdata.iv, function(decryptedData){
        localthis.pushDecrypted(decryptedData, audioCodec, videoCodec, timeOffset, cc, level, sn, duration);
      });
    } else {
      this.pushDecrypted(data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration);
    }
  }

  onWorkerMessage(ev) {
    var data = ev.data;
    //console.log('onWorkerMessage:' + data.event);
    switch(data.event) {
      case Event.FRAG_PARSING_INIT_SEGMENT:
        var obj = {};
        obj.tracks = data.tracks;
        obj.unique = data.unique;
        this.hls.trigger(Event.FRAG_PARSING_INIT_SEGMENT, obj);
        break;
      case Event.FRAG_PARSING_DATA:
        this.hls.trigger(Event.FRAG_PARSING_DATA,{
          data1: new Uint8Array(data.data1),
          data2: new Uint8Array(data.data2),
          startPTS: data.startPTS,
          endPTS: data.endPTS,
          startDTS: data.startDTS,
          endDTS: data.endDTS,
          type: data.type,
          nb: data.nb,
          dropped: data.dropped,
        });
        break;
        case Event.FRAG_PARSING_METADATA:
        this.hls.trigger(Event.FRAG_PARSING_METADATA, {
          samples: data.samples
        });
        break;
        case Event.FRAG_PARSING_USERDATA:
        this.hls.trigger(Event.FRAG_PARSING_USERDATA, {
          samples: data.samples
        });
        break;
      default:
        this.hls.trigger(data.event, data.data);
        break;
    }
  }
}

export default Demuxer;

