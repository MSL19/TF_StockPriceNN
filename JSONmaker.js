//time stuff
let date;
let time;
let lastRef;
let year;
let mon;
let day;
let minutes;
let minutesT;
let lastDBTime;
let outputString = {};
function updateTime(){
    d = new Date();
    year = d.getFullYear();
    mon = d.getMonth()+1;
    day = d.getDate();
    hours = d.getHours(); //for the kdsatp server i don't need to subtract 2
    minutes = d.getMinutes();
/*(minutes<0){
    hours--;
}*/
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


var tf = require('@tensorflow/tfjs');
var https = require("https");
const fs = require('fs'); 
let model;
let trainingData;
let predictData;
let outputData;
let pricesDeltaH = [];
let volumeDeltaH = [];
let priceMovementH = [];
let shiftedPriceChange =[];

let pricesDeltaHM = [];
let volumeDeltaHM = [];
let priceMovementHM = [];
let shiftedPriceChangeM =[];

//let JSONdata = require('./stockTraining.json');
let testData = [];//require('./predictJSON.json');
let jData = [];

let bigString = {};

async function updateNN(){
    predictPrice(); 

}  

async function predictPrice(){ //this function only runs of the stock price has updated (this happens every 30 minutes)
console.log('wdas');
    try{
        let DBup = dataBaseCheck(jsonString); //checking if the Database has updated--if not, the NN will not be run

    console.log("asdasd"+DBup);
    jsonString = await getStockJSONapple();
    jsonString2 = await getStockJSONmicro();
    if(!DBup){
        console.log("asdasd");
        let timeSeriesKeys = Object.keys(jsonString["Time Series (30min)"]);

        testData = [{
            pD: jsonString["Time Series (30min)"][timeSeriesKeys[0]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[1]]['4. close'], 
            vD: jsonString["Time Series (30min)"][timeSeriesKeys[0]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'],
            pDM: jsonString2["Time Series (30min)"][timeSeriesKeys[0]]['4. close'] - jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['4. close'],
            vDM: jsonString2["Time Series (30min)"][timeSeriesKeys[0]]['5. volume'] - jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'],
            pC: jsonString["Time Series (30min)"][timeSeriesKeys[1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[2]]['4. close']
        }]
        trainingData = [{
            pD: jsonString["Time Series (30min)"][timeSeriesKeys[1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[2]]['4. close'], 
            vD: jsonString["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[2]]['5. volume'],
            pDM: jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['4. close'] - jsonString2["Time Series (30min)"][timeSeriesKeys[2]]['4. close'],
            vDM: jsonString2["Time Series (30min)"][timeSeriesKeys[1]]['5. volume'] - jsonString2["Time Series (30min)"][timeSeriesKeys[2]]['5. volume'],
        }]
        predictData = tf.tensor2d(testData.map(item=>[
            item.pD, item.vD, item.pDM, item.vDM
        ]
        ), [1,4]
        ) 
        trainingData = tf.tensor2d(trainingData.map(item=>[
            item.pD, item.vD, item.pDM, item.vDM
        ]
        ), [1,4]
        )
        outputData = tf.tensor2d(testData.map(item => [
            item.pC > 0  ? 1 : 0,
            item.pC === 0 ? 1 : 0,
            item.pC < 0 ? 1 : 0
        
        ]), [1,3])
        console.log('......Loss History.......');
    //    for(let i=0;i<98;i++){
         let res = await model.fit(trainingData, outputData, {epochs: 1});
         console.log(`Iteration X: ${res.history.loss[0]}`);
      //}
      console.log('....Model Prediction !!!.....')
      let prediction = model.predict(predictData);
      prediction.print();
      if(prediction[0]>prediction[2]){
          bigString["Prediction"] = "price will go up!";

      }
      else{
        bigString["prediction"] = "price will go down!";
      }
      bigString["prediction array"] = prediction.toString();
      bigString["prediction number"] = await prediction.data();

      const express = require('express'); //create express sender object

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
                //console.log(company);
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
               // console.log(company);
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
  //console.log(timeSeriesKeys);
  for(let i = timeSeriesKeys.length-1; i>1; i--){
    //console.log(jsonString["Time Series (30min)"][timeSeriesKeys[i]]['5. volume']);
    let priceDelta = jsonString["Time Series (30min)"][timeSeriesKeys[i-1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['4. close'];
    pricesDeltaH.push(priceDelta);
    let volumtDelta = jsonString["Time Series (30min)"][timeSeriesKeys[i-1]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['5. volume'];
    volumeDeltaH.push(volumtDelta);
  
    let priceDeltaM = jsonString2["Time Series (30min)"][timeSeriesKeys[i-1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['4. close'];
    pricesDeltaHM.push(priceDeltaM);
    let volumtDeltaM = jsonString2["Time Series (30min)"][timeSeriesKeys[i-1]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['5. volume'];
    volumeDeltaHM.push(volumtDeltaM);
    
  }
  for(let i = timeSeriesKeys.length-2; i>=1; i--){
    let priceDelta = jsonString["Time Series (30min)"][timeSeriesKeys[i-1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['4. close'];
    shiftedPriceChange.push(priceDelta);

  /*  let priceDeltaM = jsonString2["Time Series (30min)"][timeSeriesKeys[i-1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['4. close'];
    shiftedPriceChangeM.push(priceDeltaM);*/
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
  //fs.writeFile('stockTraining.json', JSON.stringify(jData), function(){});
  //fs.writeFile('predictJSON.json', JSON.stringify(testData), function(){});

//JSONdata = JSON.stringify(jData);
trainNN();
}

function trainNN(){
   

 model = tf.sequential();
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

    // compiling model
model.compile({
    loss: "categoricalCrossentropy",
    optimizer: tf.train.adam()
})
train_data();
}

async function train_data(){
    console.log('......Loss History.......');
    for(let i=0;i<98;i++){
     let res = await model.fit(trainingData, outputData, {epochs: 98});
     console.log(`Iteration ${i}: ${res.history.loss[0]}`);
  }
  console.log('....Model Prediction .....')
  model.predict(predictData).print();

}

setInterval(updateNN, 1000*60*2); 
