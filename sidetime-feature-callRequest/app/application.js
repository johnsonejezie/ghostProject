require('./shared/auth.js');
require('./shared/directives/directives.js');
require('./shared/controllers/browse.js');

window.Sidetime = angular.module("Sidetime",
  ['Authentication',
   'Browse',
   'angularMoment',
   'ngAnimate',
   'ngMaterial',
   'ngRoute',
   'btford.markdown',
   'ui.bootstrap']);

Sidetime.run(['$rootScope', function($rootScope) {
  // set globals we want available in ng expressions
  $rootScope._ = window._;
  $rootScope.moment = window.moment;
}]);

Sidetime.config(['$locationProvider', '$routeProvider',
  function($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
      .when('/', {
        template: require('../public/homepage.html')
      })
      .when('/home', {
        template: require('../public/pages/expert_home.html')
      })
      .when('/browse_experts', {
        template: require('../public/pages/browse_experts.html')
      })
      .when('/browse_experts/category/:catName', {
        template: require('../public/pages/browse_experts.html')
      })
      .when('/browse_experts/tags/:tagName', {
        template: require('../public/pages/browse_experts.html')
      })
      .when('/:username/:uid/precall', {
        template: require('../public/pages/request_a_call.html')
      })
      .when('/:username/:uid', {
        template: require('../public/pages/view_expert_profile.html')
      })
      .when('/:username/call_request/:requestId', {
        template: require('../public/pages/confirm_or_decline.html')
      })
      .when('/calls-list', {
        template: require('../public/pages/calls_list.html')
      })
      .when('/settings', {
        template: require('../public/base.html')
      })
      .otherwise({
        template: require('../public/404.html')
      });
  }
]);

Sidetime.directive('Sidetime', function() {
  return {
    restrict: 'A',
    controller : ['$scope','$location','$materialSidenav','$materialToast','JournalService',
     function($scope, $location, $materialSidenav, $materialToast, JournalService) {
       $scope.openLeftMenu = function() {
         $materialSidenav('left').toggle();
       };
     }
    ]
  };
});

window.escapeEmailAddress = function(email) {
  if (!email) {
    return false;
  }

  // Replace '.' (not allowed in a Firebase key) with ',' (not allowed in an email address)
  email = email.toLowerCase();
  email = email.replace(/\./g, ',');
  return email;
};
