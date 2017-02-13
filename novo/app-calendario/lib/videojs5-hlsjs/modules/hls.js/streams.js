var teststreams = [{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/xwr14q.m3u8',
  title: 'sublimevideo xwr14q'
},{
  file:'http://www.flashls.org/playlists/test_001/stream.m3u8',
  title: 'VOD (6 levels) - ffmpeg internal segmenter x264+aac'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/xwr14q.m3u8',
  title : 'DevinSupertramp 2014 1080p'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/x212fsj.m3u8',
  title : 'Tears of Steel 4k'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/xzp29g.m3u8',
  title:'Enders Game Trailer 1080p'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/x2hpg4o.m3u8',
  title:'Anime 720p'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/x2hz1aj.m3u8',
  title:'National Geographic Abu Dhabi 408p'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/x2hyzr0.m3u8',
  title:'Ouatch.tv AndroMag 720p'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/x2hw9xg.m3u8',
  title:'Anime 384p'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/x2hv5jb.m3u8',
  title:'JACKBOOTS ON WHITEHALL 1032p'
},{
  file:'http://www.adm.dailymotion.com/cdn/manifest/video/x1z8wi9.m3u8',
  title:'Timescapes 2880x1620'
}
];

createButton("Load Rand Pyke Video", loadRandomPykeVid);
createButton("Load Next Pyke Video", loadNextPykeVid);
createButton("Load Rand Live Video", loadRandomLiveVid);
createButton("Load Rand VoD Video", loadDMRandomVid);
listStreams("streamlist");
createSelector("streamSelect");


function listStreams( container) {
  var element = document.getElementById(container);
  if(element) {
    for(var i=0; i<teststreams.length; i++) { var entry = document.createElement("li");
      entry.innerHTML = "<a href='#' onclick='return loadStream(\""+teststreams[i].file+"\")'>"+teststreams[i].title+"</a>";
      element.appendChild(entry);
    }
  }
}

function createSelector(container) {
  var element = document.getElementById(container);
  if(element) {
    for(var i=0; i<teststreams.length; i++) {
      var option = document.createElement("option");
      option.value = teststreams[i].file;
      option.text = teststreams[i].title;
      element.appendChild(option);
    }
  }
}

var autoTestInterval;
var autoTestVideosOK=0;
function toggleAutoTest() {
  if(autoTestInterval) {
    window.clearInterval(autoTestInterval);
    autoTestInterval = null;
    document.getElementById("customText").innerHTML = null;
  } else {
   testRandomVideo();
   autoTestInterval = window.setInterval(testRandomVideo,8000);
  }
}

 function seekInMiddle() {
  if(!videoError) {
    video.currentTime=video.duration/2;
  }
 }


function testRandomVideo() {
  if(videoError) {
    if(autoTestInterval) {
      window.clearInterval(autoTestInterval);
    }
  } else {
    document.getElementById("customText").innerHTML= 'Auto Test Enabled,' + autoTestVideosOK + ' videos tested successfully';
    manifest = getDMURL(getDMRandom('https://api.dailymotion.com/videos?longer_than=20&flags=no_live,partner&limit=100'));
    //manifest = getDMURL("x2snudu");
    loadStream(manifest);
    window.setTimeout(seekInMiddle,4000);
    autoTestVideosOK++;
  }
}


function createButton(title,callback) {
    var button = document.createElement("input");
    button.type = "button";
    button.value = title;
    button.class = "btn btn-sm";
    button.onclick = callback;
    document.getElementById('customButtons').appendChild(button);
}

function getDMRandom(apiCall) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiCall , false);
    try {
      xhr.send(null);
    } catch(err) {
     return null;
    }

    if(xhr.status === 200) {
      var obj = JSON.parse(xhr.responseText);
      if(obj.list.length) {
        var idx = Math.floor(Math.random()*obj.list.length);
        return obj.list[idx].id;
      }
    }
    return null;
}

function getDMURL(url) {
  return 'http://www.adm.dailymotion.com/cdn/manifest/video/' + url + '.m3u8';
}

function loadTestVid() {
  var url = getRandomTestVid();
  if(url) {
    loadStream(url);
  } else {
    loadError();
  }
}

function getRandomTestVid() {
  var idx = Math.floor(Math.random()*teststreams.length);
  return teststreams[idx].file;
}

function loadDMRandomVid() {
    // // from march 2005 onwards
    // var startTime = new Date(2014,2).getTime();
    // var currentTime = new Date().getTime();
    // var randomStartTime = startTime+Math.floor(Math.random()*(currentTime-startTime));
    // // one month after
    // var randomEndTime = Math.min(randomStartTime + (1000*60*60*24*365/12));

    // console.log("start filter:" + new Date(randomStartTime).toUTCString());
    // console.log("end   filter:" + new Date(randomEndTime).toUTCString());

    // var filter = 'created_after=' + randomStartTime + '&created_before=' + randomEndTime;
    // var apiCall = 'https://api.dailymotion.com/videos?' + filter + '&flags=no_live&limit=50';
    // xhr.open('GET', apiCall , false);
  var url = getDMRandom('https://api.dailymotion.com/videos?limit=100');
  if(url) {
    loadStream(getDMURL(url));
  } else {
    loadError();
  }
}
function loadRandomPykeVid() {
  var url = getDMRandom('https://api.dailymotion.com/user/pyke369/videos&limit=100');
  if(url) {
    loadStream(getDMURL(url));
  } else {
    loadError();
  }
}

function loadRandomLiveVid() {
  var url = getDMRandom('https://api.dailymotion.com/videos?flags=live_onair&limit=100');
  if(url) {
    url = 'http://www.dailymotion.com/cdn/live/video/' + url + '?protocol=hls&redirect=0';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url , false);
    try {
      xhr.send(null);
    } catch(err) {
     return null;
    }

    if(xhr.status === 200) {
      url = xhr.responseText;
    }
    loadStream(url);
  } else {
    loadError();
  }
}

function loadNextPykeVid() {
  var url = getNextPykeVid();
  if(url) {
    loadStream(getDMURL(url));
  } else {
    loadError();
  }
}

var pykeVideoIdx = 0;

function getNextPykeVid() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.dailymotion.com/user/pyke369/videos&limit=100' , false);
    try {
      xhr.send(null);
    } catch(err) {
     return null;
    }

    if(xhr.status === 200) {
      var obj = JSON.parse(xhr.responseText);
      return obj.list[pykeVideoIdx++].id;
    } else {
      return null;
    }
}

function loadError() {
  document.getElementById("HlsStatus").innerHTML = "unable to load a random video, if you are not on DM domain, consider installing <a href=\"https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi\">Allow-Control-Allow-Origin Chrome Extension</a>";
}
