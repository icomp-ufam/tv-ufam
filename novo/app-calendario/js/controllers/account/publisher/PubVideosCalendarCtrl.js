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

    $scope.programacoes = [];

    for (i=0, len = $scope.horas.length; i<len; ++i) {
      $scope.programacoes.push(
                                {
                                  hora: $scope.horas[i],
                                  programas: ['', '', '', '', '', '', '']
                                }
                              );
    }

    $scope.adicionarPrograma = function ($diaSemana, $hora, $programa) {
      $scope.programacoes[$hora].programas[$diaSemana] = $programa;
    }

    $scope.adicionarPrograma(1, 1, "Teste");
    $scope.adicionarPrograma(4, 2, "Teste Dois");
  });