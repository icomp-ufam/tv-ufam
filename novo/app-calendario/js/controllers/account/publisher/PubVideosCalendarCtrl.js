angular.module("icomptvApp")
  .controller("PubVideosCalendarCtrl", function(
    $scope,
    $filter,
    $http,
    $location,
    AppLogSvc,
    ToastSvc,
    $window,
    $timeout
  ) {
    AppLogSvc.log("PubVideosCalendarCtrl iniciado.");

    now = new Date;
    dayName = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    monName = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    $scope.dataAtual = dayName[now.getDay()] + ", " + now.getDate() + " de " + monName[now.getMonth()] + " de " + now.getFullYear();
 
    $scope.diasSemana = dayName;

    $scope.horas = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "24:00"];

    $scope.horarios = [];

    for (i=0, len = $scope.horas.length; i<len; ++i) {
      $scope.horarios.push(
                                {
                                  horario: $scope.horas[i],
                                  diasSemana: [[], [], [], [], [], [], []]
                                }
                              );
    }

    $scope.adicionarPrograma = function ($diaSemana, $horaInicio, $minInicio, $horaTermino, $minTermino, $tituloPrograma) {
      if ($horaInicio < 10) {
        $horaInicioStr = "0" + $horaInicio + ":";
      }
      else {
        $horaInicioStr = $horaInicio + ":";
      }

      if ($minInicio < 10) {
        $horaInicioStr = $horaInicioStr + "0" + $minInicio;
      }
      else {
        $horaInicioStr = $horaInicioStr + $minInicio;
      }

      if ($horaTermino < 10) {
        $horaTerminoStr = "0" + $horaTermino + ":";
      }
      else {
        $horaTerminoStr = $horaTermino + ":";
      }

      if ($minTermino < 10) {
        $horaTerminoStr = $horaTerminoStr + "0" + $minTermino;
      }
      else {
        $horaTerminoStr = $horaTerminoStr + $minTermino;
      }

      $scope.horarios[$horaInicio].diasSemana[$diaSemana].push({inic: $horaInicioStr, term: $horaTerminoStr, tit: $tituloPrograma});
    }

    $scope.adicionarPrograma(1, 1, 0, 1, 30, "Teste");
    $scope.adicionarPrograma(1, 1, 30, 2, 0, "Teste Dois");
    $scope.adicionarPrograma(4, 2, 0, 3, 0, "Teste Tres");
    $scope.adicionarPrograma(4, 3, 0, 3, 45, "Teste Quatro");
  });