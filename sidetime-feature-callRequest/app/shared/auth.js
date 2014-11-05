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


