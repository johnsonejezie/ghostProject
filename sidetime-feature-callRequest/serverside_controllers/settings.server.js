var Firebase = require('firebase'),
rootRef = new Firebase("https://filmmakersource.firebaseio.com/sidetime");

exports.isItUnique = function(req, res) {
  var usersRef = rootRef.child('users'); 
  usersRef.once('value', function(snap) {
    var userRef = usersRef.child(req.body.uid);
    userRef.on('value', function(shot) {
      var unique = true;
      if (typeof shot.val().username === 'undefined') { 
        snap.forEach(function(childSnap) {
          if (childSnap.val().username === req.body.username) {
            unique = false;
            return true;
          } 
        });
      } else {
        snap.forEach(function(childSnap) { 
          if (childSnap.val().username === req.body.username && childSnap.val().uid === req.body.uid) {
            unique = true;
            return true;
          } else if (childSnap.val().username === req.body.username && childSnap.val().uid !== req.body.uid) {
            unique = false;
            return true;
          } else {
            unique = true;
          }
        });
      }
      res.send({unique: unique});
    });
  });  
};