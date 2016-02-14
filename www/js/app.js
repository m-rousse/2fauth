// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('twofa', ['ionic', 'ngCordova', 'ionic.utils']);

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/')

  $stateProvider.state('home', {
    url: '/home',
    views: {
      home: {
        templateUrl: 'views/home.html'
      }
    }
  })

  $stateProvider.state('manage', {
    url: '/manage',
    views: {
      manage: {
        templateUrl: 'views/manage.html'
      }
    }
  })
});

app.run(function($ionicPlatform, $localstorage) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

app.controller('MainCtrl',function($scope, $cordovaBarcodeScanner, $ionicPopup, $localstorage){
  $scope.token = {
    name: "",
    otp : "",
    generator: null
  };
  getSecrets();
  console.log($scope.secretsDB);

  $scope.scanNewIdentity = function(){
    $cordovaBarcodeScanner.scan().then(
      function (result) {
        if(result.cancelled)
          return;
        var res = result.text;
        var re = /otpauth:\/\/([th]otp)\/(.*)\?(.*)/; 
        var m;
        var params;
        console.log("Début du parsing.");
        if ((m = re.exec(res)) !== null) {
          if (m.index === re.lastIndex) {
            re.lastIndex++;
          }
          type = m[1];
          name = m[2];
          params = m[3].split("&");
          secret = false;
          angular.forEach(params, function(v, k){
            var tmp = v.split("=");
            if(tmp[0] == "secret")
              secret = tmp[1];
          });
          if(!secret){
            alert("Error while retrieving secret.");
            return;
          }
          console.log("Parsing fini !",type,name,secret);
          addSecrets(type, name, secret);
          alert("Identity added !");
        }
      }, 
      function (error) {
        alert("QRCode inconsistent.");
      });
  };
  $scope.typeNewIdentity = function(){
    $scope.data = {};
    getSecrets();
    var popupSecret = $ionicPopup.show({
      template: 'Identity name : <input type="text" ng-model="data.name"></br>Secret : <input type="text" ng-model="data.secret">',
      title : 'Enter identity secret',
      scope: $scope,
      buttons : [
        {
          text: "Cancel"
        },
        {
          text: "<b>Add</b>",
          type: "button-positive",
          onTap: function(e){
            if(!$scope.data.secret || !$scope.data.name)
              e.preventDefault();
            else
              return $scope.data;
          }
        }
      ]
    });
    popupSecret.then(function(res){
      if(res){
        addSecrets("testType",res.name, res.secret);
        console.log($scope.secretsDB);
      }
    });
  };
  $scope.deleteIdentity = function(name){
    delSecret(name);
  };

  $scope.chooseToken = function(name){
    angular.forEach($scope.secretsDB.secrets, function(v, k){
      if(v.name == name){
        console.log("On y est presque !");
        var generator = new AeroGear.Totp(v.secret);
        generator.generateOTP(function(result) {
          $scope.token.otp = result;
        });
      }
    });
  };

  function addSecrets(type, name, secret){
    getSecrets();
    sDb = $scope.secretsDB;
    exists = false;
    angular.forEach($scope.secretsDB.secrets, function(v, k){
      if(v.name == name)
        exists = true;
    });
    if(exists){
      alert("This name is already used");
      return;
    }
    sDb.secrets.push({
      type : type,
      name : name,
      secret : secret
    });
    $localstorage.setObject("secretsDB",sDb);
    $scope.secretsDB = sDb;
  };

  function getSecrets(){
    $scope.secretsDB = $localstorage.getObject("secretsDB");
    if(typeof $scope.secretsDB.secrets == "undefined")
      $scope.secretsDB.secrets = [];
  };

  function delSecret(name){
    angular.forEach($scope.secretsDB.secrets, function(v, k){
      if(v.name == name)
        $scope.secretsDB.secrets.splice(k, 1);
    });
    $localstorage.setObject("secretsDB",$scope.secretsDB);
    getSecrets();
    console.log($scope.secretsDB);
  };
});


angular.module('ionic.utils', [])

.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}]);