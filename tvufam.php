<!doctype html>

<link href='dist/dragula.css' rel='stylesheet' type='text/css' />
<link href='example/example.css' rel='stylesheet' type='text/css' />
<title>TVUFAM</title>
<div class='parent'>MONTE SUA PROGRAMAÇÃO</code>.</div>


<div class='parent'>Nota: Este é um protótipo de Construção da Grade de Programação TVUFAM</code>.</div>
<div class='examples' ng-app='angular-dragula-example'>
  <div class='parent'>
    <div class='wrapper'>
      <div class='container' dragula='"first-bag"'>
        <div>Vídeo 1 - Duração 45 min</div>
        <div>Vídeo 2 - Duração 30 min</div>
        <div>Vídeo 3 - Duração 1 h</div>
      </div>
      <div class='container' dragula='"first-bag"'>
		<?php 
		Include ("getID/getid3/getid3.php");
		
		
		$diretorio = "C:/wamp/www/angular-dragula-master"; 
		$ponteiro  = opendir($diretorio);
							
		//Verificar se existe o arquivo no diretório, controle.
		$controle = 1;
		
		//Obtendo o diretório.
		while ($nome_itens = readdir($ponteiro)):
			$itens[] = $nome_itens;
		endwhile;
		
		//Organizando em orderm alfabética.
		sort($itens);
		
		//Pesquisando o que é pasta e arquivo.
		foreach ($itens as $listar) :
		   if ($listar!="." && $listar!=".."): 
					if (is_dir($listar)):  
							$pastas[]=$listar; 
					else: 
							$arquivos[]=$listar;
					endif;
			endif;
		endforeach;
		
		/* Visualizar diretório.
		if ($pastas != "" ) { 
			foreach($pastas as $listar){
			   print "<img src='pasta.png'> <a href='$diretorio/$listar'>$listar</a><br>";}
		}*/
				
		if ($arquivos != ""):
			foreach($arquivos as $listar):
				 
				 $extensao = pathinfo($listar);
				 if(!empty($extensao['extension'])):
					$extensao =$extensao['extension']; //Procurar solução para o "ignorador de erros '@' "
				  endif;
				  
				if($extensao =='mp4' || $extensao == 'mkv'):
				    echo "<div>$listar</div>";
				endif;
				
			endforeach;
		endif;
		?>
		<!--
        <div>Vídeo 4 Duração 45 min</div>
        <div>Vídeoo 5 Duração 23 min</div>
        <div>Vídeo 6 Duração 44 min</a></div>
		-->
      </div>
    </div>
  </div>
  
  
</div>
<button type="button" class="btn btn-default navbar-btn">Exportar Grade!</button>

<!-- PLAYER DE VIDEO
<video id="info" controls>
  <source src="teste.mp4" type="video/mp4">
  Seu navegador não suporta o elemento <code>video</code>.
</video>
<video id="info" controls>
  <source src="teste2.mp4" type="video/mp4">
  Seu navegador não suporta o elemento <code>video</code>.
</video>-->



<script src='dist/angular.js'></script>
<script src='dist/angular-dragula.js'></script>
<script src='example/example.js'></script>

