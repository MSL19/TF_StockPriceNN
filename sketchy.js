/**
 * Name: Max Lewis
 * Project Name: AI Project #1
 * Purpose: 
 * Generate a lightweight GUI for the user to interpret the relitive outputs of the Tensor Flow based neural network.
 * Date: 4/15/19
 * Collaborators: None
 */
let data;
let ready = false;

async function getData() {
    let req = await fetch('https://kdsatp.org/nnpp/');
    let data = await req.json();
    console.log(data);
    ready = true;
    return data;
  }
  async function setData(){
    data = await getData();
  }
  setInterval(setData, 1000);


  async function setup(){
    pixelDensity(4.7); //makes it high res
    //fullScreen();
    createCanvas(500,500);
  
    background(170);
  }
  async function draw(){
    if(ready){
        fill(40);
        rect(50, 450-(data['prediction number']['0']*400), 80, data['prediction number']['0']*400);
        fill(150);
        rect(190, 450-(data['prediction number']['1']*400), 80, data['prediction number']['1']*400);
        fill(250);
        rect(330, 450-(data['prediction number']['2']*400), 80, data['prediction number']['2']*400);
        fill(0);
        textSize(15);
        text("Increase", 50, 480);
        text("No Change", 190, 480);
        text("Decrease", 330, 480);
        textSize(20);
        text("A Visual Representation Predict Price Change Values", 10, 60);

    }
  }