(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./app/application.js":[function(require,module,exports){
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

},{"../public/404.html":"/Users/shittu/Documents/sidetime/public/404.html","../public/base.html":"/Users/shittu/Documents/sidetime/public/base.html","../public/homepage.html":"/Users/shittu/Documents/sidetime/public/homepage.html","../public/pages/browse_experts.html":"/Users/shittu/Documents/sidetime/public/pages/browse_experts.html","../public/pages/calls_list.html":"/Users/shittu/Documents/sidetime/public/pages/calls_list.html","../public/pages/confirm_or_decline.html":"/Users/shittu/Documents/sidetime/public/pages/confirm_or_decline.html","../public/pages/expert_home.html":"/Users/shittu/Documents/sidetime/public/pages/expert_home.html","../public/pages/request_a_call.html":"/Users/shittu/Documents/sidetime/public/pages/request_a_call.html","../public/pages/view_expert_profile.html":"/Users/shittu/Documents/sidetime/public/pages/view_expert_profile.html","./shared/auth.js":"/Users/shittu/Documents/sidetime/app/shared/auth.js","./shared/controllers/browse.js":"/Users/shittu/Documents/sidetime/app/shared/controllers/browse.js","./shared/directives/directives.js":"/Users/shittu/Documents/sidetime/app/shared/directives/directives.js"}],"/Users/shittu/Documents/sidetime/app/shared/auth.js":[function(require,module,exports){
angular.module("Authentication", ['firebase','ngCookies'])
  .directive('header', function() {
    return {
      restrict: 'E',
      controller: ['$rootScope', '$http', '$timeout', '$scope', '$firebase', '$cookies', '$location',
       function($rootScope, $http, $timeout, $scope, $firebase, $cookies, $location) {
        var rootRef = new Firebase($cookies.rootRef);

        // the main collection of users
        var usersRef = rootRef.child('users');

        // welcome collection is used as a queue
        // worker process will listen for child_added event
        // and when it fires, we can do things like send a
        // welcome email or anything else that happens just once
        var welcomeRef = rootRef.child('welcome'),
        tagsRef = rootRef.child('categories'),
        userRef = null;

        // $scope.show toggles whether to show and hide the auto suggestion
        // $scope.expertiseAreas stores all the tags that are populated in the auto suggestion
        // $scope.expertTags stores all the tags the expert has chosen which is to be stored in database
        // $scope.categories stores all tags under their respective categories
        $scope.show = false; 
        $scope.expertiseAreas = [];
        $scope.expertTags = [];
        $scope.categories = [];

        // Start with no user logged in
        //$rootScope.currentUser = null;

        $scope.populateSuggestions = function() {  
          tagsRef.on('value', function(tagSnap) {
            tagSnap.forEach(function(childSnap) {
              var tags = [];
              console.log('childSnapname', childSnap.name());
              console.log('keyss',Object.keys(tagSnap.val()));
              //console.log({name: childSnap.Cc.path.u[2]});
              for (elem in childSnap.val().tags) {
                $scope.expertiseAreas.push(childSnap.val().tags[elem]);
                tags.push(childSnap.val().tags[elem]);
                //console.log('categories',categories);
              }
              $scope.categories.push({name: childSnap.name(), tags: tags});
            });
            console.log('tags',$scope.expertiseAreas); console.log('categories',$scope.categories);
          });
        };
        
        $scope.autoSuggest = function(expertise) { 
          if (!expertise) {
            $scope.toggle(false);
          } else {
            $scope.toggle(true);
          }
        };

        $scope.toggle = function(bool) {
          $scope.show = bool;
        };

        $scope.addTags = function(item) {
          if ($scope.expertTags.indexOf(item) !== -1) {
            $scope.tagError = true;
          } else {
            $scope.expertTags.push(item);
          }
          $scope.toggle(false);
        };

        $scope.deleteTag = function(index) {
          $scope.expertTags.splice(index, 1);
        };
        
        $scope.email_regexp = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/;

        var populateExpertTags = function() {
          if ($location.path() === '/settings') {  
            if (typeof $rootScope.currentUser.expert_profile !== 'undefined') {
              var popCategories = $rootScope.currentUser.expert_profile.categories;
              for (var i in popCategories) {
                for (var k in popCategories[i].tags) {
                  $scope.expertTags.push(popCategories[i].tags[k]);
                }
              } 
            }
          }
        };

        // Upon successful login, set the user object
        // happens automatically when rememberMe is enabled
        rootRef.onAuth(function(authData) {
          console.log('am here');
          // user authenticated successfully
          if(authData) {
            userRef = usersRef.child(authData.uid); console.log(authData);
            // lookup existing user data
            userRef.on('value', function(snap) {
              var user = snap.val();
              if(user) {
                // existing user
                $rootScope.currentUser = user;
                populateExpertTags();
              }
              else {
                analytics.track('Signup');

                // new user, create a user record on Firebase
                user = buildSidetimeUserObjectFromGoogle(authData);
                // useful to know the user's local timezone
                user.tz = moment().format("Z");
                // keep track of when this user was created
                user.created = Firebase.ServerValue.TIMESTAMP;

                userRef.set(user, function() {
                  welcomeRef.child(user.uid).set(user, function() {
                    // todo: this is a brute force redirect after login
                    // How can we do it within routing framework?
                    if(window.location.pathname === "/") {
                      window.location.pathname = "/settings";
                    }
                  });
                });
              }

              analytics.identify(user.uid, {
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
              });
            });   
          }
          else {
            // user is logged out
            console.log("auth: user is logged out");
            $rootScope.currentUser = null;
          }
        });

        $scope.login = function() {
          analytics.track('Login');
          options = { scope: "email" };
          
          rootRef.authWithOAuthRedirect("google", function(err, authData) {
            if(err) {
              console.log('error logging in', err);
            } else {
              console.log('login successful');
            }
          }, options);
        };

        $scope.logout = function() {
          rootRef.unauth();
          window.location.pathname = "/";
        };

        // set a timeout to remove error and success alert messages
        var actionTimeout = function(toggle) {
          $timeout(function() {
            if (toggle === 'error') {
              $scope.error = false;
            } else if (toggle === 'errorProfile' ) {
              $scope.errorProfile = false;
            } else if(toggle === 'success') {
              $scope.success = false;
            } else {
              $scope.successProfile = false;
            }
          }, 5000);
        };

        // save login details
        $scope.saveDetails = function() {
          var details = $rootScope.currentUser;

          userRef.update(details, function(err) {
            if (err) { 
              console.log(err);
              $scope.$apply(function() { 
                $scope.error = true; 
              });
              actionTimeout('error');
            } else {
                $scope.$apply(function() { 
                  $scope.success = true; 
                });
                
                // get freshly updated details from the database
                userRef.on('value', function(snap) {
                  $scope.expertTags = [];
                  $rootScope.currentUser = snap.val();
                  populateExpertTags();
                });
                console.log('success');
                actionTimeout('success');
            }
          });
        };

        // save expert profile details to the database
        $scope.saveProfile = function() {
          var profile = $rootScope.currentUser,
          categoriesArr = [];
        
          // for loop for iterating through categories array that was
          // created when page was initialized        
          for (var i in $scope.categories) {

            // initialize arrays to store tags and categories respectively
            // which would be stored in the database
            var tagArr = [], 
            gotFound = 0;

            // loop through all the tags user has added
            for (var k in $scope.expertTags) {
              // validate which tag belongs to a particular category
              if ($scope.categories[i].tags.indexOf($scope.expertTags[k]) !== -1) {
                tagArr.push($scope.expertTags[k]);
                gotFound += 1;
              }
            }

            // if a tag was found
            if (gotFound !== 0 ) {
              categoriesArr.push({name: $scope.categories[i].name, tags: tagArr});
            }
            console.log(categoriesArr);
          }

          profile.expert_profile.categories = categoriesArr;
          if(!$rootScope.currentUser.expert_profile) {
            profile.expert_profile.created = Firebase.ServerValue.TIMESTAMP;
          }

          userRef.update(profile, function(err, data) {
            if (err) { 
              $scope.$apply(function() { 
                $scope.errorProfile = true; 
              });
              actionTimeout('errorProfile', $scope.errorProfile);
            } else {
              $scope.$apply(function() { 
                $scope.successProfile = true; 
              });

              userRef.on('value', function(snap) {
                $rootScope.currentUser = snap.val();
                $scope.expertTags = [];
                populateExpertTags();
              });
              
              console.log('success');
              actionTimeout('successProfile');
            }
          });
        };
      }]
    }
  });

function buildSidetimeUserObjectFromGoogle(authData) {
  return {
    uid: authData.uid,
    name: authData.google.displayName,
    email: authData.google.email,
    accessToken: authData.google.accessToken,
    picture: authData.google.cachedUserProfile.picture
  }
}



},{}],"/Users/shittu/Documents/sidetime/app/shared/controllers/browse.js":[function(require,module,exports){
angular.module('Browse',['firebase','ngCookies', 'Mac'])
  .controller('BrowseExperts', ['$scope', '$http', '$routeParams', '$rootScope', '$firebase', '$cookies', '$location', 
    function($scope, $http, $routeParams, $rootScope, $firebase, $cookies, $location) {
      var mainRef = new Firebase($cookies.rootRef),
      usersRef = mainRef.child('users'),
      categoryRef = mainRef.child('categories');
      $scope.browseCategories = [];
      $scope.reverse = null;
      $scope.time = ['01:00 hrs', '01:30 hrs', '02:00 hrs', '02:30 hrs', '03:00 hrs', '03:30 hrs',
                     '04:00 hrs', '04:30 hrs', '05:00 hrs', '05:30 hrs', '06:00 hrs', '07:30 hrs',
                     '08:00 hrs', '08:30 hrs', '09:00 hrs', '09:30 hrs', '10:00 hrs', '10:30 hrs',
                     '11:00 hrs', '11:30 hrs', '12:00 hrs', '12:30 hrs', '13:00 hrs', '13:30 hrs',
                     '14:00 hrs', '14:30 hrs', '15:00 hrs', '15:30 hrs', '16:00 hrs', '16:30 hrs',
                     '17:00 hrs', '17:30 hrs', '18:00 hrs', '18:30 hrs', '19:00 hrs', '19:30 hrs',
                     '20:00 hrs', '20:30 hrs', '21:00 hrs', '21:30 hrs', '22:00 hrs', '22:30 hrs',
                     '23:00 hrs', '23:30 hrs', '00:00 hrs'
      ];
      $scope.months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
      $scope.years = [2014, 2015 , 2016 , 2017 , 2018 , 2019 , 2020 , 2021 , 2022 ];
      $scope.expiryMonth = '01';
      $scope.expiryYear = 2014;
      $scope.declineReason = 'I\'m busy';

      // changes filter values depending on what user wants to sort by
      $scope.changeValue = function(filterby, value, reverse) {
        $scope.filterVal = {filterby: filterby, value: value};
        $scope.reverse = reverse;
        console.log($scope.filterVal);
      };

      // carries out filtering if done via a bookmarked URL
      if($routeParams.catName) {
        $scope.changeValue('category', $routeParams.catName);
      }

      if($routeParams.tagName) {
        $scope.changeValue('tags', $routeParams.tagName);
      }
      
      // get all the categories that would be populated on the browser
      $scope.getCategories = function() {
        categoryRef.on('value', function(catSnap) { 
          var tagArr = [];
          catSnap.forEach(function(childSnap) {
            console.log('name',childSnap.name());
              var tagArr = [];
              for (elem in childSnap.val().tags) {
                tagArr.push(childSnap.val().tags[elem]);
              }
              $scope.browseCategories.push({name: childSnap.name(), tags: tagArr});
          });
          console.log($scope.browseCategories);
        });

        // get all the experts that are going to be filtered later on
        usersRef.on('value', function(snapShot) {
            $scope.users = [];

            // iterate through all the experts and created a new object that stores
            // the number of calls they have
            snapShot.forEach(function(snap) {
              var callRef = mainRef.child('calls').child(snap.val().uid).child('calls');

              callRef.on('value', function(callSnap) {
                var user = snap.val();
                if(callSnap.val()) {
                  console.log(Object.keys(callSnap.val()).length);  
                  user.noOfCalls = Object.keys(callSnap.val()).length; 
                } else {
                  user.noOfCalls  = 0;
                }
                $scope.$apply(function() {
                  $scope.users.push(user)
                });
                console.log($scope.users);
              });
            });
        });
      }; 

      // get a particular expert
      $scope.getExpert = function() {
        var user = usersRef.child($routeParams.uid);
        user.on('value', function(userSnap) {
          $scope.expert = userSnap.val();
        });
      }; 

      $scope.requestCall = function() {
        $scope.badRequest = $scope.error = $scope.success = null;

        // if the current user is requesting a call from himself
        if ($rootScope.currentUser.uid === $scope.expert.uid) {
          $scope.badRequest = true;
        } else {
          var call_request = {
              fromId: $rootScope.currentUser.uid,
              toId: $scope.expert.uid,
              requesterName: $rootScope.currentUser.name,
              expertName: $scope.expert.name,
              username: $scope.expert.username,
              message: $scope.request.message,
              estimateLength: $scope.request.estimateLength,
              suggested_time: $scope.request.suggested_time,
              suggested_date: $scope.request.suggested_date,
              payment_details: {
                card_number: $scope.cardNumber,
                expiry_date: $scope.expiryMonth + '/' + $scope.expiryYear
              },
              status: 'pending',
              email: $rootScope.currentUser.email,
              sendto: $scope.expert.email
          };
          
          $http.post('/call_request', call_request).success(function(data) {
           $scope.success = true; 
          }).error(function(error) { 
            $scope.error = error;       
          });
        }
      };

      // get currentUser details from local storage in the case of google OAuth
      // asynchronous call not completed yet
      var localStorage = function() {
        var objString = window.localStorage.getItem('firebase:session::filmmakersource');
        if(objString) {
          $rootScope.currentUser = JSON.parse(objString);
        }
      };

      // get call request
      $scope.getCallRequest = function() {
        var requestRef = mainRef.child('call_requests').child($routeParams.requestId);
        if(!$rootScope.currentUser) {
          localStorage();
        }
        console.log($rootScope.currentUser);
        requestRef.on('value', function(snap) { console.log($rootScope.currentUser.uid);
          // if (snap.val().toId !== $rootScope.currentUser.uid) {
          //   $scope.unauthorized = 'You are not authorized to access this page';
          // } else if(snap.val().status === 'declined' || snap.val().status === 'accepted') {
          //   $scope.unauthorized = 'This call request has already been ' + snap.val().status;
          // //} else {
            $scope.callRequest = snap.val();
          //}
        });
      };

      $scope.showSelect = $scope.showInput = false;
      $scope.toggleReason =  function(which) {
        if (which === 'showSelect') { console.log(which); 
          $scope.showInput = false;
          $scope.showSelect = true;
          console.log('selec',$scope.showSelect, 'input', $scope.showInput); 
        } else {
          $scope.showSelect = false;
          $scope.showInput = true;
        }
      };

      $scope.acceptOrDecline = function(which) {
        $scope.error = null;
        var user = usersRef.child($scope.callRequest.fromId),
        details = {};

        user.on('value', function(snap) { 
          details = {
            status: which,
            receiverEmail: snap.val().email,
            callRequestId: $routeParams.requestId,
            expertName: $rootScope.currentUser.name
          };
        }); console.log(details);

        if(which === 'accepted') {
          details.expertEmail = $rootScope.currentUser.email;
          details.message = $scope.callRequest.message;
          details.requesterName = $scope.callRequest.requesterName;
          details.estimateLength = $scope.callRequest.estimateLength;
          details.suggested_time = $scope.callRequest.suggested_time;
          details.suggested_date = $scope.callRequest.suggested_date;
          details.expertId = $scope.callRequest.toId;
          details.requesterId = $scope.callRequest.fromId;
        } else {
          details.decline_reason = $scope.declineReason;
          if($scope.showInput) {
            details.decline_reason = $scope.ownReason;
          } 
        }

        $http.post('/call_request/accept_or_decline', details).success(function(data) {
          if (data === 'accepted') {
            //$scope.success = 'You have successfully agreed to the call request';
            $location.path('/calls-list');
          } else {
            $scope.success = 'You have successfully declined the call request';
          }
          console.log(data);
        }).error(function(error) { 
          $scope.error = error;       
        });
      };

      $scope.listCalls = function() {
        $scope.callsArr = [];
        if(!$rootScope.currentUser) {
          localStorage();
        }

        var callsRef = mainRef.child('calls').child($rootScope.currentUser.uid).child('calls');
        callsRef.on('value', function(callSnap) { 
          callSnap.forEach(function(childSnap) {
            callDetails = new Firebase(childSnap.val());

            callDetails.on('value', function(detailSnap) {
              $scope.$apply(function(){
                $scope.callsArr.push(detailSnap.val()) 
              });
            });
          });
        });
      };
}])
.filter('property', property);

function property() {
        
  return function(users, filterVal, reverse) {
    Array.prototype.objIndexOf = function arrayObjectIndexOf(property, value) {
      for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) {
          return i;
        }
      }
      return -1;
    };

    var result = {},
    filtered = [];
    angular.forEach(users, function(user, key) {
      if (typeof filterVal === 'undefined') {
        result[key] = user;
      } else if (filterVal.filterby === 'category') {

          if(user.expert_profile && user.expert_profile.categories.objIndexOf('name', filterVal.value) !== -1) {
            result[key] = user;
          }
      } else if(user.expert_profile && filterVal.filterby === 'tags') {

          angular.forEach(user.expert_profile.categories, function(cat, catkey) {
            if (cat.tags.indexOf(filterVal.value) !== -1) {
              result[key] = user;
            }
          });
      } else if(user.expert_profile && filterVal.filterby === 'new') {
          var becameExpert = moment(user.expert_profile.created),
          now = moment();

          if (now.diff(becameExpert, 'days') <= 7) {
            result[key] = user;
          }
        } else {
            if (user.expert_profile) {
              // var rootRef = new Firebase("https://filmmakersource.firebaseio.com/sidetime"),
              // callRef = rootRef.child('calls').child(user.uid).child('calls');
              // callRef.on('value', function(snap) {
              //   if(snap.val()) {
              //     //noOfCalls.push(snap.val().length); 
              //     console.log(Object.keys(snap.val()).length);
              //     user.noOfCalls = Object.keys(snap.val()).length; 
              //   } else {
              //     user.noOfCalls  = 0;
              //   }
                filtered.push(user);
              //});
            }
        }
    });
    if (filterVal && filterVal.filterby === 'popular') {
      filtered.sort(function (a, b) {
        if(a.noOfCalls > b.noOfCalls || a.noOfCalls < b.noOfCalls) {
          return (a.noOfCalls - b.noOfCalls);
        } else {
          return (a.expert_profile.rating - b.expert_profile.rating);
        }
      }); console.log(filtered);

      if(reverse) {
        filtered.reverse();
      }

      return filtered;
    } else {
       return result;
    }
  };
};


},{}],"/Users/shittu/Documents/sidetime/app/shared/directives/directives.js":[function(require,module,exports){
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


},{}],"/Users/shittu/Documents/sidetime/public/404.html":[function(require,module,exports){
module.exports = "<h1 class=\"h1\">Not Found</h1><p class=\"subtext\">Not sure why</p>";

},{}],"/Users/shittu/Documents/sidetime/public/base.html":[function(require,module,exports){
module.exports = "<div class=\"container\"><header class=\"userProfile\"><div role=\"navigation\" class=\"navbar navbar-default\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\"navbar-collapse\" class=\"navbar-toggle collapsed\"><span class=\"sr-only\">Toggle navigation</span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a href=\"/\" class=\"navbar-brand\">Sidetime </a></div><div class=\"navbar-collapse collapse\"><ul class=\"nav navbar-nav\"><li ng-show=\"currentUser\" class=\"dropdown\"><a href=\"#\" class=\"dropdown-toggle\"><img ng-src=\"{{currentUser.picture}}\" class=\"google_avatar\"/></a><ul role=\"menu\" class=\"dropdown-menu\"><li role=\"presentation\" class=\"dropdown-header\">Signed in as {{ currentUser.email }}</li><li><a ng-click=\"logout()\">logout</a></li></ul></li></ul><ul class=\"nav navbar-nav navbar-right\"><li class=\"active\"><a href=\"/home\">Home</a></li><li><a href=\"/settings\">Settings</a></li><li><a href=\"/browse_experts\">Browse</a></li></ul></div></div></div></header><ng-include src=\"&quot;pages/settings.html&quot;\"></ng-include><material-content class=\"footer\"><footer><p><strong>Sidetime\nRead our&nbsp;<a href=\"/privacy\" target=\"_self\">Privacy Policy</a></strong></p><p class=\"smallprint\">Some smallprint here</p><p class=\"smallprint\">Want to talk to us?\nSome contact info here</p></footer></material-content></div>";

},{}],"/Users/shittu/Documents/sidetime/public/homepage.html":[function(require,module,exports){
module.exports = "<div class=\"container\"><header><h1><a href=\"/\" target=\"_self\">Sidetime</a></h1><nav class=\"padded\"></nav><auth class=\"padded\"><div ng-hide=\"currentUser\" class=\"sign-in\"><material-button ng-click=\"login('google')\" class=\"material-theme-green\"><span>login</span></material-button></div><div ng-show=\"currentUser\" ng-cloak=\"ng-cloak\" class=\"dropdown\"><a href=\"#\" class=\"dropdown-toggle\"><img ng-src=\"{{currentUser.picture}}\" class=\"avatar\"/></a><ul role=\"menu\" class=\"dropdown-menu dropdown-menu-right\"><li role=\"presentation\" class=\"dropdown-header\">Signed in as {{ currentUser.email }}</li><li><a href=\"/settings\">Account Settings</a></li><li><a ng-click=\"logout()\">Sign out</a></li></ul></div></auth></header><div class=\"jumbotron\"><h1 class=\"h1\">Sidetime</h1><p class=\"subtext\">Connect with expert filmmakers</p><div class=\"row\"><div class=\"col-md-6\"><h2>lorem ipsum</h2><material-button ng-click=\"login('google')\" class=\"material-theme-green signup\">Create Your Account</material-button></div><div class=\"col-md-6\"><h2>something else</h2></div></div></div></div><footer><p><strong>Sidetime\nRead our&nbsp;<a href=\"/privacy\" target=\"_self\">Privacy Policy</a></strong></p><p class=\"smallprint\">Some smallprint here</p><p class=\"smallprint\">Want to talk to us?\nSome contact info here</p></footer>";

},{}],"/Users/shittu/Documents/sidetime/public/pages/browse_experts.html":[function(require,module,exports){
module.exports = "<div data-ng-controller=\"BrowseExperts\" data-ng-init=\"getCategories()\" class=\"container\"><header class=\"userProfile\"><div role=\"navigation\" class=\"navbar navbar-default\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\"navbar-collapse\" class=\"navbar-toggle collapsed\"><span class=\"sr-only\">Toggle navigation</span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a href=\"/\" class=\"navbar-brand\">Sidetime </a></div><div class=\"navbar-collapse collapse\"><ul class=\"nav navbar-nav\"><li ng-show=\"currentUser\" class=\"dropdown\"><a href=\"#\" class=\"dropdown-toggle\"><img ng-src=\"{{currentUser.picture}}\" class=\"google_avatar\"/></a><ul role=\"menu\" class=\"dropdown-menu\"><li role=\"presentation\" class=\"dropdown-header\">Signed in as {{ currentUser.email }}</li><li><a ng-click=\"logout()\">logout</a></li></ul></li></ul><ul class=\"nav navbar-nav navbar-right\"><li class=\"active\"><a href=\"/home\">Home</a></li><li><a href=\"/settings\">Settings</a></li><li><a href=\"/browse_experts\">Browse</a></li></ul></div></div></div></header><div class=\"jumbotron\"><div><ul><li data-ng-repeat=\"category in browseCategories\"> <a href=\"#\" data-ng-click=\"changeValue('category', category.name)\">{{category.name}}</a><ul><li data-ng-repeat=\"(key, value) in category.tags\"> <a href=\"#\" data-ng-click=\"changeValue('tags', value)\">{{value}}</a></li></ul></li></ul></div></div><div class=\"row\"><div class=\"col-md-6\"><h2>Showing: {{filterVal.value || 'All'}}</h2><a href=\"#\" data-ng-click=\"changeValue('popular', 'popular', true)\">Popular</a><a href=\"#\" data-ng-click=\"changeValue('new', 'new experts')\">New Experts</a></div></div><div data-ng-repeat=\"(key, value) in users | property: filterVal: reverse\" data-ng-if=\"value.expert_profile\" class=\"row\"><div class=\"span4 well\"><div class=\"row\"><div style=\"width: 20%; float: left; margin-right: 5%;\" class=\"span1\"><a href=\"/{{value.username}}/{{value.uid}}\" class=\"thumbnail\"><img data-ng-src=\"{{value.picture}}\" style=\"width:150px;\" class=\"img-circle\"/></a></div><div style=\"width: 40%; float: left; margin-left: 9%;\" class=\"span3\"><p><strong style=\"text-transform: uppercase;\">{{value.expert_profile.headline}} </strong></p><h5><strong style=\"text-transform: capitalize; color: #9c9c9c\">{{value.name}}</strong></h5><p>{{value.expert_profile.brief_bio}}</p></div><div style=\"width: 20%; float: left;\" class=\"span3\"><p style=\"text-align: center; font-size: 16px;\"><strong style=\"text-transform: uppercase;\">${{value.expert_profile.rate}}</strong></p><span style=\"text-align: center; display: block;\">per minute</span><a href=\"/{{value.username}}/{{value.uid}}/precall\" class=\"center-block btn btn-success btn-lg\">Request a Call</a><p style=\"text-align: center;\"><strong>Rating: {{value.expert_profile.rating}}</strong></p></div></div></div></div><material-content class=\"footer\"><footer><p><strong>Sidetime\nRead our&nbsp;<a href=\"/privacy\" target=\"_self\">Privacy Policy</a></strong></p><p class=\"smallprint\">Some smallprint here</p><p class=\"smallprint\">Want to talk to us?\nSome contact info here</p></footer></material-content></div>";

},{}],"/Users/shittu/Documents/sidetime/public/pages/calls_list.html":[function(require,module,exports){
module.exports = "<div data-ng-controller=\"BrowseExperts\" class=\"container\"><header class=\"userProfile\"><div role=\"navigation\" class=\"navbar navbar-default\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\"navbar-collapse\" class=\"navbar-toggle collapsed\"><span class=\"sr-only\">Toggle navigation</span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a href=\"/\" class=\"navbar-brand\">Sidetime </a></div><div class=\"navbar-collapse collapse\"><ul class=\"nav navbar-nav\"><li ng-show=\"currentUser\" class=\"dropdown\"><a href=\"#\" class=\"dropdown-toggle\"><img ng-src=\"{{currentUser.picture}}\" class=\"google_avatar\"/></a><ul role=\"menu\" class=\"dropdown-menu\"><li role=\"presentation\" class=\"dropdown-header\">Signed in as {{ currentUser.email }}</li><li><a ng-click=\"logout()\">logout</a></li></ul></li></ul><ul class=\"nav navbar-nav navbar-right\"><li class=\"active\"><a href=\"/home\">Home</a></li><li><a href=\"/settings\">Settings</a></li><li><a href=\"/browse_experts\">Browse</a></li></ul></div></div></div><table data-ng-init=\"listCalls()\" class=\"list list-link\"><thead><tr><th>Requester's Name</th><th>Estimate Length</th><th>Time of Call</th><th>Date of Call</th></tr></thead><tbody><tr data-ng-repeat=\"call in callsArr\"><td>{{call.requesterName}}</td><td>{{call.estimateLength}}</td><td>{{call.suggested_time}}</td><td>{{call.suggested_date}}</td></tr></tbody></table></header><material-content class=\"footer\"><footer><p><strong>Sidetime\nRead our&nbsp;<a href=\"/privacy\" target=\"_self\">Privacy Policy</a></strong></p><p class=\"smallprint\">Some smallprint here</p><p class=\"smallprint\">Want to talk to us?\nSome contact info here</p></footer></material-content></div>";

},{}],"/Users/shittu/Documents/sidetime/public/pages/confirm_or_decline.html":[function(require,module,exports){
module.exports = "<div data-ng-controller=\"BrowseExperts\" class=\"container\"><header class=\"userProfile\">   <div role=\"navigation\" class=\"navbar navbar-default\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\"navbar-collapse\" class=\"navbar-toggle collapsed\"><span class=\"sr-only\">Toggle navigation</span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a href=\"/\" class=\"navbar-brand\">Sidetime </a></div><div class=\"navbar-collapse collapse\"><ul class=\"nav navbar-nav\"><li ng-show=\"currentUser\" class=\"dropdown\"><a href=\"#\" class=\"dropdown-toggle\"><img ng-src=\"{{currentUser.picture}}\" class=\"google_avatar\"/></a><ul role=\"menu\" class=\"dropdown-menu\"><li role=\"presentation\" class=\"dropdown-header\">Signed in as {{ currentUser.email }}</li><li><a ng-click=\"logout()\">logout</a></li></ul></li></ul><ul class=\"nav navbar-nav navbar-right\"><li class=\"active\"><a href=\"/home\">Home</a></li><li><a href=\"/settings\">Settings</a></li><li><a href=\"/browse_experts\">Browse</a></li></ul></div></div></div><div role=\"alert\" data-ng-if=\"success\" class=\"alert alert-success\"><strong>{{success}}</strong></div><div role=\"alert\" data-ng-show=\"error\" class=\"alert alert-danger\"><strong>{{error}}</strong></div><div role=\"alert\" data-ng-show=\"unauthorized\" class=\"alert alert-danger\"><strong>{{unauthorized}}</strong></div></header><div data-ng-init=\"getCallRequest()\" class=\"div\"><div data-ng-hide=\"unauthorized\" class=\"row\"><div class=\"col-md-6\"><div class=\"panel panel-primary\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Confirm or Decline</h3></div><table id=\"dev-table\" class=\"table table-hover\"><tr><td>Name of Requester</td><td>{{callRequest.requesterName}}</td></tr><tr><td>Message</td><td>{{callRequest.message}}</td></tr><tr><td>Estimate Length of Call</td><td>{{callRequest.estimateLength}}</td></tr><tr><td>Sugested time and date</td><td>{{callRequest.suggested_time}} on {{callRequest.suggested_date}}</td></tr></table></div></div></div><fieldset data-ng-hide=\"success\"><legend>Choose a reason from the dropdown or enter your own reason if you want to decline call request</legend><div class=\"col-md-6 form-group\"><button type=\"button\" data-ng-click=\"toggleReason('showSelect')\" class=\"btn btn-large btn-primary\">Select from a list of reasons</button></div><div class=\"col-md-6 form-group\"><button type=\"button\" data-ng-click=\"toggleReason('showInput')\" class=\"btn btn-large btn-primary\">Add your own reason</button></div><select id=\"decline\" name=\"decline\" data-ng-show=\"showSelect\" data-ng-model=\"declineReason\" class=\"form-control\"><option value=\"I'm busy\">I'm busy</option><option value=\"Not interested\">Not interested</option></select><input type=\"text\" id=\"declineInput\" name=\"declineInput\" data-ng-show=\"showInput\" data-ng-model=\"ownReason\" placeholder=\"enter your reason for declining\" required=\"required\" class=\"input-profile form-control\"/><p data-ng-show=\"!ownReason &amp;&amp; showInput\" class=\"text-danger\">Enter a reason</p><div class=\"col-md-6\"><button type=\"button\" data-ng-click=\"acceptOrDecline('accepted')\" class=\"btn btn-large btn-success\">Accept</button><button type=\"button\" data-ng-click=\"acceptOrDecline('declined')\" data-ng-show=\"showInput || showSelect\" data-ng-disabled=\"!ownReason &amp;&amp; showInput\" class=\"btn btn-large btn-danger\">Decline</button></div></fieldset></div><material-content class=\"footer\"><footer><p><strong>Sidetime\nRead our&nbsp;<a href=\"/privacy\" target=\"_self\">Privacy Policy</a></strong></p><p class=\"smallprint\">Some smallprint here</p><p class=\"smallprint\">Want to talk to us?\nSome contact info here</p></footer></material-content></div>";

},{}],"/Users/shittu/Documents/sidetime/public/pages/expert_home.html":[function(require,module,exports){
module.exports = "<div class=\"container\"><header class=\"userProfile\">   <div role=\"navigation\" class=\"navbar navbar-default\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\"navbar-collapse\" class=\"navbar-toggle collapsed\"><span class=\"sr-only\">Toggle navigation</span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a href=\"/\" class=\"navbar-brand\">Sidetime </a></div><div class=\"navbar-collapse collapse\"><ul class=\"nav navbar-nav\"><li ng-show=\"currentUser\" class=\"dropdown\"><a href=\"#\" class=\"dropdown-toggle\"><img ng-src=\"{{currentUser.picture}}\" class=\"google_avatar\"/></a><ul role=\"menu\" class=\"dropdown-menu\"><li role=\"presentation\" class=\"dropdown-header\">Signed in as {{ currentUser.email }}</li><li><a ng-click=\"logout()\">logout</a></li></ul></li></ul><ul class=\"nav navbar-nav navbar-right\"><li class=\"active\"><a href=\"/home\">Home</a></li><li><a href=\"/settings\">Settings</a></li><li><a href=\"/browse_experts\">Browse</a></li></ul></div></div></div></header><div class=\"container\"><div class=\"row\"><div class=\"col-md-offset-2 col-md-8 col-lg-offset-3 col-lg-6\"><div class=\"well profile\"><div class=\"col-sm-12\"><div class=\"col-xs-12 col-sm-8\"><h2 style=\"text-transform: capitalize;\">{{currentUser.name}} </h2><p> <strong>Email:</strong><span class=\"subtext\"> {{currentUser.email}}</span></p><p> <strong>Headline: </strong><span class=\"subtext\">{{currentUser.expert_profile.headline}} </span></p><p> <strong>Rate: </strong><span class=\"subtext\">${{currentUser.expert_profile.rate}} per minute</span></p><p class=\"text-left\"><strong>Bio: </strong><br/><span>{{currentUser.expert_profile.brief_bio}} </span></p><p> <strong>Skills: </strong><span class=\"tags\">html5</span><span class=\"tags\">css3</span><span class=\"tags\">jquery</span><span class=\"tags\">bootstrap3         </span></p></div><div class=\"col-xs-12 col-sm-4 text-center\"><figure><img ng-src=\"{{currentUser.picture}}\" class=\"img-circle img-responsive\"/></figure></div></div><div class=\"col-xs-12 divider text-center\"><div class=\"col-xs-12 col-sm-4 emphasis\"><h2> <strong>20,7K                    </strong></h2><p> <small>Followers</small></p><button class=\"btn btn-success btn-block\"><span class=\"fa fa-plus-circle\">Follow </span></button></div><div class=\"col-xs-12 col-sm-4 emphasis\"><h2> <strong>245                   </strong></h2><p> <small>Following </small></p><button class=\"btn btn-info btn-block\"><span class=\"fa fa-user\"> View Profile</span></button></div><div class=\"col-xs-12 col-sm-4 emphasis\"><h2> <strong>43                   </strong></h2><p> <small>Snippets </small></p><div class=\"btn-group dropup btn-block\"><button type=\"button\" class=\"btn btn-primary\"><span class=\"fa fa-gear\">Options </span></button><button type=\"button\" data-toggle=\"dropdown\" class=\"btn btn-primary dropdown-toggle\"><span class=\"caret\"></span><span class=\"sr-only\">Toggle Dropdown</span></button><ul role=\"menu\" class=\"dropdown-menu text-left\"><li><a href=\"#\"> <span class=\"fa fa-envelope pull-right\"> </span><Send>an email</Send></a></li><li><a href=\"#\"><span class=\"fa fa-list pull-right\"></span><Add>or remove from a list  </Add></a></li><li class=\"divider\"></li><li><a href=\"#\"><span class=\"fa fa-warning pull-right\">Report this user for spam</span></a></li><li class=\"divider\"></li><li><a href=\"#\" role=\"button\" class=\"btn disabled\">Unfollow </a></li></ul></div></div></div><div class=\"modal-header\"><div style=\"text-align:center;\" class=\"modal-body\"></div><div class=\"row-fluid\"><div class=\"span10 offset1\"><div id=\"modalTab\"><div class=\"tab-content\"><div id=\"about\" class=\"tab-pane active\"><img src=\"https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRbezqZpEuwGSvitKy3wrwnth5kysKdRqBW54cAszm_wiutku3R\" name=\"aboutme\" width=\"140\" height=\"140\" border=\"0\" class=\"img-central img-circle\"/><h3 id=\"profile-name\" class=\"media-heading\">{{currentUser.name}} <small>email: {{currentUser.email}} </small></h3><span> <strong>Skills: </strong></span><span class=\"label label-warning\">HTML5/CSS</span><span class=\"label label-info\">Adobe CS 5.5</span><span class=\"label label-info\">Microsoft Office</span><span class=\"label label-success\">Windows XP, Vista, 7</span><hr/><center><p class=\"text-left\"><strong>Headline: </strong><br/><span>{{currentUser.expert_profile.headline}}</span></p><p class=\"text-left\"><strong>Bio: </strong><br/><span>{{currentUser.expert_profile.brief_bio}} </span></p></center></div></div></div></div></div></div></div></div></div></div></div>";

},{}],"/Users/shittu/Documents/sidetime/public/pages/request_a_call.html":[function(require,module,exports){
module.exports = "<div data-ng-controller=\"BrowseExperts\" class=\"container\"><header class=\"userProfile\"><div role=\"navigation\" class=\"navbar navbar-default\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\"navbar-collapse\" class=\"navbar-toggle collapsed\"><span class=\"sr-only\">Toggle navigation</span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a href=\"/\" class=\"navbar-brand\">Sidetime </a></div><div class=\"navbar-collapse collapse\"><ul class=\"nav navbar-nav\"><li ng-show=\"currentUser\" class=\"dropdown\"><a href=\"#\" class=\"dropdown-toggle\"><img ng-src=\"{{currentUser.picture}}\" class=\"google_avatar\"/></a><ul role=\"menu\" class=\"dropdown-menu\"><li role=\"presentation\" class=\"dropdown-header\">Signed in as {{ currentUser.email }}</li><li><a ng-click=\"logout()\">logout</a></li></ul></li></ul><ul class=\"nav navbar-nav navbar-right\"><li class=\"active\"><a href=\"/home\">Home</a></li><li><a href=\"/settings\">Settings</a></li><li><a href=\"/browse_experts\">Browse</a></li></ul></div></div></div></header><div data-ng-init=\"getExpert()\" class=\"row col-md-6\"><form name=\"callForm\" data-ng-submit=\"requestCall()\" autocomplete=\"off\"><div role=\"alert\" data-ng-show=\"success\" class=\"alert alert-success\"><strong>You have successfully made a call request</strong></div><div role=\"alert\" data-ng-show=\"error\" class=\"alert alert-danger\"><strong>{{error}}</strong></div><div role=\"alert\" data-ng-show=\"badRequest\" class=\"alert alert-danger\"><strong>You cannot make a call request to your own self</strong></div><fieldset><legend>Provide Call Information</legend><div data-ng-class=\"{'has-error': callForm.message.$invalid &amp;&amp; !callForm.message.$pristine }\" class=\"form-group\"><label for=\"message\" class=\"label-profile\">Message to {{expert.name}}</label><textarea id=\"message\" name=\"message\" data-ng-model=\"request.message\" cols=\"30\" rows=\"10\" placeholder=\"Enter your message\" required=\"required\" class=\"input-profile form-control\"></textarea><p data-ng-show=\"callForm.message.$error.required &amp;&amp; !callForm.message.$pristine\" class=\"help-block\">Enter your message</p></div><div data-ng-class=\"{'has-error': callForm.estimateLength.$invalid &amp;&amp; !callForm.estimateLength.$pristine }\" class=\"form-group\"><label for=\"estimateLength\" class=\"label-profile\">Estimated Length</label><select id=\"estimateLength\" name=\"estimateLength\" data-ng-model=\"request.estimateLength\" class=\"form-control\">{{request.estimateLength}}<option value=\"{{expert.expert_profile.minutes + 'minutes~$' + expert.expert_profile.rate}}\">{{expert.expert_profile.minutes}}minutes~(${{expert.expert_profile.rate}})</option><option value=\"{{expert.expert_profile.minutes*2 + 'minutes~$' + expert.expert_profile.rate * 2}}\">{{expert.expert_profile.minutes * 2}}minutes~(${{expert.expert_profile.rate * 2}})</option><option value=\"{{expert.expert_profile.minutes*4 + 'minutes~$' + expert.expert_profile.rate * 4}}\">{{expert.expert_profile.minutes * 4}}minutes~(${{expert.expert_profile.rate * 4}})</option></select></div><div data-ng-class=\"{'has-error': callForm.email.$invalid &amp;&amp; !callForm.email.$pristine }\" class=\"form-group\"><label for=\"email\" class=\"label-profile\">Email</label><input type=\"email\" id=\"email\" name=\"email\" data-ng-pattern=\"email_regexp\" data-ng-model=\"currentUser.email\" placeholder=\"Email\" required=\"required\" class=\"input-profile form-control\"/><p data-ng-show=\"callForm.email.$invalid &amp;&amp; !callForm.email.$pristine\" class=\"help-block\">Enter a valid email</p></div></fieldset><fieldset><legend>Suggest a time that you are free to talk </legend><div class=\"row\"><div data-ng-class=\"{'has-error': callForm.time.$invalid &amp;&amp; !callForm.time.$pristine }\" class=\"col-md-6 form-group\"><label for=\"time\" class=\"label-profile\">Time</label><select id=\"time\" name=\"time\" data-ng-options=\"t as t for t in time\" data-ng-model=\"request.suggested_time\" class=\"form-control\"><option value=\"t\">{{t}}</option></select></div><div data-ng-class=\"{'has-error': callForm.date.$invalid &amp;&amp; !callForm.date.$pristine }\" class=\"col-md-6 form-group\"><label for=\"date\" class=\"label-profile\">Date </label><mac-datepicker id=\"date\" type=\"text\" name=\"date\" data-ng-model=\"request.suggested_date\" placeholder=\"Enter date you would like to talk\" class=\"input-profile form-control\"></mac-datepicker></div></div></fieldset><fieldset><legend>Payment Details </legend><div data-ng-class=\"{'has-error': callForm.cardNum.$invalid &amp;&amp; !callForm.cardNum.$pristine }\" class=\"form-group\"><label for=\"cardNum\" class=\"label-profile\">Credit Card Number</label><input id=\"cardNum\" type=\"number\" name=\"cardNum\" data-ng-model=\"cardNumber\" placeholder=\"Credit Card number\" required=\"required\" class=\"input-profile form-control\"/><p data-ng-show=\"callForm.cardNum.$error.minlength &amp;&amp; !callForm.cardNum.$pristine\" class=\"help-block\">Card should have at least 16 numbers</p><p data-ng-show=\"callForm.cardNum.$error.required &amp;&amp; !callForm.cardNum.$pristine\" class=\"help-block\">Card details are required</p></div><div class=\"row\"> <div data-ng-class=\"{'has-error': callForm.expireMonth.$invalid &amp;&amp; !callForm.expireMonth.$pristine }\" class=\"col-md-4 form-group\"><label for=\"expireMonth\" class=\"label-profile\">Expiration Month</label><select id=\"expireMonth\" data-ng-options=\"month as month for month in months\" name=\"expireMonth\" data-ng-model=\"expiryMonth\" required=\"required\" class=\"form-control\"><option value=\"month\">{{month}}</option></select></div><div data-ng-class=\"{'has-error': callForm.expireYear.$invalid &amp;&amp; !callForm.expireYear.$pristine }\" class=\"col-md-4 form-group\"><label for=\"expireYear\" class=\"label-profile\">Year</label><select id=\"expireYear\" data-ng-options=\"year as year for year in years\" name=\"expireYear\" data-ng-model=\"expiryYear\" required=\"required\" class=\"form-control\"><option value=\"year\">{{year}}</option></select><p data-ng-show=\"callForm.expireYear.$invalid &amp;&amp; !callForm.expireYear.$pristine\" class=\"help-block\">Enter your message</p></div></div></fieldset><button type=\"submit\" data-ng-disabled=\"callForm.$invalid\" class=\"btn btn-large btn-primary center-block\">Book Now</button></form></div></div><material-content class=\"footer\"><footer><p><strong>Sidetime\nRead our&nbsp;<a href=\"/privacy\" target=\"_self\">Privacy Policy</a></strong></p><p class=\"smallprint\">Some smallprint here</p><p class=\"smallprint\">Want to talk to us?\nSome contact info here</p></footer></material-content>";

},{}],"/Users/shittu/Documents/sidetime/public/pages/view_expert_profile.html":[function(require,module,exports){
module.exports = "<div class=\"container\"><header class=\"userProfile\">   <div role=\"navigation\" class=\"navbar navbar-default\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\"navbar-collapse\" class=\"navbar-toggle collapsed\"><span class=\"sr-only\">Toggle navigation</span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a href=\"/\" class=\"navbar-brand\">Sidetime </a></div><div class=\"navbar-collapse collapse\"><ul class=\"nav navbar-nav\"><li ng-show=\"currentUser\" class=\"dropdown\"><a href=\"#\" class=\"dropdown-toggle\"><img ng-src=\"{{currentUser.picture}}\" class=\"google_avatar\"/></a><ul role=\"menu\" class=\"dropdown-menu\"><li role=\"presentation\" class=\"dropdown-header\">Signed in as {{ currentUser.email }}</li><li><a ng-click=\"logout()\">logout</a></li></ul></li></ul><ul class=\"nav navbar-nav navbar-right\"><li class=\"active\"><a href=\"/home\">Home</a></li><li><a href=\"/settings\">Settings</a></li><li><a href=\"/browse_experts\">Browse</a></li></ul></div></div></div></header><div data-ng-controller=\"BrowseExperts\" data-ng-init=\"getExpert()\" class=\"container\"><div class=\"row\"><div class=\"col-md-offset-2 col-md-8 col-lg-offset-3 col-lg-6\"><div class=\"well profile\"><div class=\"col-sm-12\"><div class=\"col-xs-12 col-sm-8\"><h2 style=\"text-transform: capitalize;\">{{expert.name}} </h2><p style=\"text-transform: uppercase;\"><strong>{{expert.expert_profile.headline}}</strong></p><p class=\"text-left\"> <span>{{expert.expert_profile.brief_bio}} </span></p><p> <strong>Expertise: </strong><div data-ng-repeat=\"category in expert.expert_profile.categories\"> <span data-ng-repeat=\"tag in category.tags\" class=\"tags\">{{tag}}     </span></div></p></div><div class=\"col-xs-12 col-sm-4 text-center\"><figure><img ng-src=\"{{expert.picture}}\" class=\"img-circle img-responsive\"/></figure></div></div><div class=\"col-xs-12 divider text-center\"><div class=\"col-xs-12 center-block\"><h2> <strong>${{expert.expert_profile.rate}}                    </strong></h2><p> <small>per minute</small></p><button class=\"btn btn-success btn-block\"><span class=\"fa fa-plus-circle\">Request a call</span></button><p><strong>Rating: {{expert.expert_profile.rating}}</strong></p></div></div></div></div></div></div><material-content class=\"footer\"><footer><p><strong>Sidetime\nRead our&nbsp;<a href=\"/privacy\" target=\"_self\">Privacy Policy</a></strong></p><p class=\"smallprint\">Some smallprint here</p><p class=\"smallprint\">Want to talk to us?\nSome contact info here</p></footer></material-content></div>";

},{}]},{},["./app/application.js"]);
