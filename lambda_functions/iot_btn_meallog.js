/**
 * Created by joekale on 9/24/16.
 */
'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const TABLE = "Meals";
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
    dynamodb.putItem({
        "TableName": TABLE,
        "Item": {
            "Timestamp": {"S": new Date().toISOString()},
            "result": {"S": mealResult},
            "batteryVoltage": {"S": event.batteryVoltage}
        }
    }, function(err, data){
        context.callbackWaitsForEmptyEventLoop = false;
        if(err){
            //fail callback
            callback(err, null);
        }else {
            //success callback
            callback(null, data);
        }
    });
};
