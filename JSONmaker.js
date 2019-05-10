/**
 * Name: Max Lewis
 * Project Name: AI Project #1
 * Purpose: 
 * Use Tensor Flow to create a neural network with 4 input nodes with the intention of predicting the price of Apple Stock.
 * Date: 4/15/19
 * Collaborators: None
 */
//Global variable declarations
let lastRef;
let year;
let mon;
let day;
let minutes;
let minutesT;
let lastDBTime;
let outputString = {};
function updateTime(){ //legacy function from the days of using time to check if the database is up and running
    d = new Date();
    year = d.getFullYear();
    mon = d.getMonth()+1;
    day = d.getDate();
    hours = d.getHours(); //for the kdsatp server i don't need to subtract 2
    minutes = d.getMinutes();

if(minutes<30){
     minutesT = "00";
}
else{
     minutesT = "30";
}
time = hours+":"+minutesT+":00";

var dw = d.getDay();
if(dw==6){ //stocks don't trade over the weekend
day--;
}
if(dw==0){
day-=2;
}
if(day<10){
day = "0"+day;
}
date = year+"-"+mon+"-"+day;
}


var tf = require('@tensorflow/tfjs'); //import tensorflow library
var https = require("https");//used for sending JSON to localhost
const fs = require('fs');  //legacy, but still might use for file writing
//declaration of vars for stock data and data storage
let model;
let trainingData;
let predictData;
let outputData;
//arrays used as inputs for training the neural network
let pricesDeltaH = [];
let volumeDeltaH = [];
let priceMovementH = [];
//shifted to the righ one time unit to act as "the ideal"
let shiftedPriceChange =[];
//stock data for microsoft
let pricesDeltaHM = [];
let volumeDeltaHM = [];
let priceMovementHM = [];
let shiftedPriceChangeM =[];

let testData = [];
let jData = [];

let bigString = {}; //this JSON array is the thing ultimatley sent to the localhost/KDSATP webpage
let numCorrect = 0;
bigString["numPre"] = 0; //this "number" indicates wether the last prediciton was that the stock was going to go up or down, and if the network was correct
bigString["runs"] = 0; //number of runs
bigString["numCorrect"]= 0; //number of correct predictions
async function updateNN(){  //async function to update the network
    predictPrice(); 

}  

async function predictPrice(){ //this function only runs of the stock price has updated (this happens every 30 minutes)
console.log('test');
    try{
        let DBup = dataBaseCheck(jsonString); //checking if the Database has updated--if not, the NN will not be run

    console.log("Database: "+DBup);
    jsonString = await getStockJSONapple(); //get sock JSON data for apple
    jsonString2 = await getStockJSONmicro(); //get stock SJON data for microsoft
    if(DBup){ //if the database if running and has been updated recently
        bigString["runs"] += 1; //add to the number of runs
        let timeSeriesKeys = Object.keys(jsonString["Time Series (30min)"]);

        testData = [{ //colate data to enter into the TF NN
            pD: jsonString["Time Series (30min)"][timeSeriesKeys[0]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[1]]['4. close'], 
            vD: jsonString["Time Series (30min)"][timeSeriesKeys[0]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'],
            pDM: jsonString2["Time Series (30min)"][timeSeriesKeys[0]]['4. close'] - jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['4. close'],
            vDM: jsonString2["Time Series (30min)"][timeSeriesKeys[0]]['5. volume'] - jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'],
            pC: jsonString["Time Series (30min)"][timeSeriesKeys[1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[2]]['4. close']
        }]
        trainingData = [{ //colate time shifted data to train the net on
            pD: jsonString["Time Series (30min)"][timeSeriesKeys[1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[2]]['4. close'], 
            vD: jsonString["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[2]]['5. volume'],
            pDM: jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['4. close'] - jsonString2["Time Series (30min)"][timeSeriesKeys[2]]['4. close'],
            vDM: jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'] - jsonString2["Time Series (30min)"][timeSeriesKeys[2]]['5. volume'],
        }]
        predictData = tf.tensor2d(testData.map(item=>[ //enter in new data to TF
            item.pD, item.vD, item.pDM, item.vDM
        ]
        ), [1,4]
        ) 
        trainingData = tf.tensor2d(trainingData.map(item=>[ //enter in training data, so the NN will progressivley train
            item.pD, item.vD, item.pDM, item.vDM
        ]
        ), [1,4]
        )
        outputData = tf.tensor2d(testData.map(item => [ //used to deterimine the prediction
            item.pC > 0  ? 1 : 0,
            item.pC === 0 ? 1 : 0,
            item.pC < 0 ? 1 : 0
        
        ]), [1,3])
        if(bigString["numPre"]==0){ 
            if(trainingData['pD']>0){
            numCorrect++;
            bigString["lastRun"] = 11; //price up and net correcnt

            }
            else{
                bigString["lastRun"] = 12; //price up and net wrong

            }
        }
        else{
            if(trainingData['pD']<0){ 
                numCorrect++;
                bigString["lastRun"] = 21; //price down and net corect
    
                }
                else{
                    bigString["lastRun"] = 22; //price down and net wrong
    
                }
        }
        console.log('......Loss History.......');
         let res = await model.fit(trainingData, outputData, {epochs: 1}); 
         console.log(`Iteration X: ${res.history.loss[0]}`); 
      //}
      console.log('....Model Prediction !!!.....')
      let prediction = model.predict(predictData);
      let preAr = await prediction.data();
      prediction.print();
      if(preAr['0']>preAr['2']){ //analyize prediction
          bigString["Prediction"] = "price will go up!";
          bigString["numPre"] = 0;

      }
      else{
        bigString["prediction"] = "price will go down!";
        bigString["numPre"] = 1;

      }
      bigString["prediction array"] = prediction.toString();
      bigString["prediction number"] = preAr;

    }
}
catch(e){
    console.log(e);
}
}
const express = require('express'); //create express sender object

const app = express();//create express object
const port = 3030; //set the localhost port
app.get('/', (req, res) => res.json(bigString)); //send the data to the website: https://www.kdsatp.org/nnpp/
app.listen(port, () => console.log(`Listening on port ${port}!`)); //log that you are sending the data

function dataBaseCheck(company){ //this checks to see if the database has been updated
    let SMupdateBool; 
   
    
    lastRef = company['Meta Data']['3. Last Refreshed'];
    console.log(lastRef);
    if(lastRef !== lastDBTime){
        SMupdateBool = true;
        lastDBTime = lastRef;
    }
    else{
        SMupdateBool = false;
    }
    
   return SMupdateBool;
   
    }

function getStockJSONapple(){ //this pulls the JSON data on Apple stock from Alphavantage and returns the JSON
    return new Promise(function(resolve, reject){
        
        var request = https.request({
            method: "GET",
            host: "www.alphavantage.co", //"api.intrinio.com",
            path: "/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=30min&apikey=HQ5I4BGWLZBZUPJC", 
            
        
        }, function(response) {
            var json = "";
            response.on('data', function (chunk) {
                json += chunk;
            });
            response.on('end', function() {
                try{
                company = JSON.parse(json);   
                resolve(company); //returning the JSON
                }
                catch(e){
                reject(e);
                }                
            });
        });
        request.end();
        });
         
  }
  function getStockJSONmicro(){ //this pulls the JSON data on Apple stock from Alphavantage and returns the JSON
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: "GET",
            host: "www.alphavantage.co", //"api.intrinio.com",
            path: "/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=30min&apikey=HQ5I4BGWLZBZUPJC", 
            
        
        }, function(response) {
            var json = "";
            response.on('data', function (chunk) {
                json += chunk;
            });
            response.on('end', function() {
                try{
                company = JSON.parse(json);   
                resolve(company); //returning the JSON
                dataBaseCheck(company);
                }
                catch(e){
                reject(e);
                }                
            });
        });
        request.end();
        });
         
  }
  let jsonString;
  let jsonString2;
  async function getData(){
  jsonString = await getStockJSONapple();
  jsonString2 = await getStockJSONmicro();
  
  parseData();
  }
  getData();
  function parseData(){ 
  let timeSeriesKeys = Object.keys(jsonString["Time Series (30min)"]);
  for(let i = timeSeriesKeys.length-1; i>1; i--){ //parse data to get it ready for the initial training of the NN
    let priceDelta = jsonString["Time Series (30min)"][timeSeriesKeys[i-1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['4. close'];
    pricesDeltaH.push(priceDelta);
    let volumtDelta = jsonString["Time Series (30min)"][timeSeriesKeys[i-1]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['5. volume'];
    volumeDeltaH.push(volumtDelta);
  
    let priceDeltaM = jsonString2["Time Series (30min)"][timeSeriesKeys[i-1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['4. close'];
    pricesDeltaHM.push(priceDeltaM);
    let volumtDeltaM = jsonString2["Time Series (30min)"][timeSeriesKeys[i-1]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['5. volume'];
    volumeDeltaHM.push(volumtDeltaM);
    
  }
  for(let i = timeSeriesKeys.length-2; i>=1; i--){ //add the shifted prices onto the array 
    let priceDelta = jsonString["Time Series (30min)"][timeSeriesKeys[i-1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['4. close'];
    shiftedPriceChange.push(priceDelta);

 
 }
  for(let i= 0; i<volumeDeltaH.length; i++){
      let objectP = {
        pD: pricesDeltaH[i],
        vD: volumeDeltaH[i], 
        pDM: pricesDeltaHM[i],
        vDM: volumeDeltaHM[i],
        pC: shiftedPriceChange[i]

              }
      jData.push(objectP);
  }
  testData = [{
      pD: jsonString["Time Series (30min)"][timeSeriesKeys[0]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[1]]['4. close'], 
      vD: jsonString["Time Series (30min)"][timeSeriesKeys[0]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'],
      pDM: jsonString2["Time Series (30min)"][timeSeriesKeys[0]]['4. close'] - jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['4. close'],
      vDM: jsonString2["Time Series (30min)"][timeSeriesKeys[0]]['5. volume'] - jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['5. volume']
  }]
 
trainNN();
}

function trainNN(){
   

 model = tf.sequential(); //similar training sequence, except for training the NN on historical data
    trainingData = tf.tensor2d(jData.map(item=> [
        item.pD, item.vD, item.pDM, item.vDM
    ]
    ),[98,4])

     outputData = tf.tensor2d(jData.map(item => [
        item.pC > 0  ? 1 : 0,
        item.pC === 0 ? 1 : 0,
        item.pC < 0 ? 1 : 0
    
    ]), [98,3])
    predictData = tf.tensor2d(testData.map(item=>[
        item.pD, item.vD, item.pDM, item.vDM
    ]
    ), [1,4]
    )
    model.add(tf.layers.dense(
        {   inputShape: 4, 
            activation: 'sigmoid', 
            units: 10
        }
    ));
    
    model.add(tf.layers.dense(
        {
            inputShape: 10, 
            units: 3, 
            activation: 'sigmoid'
        }
    ));
    
    model.summary();

model.compile({
    loss: "categoricalCrossentropy",
    optimizer: tf.train.adam()
})
train_data();
}

async function train_data(){
    console.log('......Loss History.......');
    for(let i=0;i<98;i++){
     let res = await model.fit(trainingData, outputData, {epochs: 50}); //train the TF nn on historical data (from the last ~32 hours)
     console.log(`Iteration ${i}: ${res.history.loss[0]}`);
  }
  console.log('....Model Prediction .....')
  model.predict(predictData).print();

}

setInterval(updateNN, 1000*60*7); //update every 7  minutes
