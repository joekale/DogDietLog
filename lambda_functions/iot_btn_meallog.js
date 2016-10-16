/**
* Created by joekale on 9/24/16.
*/
'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const SINGLE = "SINGLE";
const DOUBLE = "DOUBLE";
const LONG = "LONG";
/**
* The following JSON template shows what is sent as the payload:
{
"serialNumber": "GXXXXXXXXXXXXXXXXX",
"batteryVoltage": "xxmV",
"clickType": "SINGLE" | "DOUBLE" | "LONG"
}
*
* A "LONG" clickType is sent if the first press lasts longer than 1.5 seconds.
* "SINGLE" and "DOUBLE" clickType payloads are sent for short clicks.
*
* For more documentation, follow the link below.
* http://docs.aws.amazon.com/iot/latest/developerguide/iot-lambda-rule.html
*/
exports.handler = (event, context, callback) => {
  var mealResult;

  switch (event.clickType){
    case SINGLE:
      mealResult = "ATE";
      break;
    case DOUBLE:
      mealResult = "DELAYED";
      break;
    case LONG:
      mealResult = "SKIPPED";
      break;
    default:
      callback(`Error. click type '${event.clickType}' not mapped`, null);
  }
  // replace iotbutton info.
  dynamodb.putItem({
    "TableName": "IoT_Buttons",
    "Item": {
      "serialNumber": {"S": event.serialNumber},
      "voltage": {"S": event.batteryVoltage}
    },
    "ReturnValues": "ALL_OLD"
  }, function(err,data){
    console.log(data);
    context.callbackWaitsForEmptyEventLoop = false;
    if(err){
      //fail callback
      callback(err, null);
    }
  });
  dynamodb.query({
    "TableName": "Dogs",
    "IndexName": "iotbutton-index",
    "KeyConditionExpression": 'iotbutton = :serialNum',
    "ExpressionAttributeValues": {
      ':serialNum': event.serialNumber
    }
  }, function(err, data){
    if(err){
      callback(err, null);
    }else if(data.Count > 1) {
      callback("IoT button is registered to multiple dogs", null);
    } else {
      saveMeal(data.Items[0].uuid, mealResult);
    }
  });

};

var saveMeal = function(dogId, result){
  var date = Date.now();
  dynamodb.putItem({
    "TableName": "PupHealth_Meals",
    "Item": {
      "id": `${date}:${dogId}`,
      "time": {"S": date},
      "result": {"S": result},
      "dogId": dogId
    }
  }, function(err, data){
    context.callbackWaitsForEmptyEventLoop = false;
    if(err){
      //fail callback
      console.error(err);
      callback(err, null);
    }else {
      //success callback
      console.log(data);
      callback(null, data);
    }
  });
}
