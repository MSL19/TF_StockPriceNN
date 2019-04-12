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
let JSONdata = require('./stockTraining.json');
let testData = require('./predictJSON.json');
function getStockJSON(){ //this pulls the JSON data on Apple stock from Alphavantage and returns the JSON
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
  let jsonString;
  async function getData(){
  jsonString = await getStockJSON();
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
  
    
  }
  for(let i = timeSeriesKeys.length-2; i>=1; i--){
    let priceDelta = jsonString["Time Series (30min)"][timeSeriesKeys[i-1]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[i]]['4. close'];
    shiftedPriceChange.push(priceDelta);
 }
  let jData = [];
  for(let i= 0; i<volumeDeltaH.length; i++){
      let objectP = {
          pD: pricesDeltaH[i],
          vD: volumeDeltaH[i], 
            pC: shiftedPriceChange[i]
              }
      jData.push(objectP);
  }
  testData = [{
      pD: jsonString["Time Series (30min)"][timeSeriesKeys[0]]['4. close'] - jsonString["Time Series (30min)"][timeSeriesKeys[1]]['4. close'], 
      vD: jsonString["Time Series (30min)"][timeSeriesKeys[0]]['5. volume'] - jsonString["Time Series (30min)"][timeSeriesKeys[1]]['5. volume']
  }]
  fs.writeFile('stockTraining.json', JSON.stringify(jData), function(){});
  fs.writeFile('predictJSON.json', JSON.stringify(testData), function(){});

//JSONdata = JSON.stringify(jData);
trainNN();
}

function trainNN(){
   

 model = tf.sequential();
    trainingData = tf.tensor2d(JSONdata.map(item=> [
        item.pD, item.vD
    ]
    ),[98,2])

     outputData = tf.tensor2d(JSONdata.map(item => [
        item.pC > 0  ? 1 : 0,
        item.pC === 0 ? 1 : 0,
        item.pC < 0 ? 1 : 0
    
    ]), [98,3])
    predictData = tf.tensor2d(testData.map(item=>[
        item.pD, item.vD
    ]
    ), [1,2]
    )
    model.add(tf.layers.dense(
        {   inputShape: 2, 
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

 
