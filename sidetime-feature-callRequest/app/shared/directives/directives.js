// directive for validating the rate call charge amount
angular.module('Authentication').directive('validateRate', function() {
  return {
    require: 'ngModel',
    link: function(rootScope, ele, attrs, c, ngModel) {
      attrs.$observe('ngModel', function(value) {
          rootScope.$watch(value, function(newValue) {
              if (newValue >= 25) { 
                if (newValue % 5 === 0) { 
                  c.$setValidity('valid', true);
                } else {
                  c.$setValidity('valid', false);
                }
              } else {
                c.$setValidity('valid', false);
              }
          });
      });
    }
  }
});

// directive for validating the minimum amount of call minutes
angular.module('Authentication').directive('validateMinutes', function() {
  return {
    require: 'ngModel',
    link: function(rootScope, ele, attrs, c, ngModel) {
      attrs.$observe('ngModel', function(value) {
          rootScope.$watch(value, function(newValue) {;
            if (newValue < 15) { 
              c.$setValidity('valid', false);
            } else {
              c.$setValidity('valid', true);
            }
          });
      });
    }
  }
});

angular.module('Authentication').directive('ensureUnique', ['$http', function($http) {
  return {
    require: 'ngModel',
    link: function(rootScope, ele, attrs, c, ngModel) {
      attrs.$observe('ngModel', function(value) {
        rootScope.$watch(value, function(newValue) { 
          if (typeof newValue === 'undefined') {
            c.$setValidity('unique', true);
          } else {
            $http.post('/user/username', {'username': newValue, 'uid': rootScope.currentUser.uid})
            .success(function(data) { 
              if (data.unique) {
                c.$setValidity('unique', true);
              } else {
                c.$setValidity('unique', false);
              }
            }).error(function(error) { 
              c.$setValidity('unique', true);
            });
          }
        });
      });
    }
  }
}]);

