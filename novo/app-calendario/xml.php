<?php

$param = array("file:///home/duivilly/V%C3%ADdeos/VID-20170203-WA0001.mp4", "file:///home/duivilly/V%C3%ADdeos/VID-20170210-WA0000.mp4");

$xml= 
"<?xml version='1.0' encoding='UTF-8'?>
<playlist xmlns='http://xspf.org/ns/0/' xmlns:vlc='http://www.videolan.org/vlc/playlist/ns/0/' version='1'>
    <title>Lista de reprodução</title>
    <trackList>";

$track= "";
$cont= 0;
foreach($param as $key => $value){    
    $track.= 
    "
            <track>
                <location>".$value."</location>
                <duration>4666</duration>
                <extension application='http://www.videolan.org/vlc/playlist/0'>
                    <vlc:id>".$cont."</vlc:id>
                </extension>
            </track>
    ";
    $cont= $cont + 1;
}

$xml.= $track;

$xml.= 
"        
    </trackList>
    <extension application='http://www.videolan.org/vlc/playlist/0'>
";

$cont= 0;
$ord= "";
foreach($param as $key => $value){    
    $ord.= 
    "
            <vlc:item tid='".$cont."'/>
    ";
    $cont= $cont + 1;
}
$xml.= $ord.
"        
    </extension>
</playlist>";

$gravar= fopen("playlist.xspf", "w");
fwrite($gravar, $xml);
fclose($gravar);
?>