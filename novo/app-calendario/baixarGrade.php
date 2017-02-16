<?php
//o array com o conteudo da progracao, depois deve ser setado os dados correspondente em location, duration
$param = array("file:///home/duivilly/V%C3%ADdeos/VID-20170203-WA0001.mp4", "file:///home/duivilly/V%C3%ADdeos/VID-20170210-WA0000.mp4");
$xml= $_POST["location"];

$xml.= 
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

//$gravar= fopen("/playlist/playlist.xspf", "w");
//fwrite($gravar, $xml);
//fclose($gravar);

// Forces the browser to download
header ("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header ("Last-Modified: " . gmdate("D,d M YH:i:s") . " GMT");
header ("Cache-Control: no-cache, must-revalidate");
header ("Pragma: no-cache");
header ('Content-type: text/xml');
header ('Content-Disposition: attachment; filename="playlist.xspf"');
header ("Content-Description: Playlist" );

// Sends file content to browser
echo $xml;
exit();
?>
