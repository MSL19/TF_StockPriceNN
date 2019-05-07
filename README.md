# Tensor Flow Stock Price Prediction
**Important Files**

JSONmaker.js:

-Runs in the background on the KDS ATP server. This Node.JS program pulls stock data from the Alphavantage online stock price API and then feedssaid data into a 4 input node, 3 output node Tensor Flow Neural Netowrk. The NN uses the sigmoid function to normalize the data and then complete matrix math to cume up with an array of three numbers that represent the chance the price will increase, the chance the price will stay the same, and the chance the price will decrease, respectivley. All the relevant data is then hosted on the page: https://kdsatp.org/nnpp/.

index.html:

-This is the HTML webpage that github pages serves at: https://msl19.github.io/TF_StockPriceNN/. All the formattng and graphics are handeled by p5, so this HTML page only serves to consolodate all the code. 

sketchy.js:

-This is the JavaScript code that is responsible for parsing through the JS hosted on https://kdsatp.org/nnpp/ and converting the numbers into relevant visual data. It accomplishes this by scaling the size of three rectangles to match the magnatude of the outputs of the neural network. Currently, it is way too simple, but I think it is a good start. 

**All other files are either depreciated of dependencies that I did not create**
 
**HOW TO RUN**

-type "npm install" to install the Node.JS addons
-type node JSONmaker.js to start the Node.JS backend
-simply opening the index.html file in Chrome should launch the page (wait a second for it to load the data), or alternitivley, visit: https://msl19.github.io/TF_StockPriceNN/
