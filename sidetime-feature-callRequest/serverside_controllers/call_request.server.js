var Firebase = require('firebase'),
rootRef = new Firebase("https://filmmakersource.firebaseio.com/sidetime"),
requestsRef = rootRef.child('call_requests'),
callsRef = rootRef.child('calls');

var MG_API_KEY = 'key-0039538c57a3d4991b1ea8b4946087c2',
    MG_DOMAIN = 'sandboxfd572477ab074a2181edc6ada4e4cba3.mailgun.org';

var mailgun = require('mailgun-js')({apiKey: MG_API_KEY, domain: MG_DOMAIN});
var errMessage = null,
success = null,
ical = require('ics'),
fs = require('fs');

var sendEmail = function(data, errMessage, success, res) { 
  console.log('send email');
  mailgun.messages().send(data, function (error, body) { console.log(body);
    if (error) { 
      res.status(500).send(errMessage);
    } else {
      res.send(success);
    }
  });
};

// function for cloning an object in order to prevent deep copy
var cloneObject = function (source) {
  if (Object.prototype.toString.call(source) === '[object Array]') {
    var clone = [];
    for (var i=0; i<source.length; i++) {
      clone[i] = cloneObject(source[i]);
    }
    return clone;
  } else if (typeof(source)=="object") {
    var clone = {};
    for (var prop in source) {
      if (source.hasOwnProperty(prop)) {
        clone[prop] = cloneObject(source[prop]);
      }
    }
    return clone;
  } else {
    return source;
  }
};

exports.makeCallRequest = function(req, res) {
  
  var incomingRef = rootRef.child('users').child(req.body.toId).child('incoming_call_requests'),
  outgoingRef = rootRef.child('users').child(req.body.fromId).child('outgoing_call_requests'),
  fromEmail = req.body.email,
  toEmail = req.body.sendto;

  delete req.body.email;
  delete req.body.sendto;

  var pushReq = requestsRef.push(req.body);
  var call_request_path = pushReq.toString(); 

  requestsRef.on('value', function(snap) { 
    incomingRef.push({requester: req.body.fromId, requestId: pushReq.name()});
    outgoingRef.push({requestTo: req.body.toId, requestId: pushReq.name()});
  });

  incomingRef.once('value', function(snap) {
    console.log('incoming ref');
    var data = {
      from: fromEmail,
      to: 'omeyinmi.sanni@andela.co',
      subject: 'Call Request'
    };

    data.body = '\n Accept or decline this call request by following this link ';
    data.body += '<a href="/call_request/' + pushReq.name() + '">Accept or Decline</a>';
    data.html = '<p> Accept or decline this call request by following this link ';
    data.html += '<a href="http://localhost:5555/'+ req.body.username + '/call_request/'+ pushReq.name() + '">Accept or Decline</a>';

    errMessage = 'Booked on the system but there was failure in mail delivery to the expert';
    success = 'request sent';
    sendEmail(data, errMessage, success, res);
  });
};

exports.acceptOrDecline = function(req, res) {
  var details = cloneObject(req.body),
  request = requestsRef.child(req.body.callRequestId);
  console.log(details);

  delete req.body.receiverEmail;
  delete req.body.callRequestId;
  delete req.body.expertName; 

  if (req.body.expertEmail) {

    delete req.body.expertEmail;
    delete req.body.message;
    delete req.body.requesterName;
    delete req.body.estimateLength;
    delete req.body.suggested_time;
    delete req.body.suggested_date;
    delete req.body.expertId;
    delete req.body.requesterId; 
  }

  // update status of call request 
  request.update(req.body, function(err) {
    if (err) { 
      res.status(500).send('Error occurred');
    } else {
      var data = {
        from: 'sidetime@sidetime.co',
        to: details.receiverEmail
      };

      if (req.body.status === 'declined') {
        data.subject = 'Call Request Declined';
        data.text = 'Sorry but ' + details.expertName + ' has declined your call request\n';
        data.text += 'This is the reason ' + details.expertName + ' gave for declining the request: \n';
        data.text += req.body.decline_reason;

        errMessage = 'Call request decline has been registered on the system but mail couldn\'t be delivered';
        errMessage += ' to the requestor';
        success = 'declined';
        sendEmail(data, errMessage, success, res);
      } else {
        var callPath = 'https://filmmakersource.firebaseio.com/sidetime/call_requests/' + details.callRequestId;
        callsRef.child(details.expertId).child('calls').push(callPath);
        var pushedRef = callsRef.child(details.requesterId).child('calls').push(callPath);

        pushedRef.once('value', function(snap) { 

          // convert suggested call start time to javascript date format
          var index = details.suggested_time.indexOf('hrs'),
          timeSubstr = details.suggested_time.substr(0, index),
          dateTime = details.suggested_date + ', ' + timeSubstr;
          dtstart = new Date(dateTime); console.log(dateTime, dtstart); 
          console.log('timesbtr', timeSubstr);
          console.log('dateTime', dateTime);

          // calculate call end time
          var pos = details.estimateLength.indexOf('minutes'),
          minSubstr = details.estimateLength.substr(0, pos),
          getTime =  dtstart.getTime() + (parseInt(minSubstr) * 60000);
          dtend = new Date(getTime); console.log(getTime);

          createCalEvent(details, dtstart, dtend, data, res);

        });
      }
    }
  });
};

var createCalEvent = function(details, dtstart, dtend, data, res) {
  var options = {
    eventName: 'Call with expert',
    fileName: 'invite.ics',
    dtstart: dtstart,
    dtend: dtend,
    email: {
      name: details.requesterName,
      email: details.receiverEmail
    }
  };

  // create .ics calendar file invite and send to the call requestor
  ical.createEvent(options, null, function(err, filepath) {

    var file = fs.readFileSync(filepath);

    data.subject = 'Call Request Accepted';
    data.text = 'Hi,\n This email is to inform you that  ' + details.expertName + ' has accepted your call request.\n';
    data.text += 'Your credit card has therefore been charged.';
    var attch = new mailgun.Attachment({data: file, filename: 'invite.ics'});
    data.attachment = attch;

    errMessage = 'Call request Acceptance has been registered on the system but mail couldn\'t be delivered';
    errMessage += ' to the requestor';

    mailgun.messages().send(data, function (error, body) {
      if (error) { 
        res.status(500).send(errMessage);
      } else {
        delete data.attachment;

        // send mail to the expert
        data.to = details.expertEmail; 
        data.subject = 'Call Request Acceptance Summary';
        data.body = 'You have accepted the call request with ' + details.requesterName + '. Below are the details: \n';
        data.body +=  details.message + '\n';
        data.body += 'Estimate Length: ' + details.estimateLength;
        data.body += '\n suggested time:' + details.suggested_time;
        data.body += '\n suggested date:' + details.suggested_date;
        data.body += '\n requester\'s email: ' + details.receiverEmail;
        data.html = '<p> You have accepted the call request with ' + details.requesterName + '. Below are the details: </p>';
        data.html += '<p>' + details.message + '</p>';
        data.html += '<p> Estimate Length: ' + details.estimateLength + '</p>';
        data.html += '<p> suggested time:' + details.suggested_time + '</p>';
        data.html += '<p> suggested date:' + details.suggested_date + '</p>';
        data.html += '<p> requester\'s email: ' + details.receiverEmail + '</p>';

        errMessage = 'Booked on the system but there was failure in mail delivery to the expert';
        success = 'accepted';
        sendEmail(data, errMessage, success, res);
      }
    });
  });
};