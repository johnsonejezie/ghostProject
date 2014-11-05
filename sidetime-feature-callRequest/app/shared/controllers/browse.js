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

