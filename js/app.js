
angular.module('healthy', ['ionic','healthy.services','healthy.controllers','firebase','angular-web-notification','ui.select','chart.js','ngImgCrop'])

.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
})
.directive('fileChanged', function () {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, element, attrs, ngModel) {
            if (!ngModel) {
                return;
            }

            ngModel.$render = angular.noop;

            element.bind('change', function (event) {
                ngModel.$setViewValue(event.target.files[0]);
                $scope.$apply();
            });
        }
    };
})

 .factory('FileReader', function ($q, $window) {

    if (!$window.FileReader) {
        throw new Error('Browser does not support FileReader');
    }

    function readAsDataUrl(file) {
        var deferred = $q.defer(),
            reader = new $window.FileReader();

        reader.onload = function () {
            var infosize = Math.round(file.size/1024);
            if(infosize <= 2000){
              deferred.resolve(reader.result);
            }else{
              deferred.resolve(null);
            }
        };

        reader.onerror = function () {
            deferred.reject(reader.error);
        };

        reader.readAsDataURL(file);

        return deferred.promise;
    }

    return {
        readAsDataUrl: readAsDataUrl
    };
}).
directive('filePreview', function (FileReader) {
    return {
        restrict: 'A',
        require: '?ngModel',
        scope: {
            filePreview: '='
        },
        link: function (scope, element, attrs,ngModel) {
            if(!ngModel){
              return;
            }
            ngModel.$render = angular.noop;
            scope.$watch('filePreview', function (filePreview) {
                if (filePreview && filePreview.name) {
                    FileReader.readAsDataUrl(filePreview).then(function (result) {
                       if(!result){
                          alert('Gambar terlalu besar,ukuran maksimal adalah 2MB.');
                        }else{
                          element.attr('src', result);
                          ngModel.$setViewValue(result);
                        }
                    });
                }
            });
        }
    };
})



.run(function(Auth,$state,$rootScope,LoginSer) {
    var mdlUpgradeDom = false;
    setInterval(function() {
      if (mdlUpgradeDom) {
        componentHandler.upgradeDom();
        mdlUpgradeDom = false;
      }
    }, 0);

    var observer = new MutationObserver(function () {
      mdlUpgradeDom = true;
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

      var result = LoginSer.cekAuth();
      result.then(function(bisa){
        if(bisa){
          $state.go('dash.periksa');
        }else{
          $state.go('login');
        }
      });

      $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
        if (error === "AUTH_REQUIRED") {
            $state.go('login');
        }
    });


})

.config(function($stateProvider, $urlRouterProvider,ChartJsProvider) {
  
  ChartJsProvider.setOptions({ colors : [ '#f1c40f', '#419fdd', '#f39c12', '#1abc9c', '#34495e', '#2ecc71', '#8e44ad'] });
  $stateProvider

    
    .state('login', {
    url: '/login',
    templateUrl: 'templates/login/login.html',
    controller :'loginCtrl' ,
    resolve: {
           
            "currentAuth": ["Auth",
                function (Auth) {
                  
                    return Auth.$waitForAuth();
        }]
        }
  })

    .state('dash', {
    url: '/dash',
    templateUrl: 'templates/dash.html',
    abstract :true,
    controller: 'AplCtrl' ,
     resolve: {
            "currentAuth": ["Auth",
                function (Auth) {
            
                    return Auth.$requireAuth();
      }]
        }
    
  })



  .state('dash.periksa',{
    url: '/periksa',
    views : {
      'tab-dash':{
        templateUrl: 'templates/periksa/periksa.html',
        controller: 'PeriksaCtrl'
      }
    }
  })

    .state('dash.home',{
    url: '/home',
    views : {
      'tab-dash':{
        templateUrl: 'templates/home/home.html',
        controller: 'HomeCtrl'
      }
    }
  })


 .state('dash.profile',{
  url: '/profile',
  views : {
    'tab-dash':{
      templateUrl: 'templates/profile/pegawai_profile.html'
    }
  }
 })


;

 //$urlRouterProvider.otherwise('/dash/home');

});

