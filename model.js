const svgNS = "http://www.w3.org/2000/svg";

//constantes graphiques
const width = 600;
const height = 600;


//Constantes de temps
const v = 20;   //20px par secondes
const T = 1/25;   // 1/nb de frame par secondes
const dl = v*T;   // deplacement elementaire
let t = 0;
let needtoplot = true;

//Constante liées a la maladie
let T_mort = 400/T; //Durée pour mourir
let T_guerri = 50/T; //Durée pour guerrir
let Transm = 0.5; //probabilité de transmettre

let nb_sain = 249;
let nb_malade = 0;
let nb_guerri = 0;
let Contamines = new Array;
let Sains = new Array;
let Guerris = new Array;
let Particules = new Array;





/* generates random circles in specified area */
class particule {
    
    constructor(start_x, start_y, radius,v_x,v_y,state) {
        this.x = start_x;
        this.y = start_y;
        this.r = radius;
        
        this.time = NaN;
        this.v_x = v_x;
        this.v_y = v_y;
        this.state = state;
    }
    
    draw() {
        let svg = document.querySelector("svg");
        let c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', this.x); // svg's circle center
        c.setAttribute('cy', this.y);
        c.setAttribute('r', this.r);  // svg's circle radius
        c.setAttribute('class',part)
        switch (this.state) {
            case 0:
                c.setAttribute('fill', 'yellow')
                break;
            case 1:
                c.setAttribute('fill', 'pink');
                break;
            case 2:
                c.setAttribute('fill','blue');
                break;
            case -1:
                c.setAttribute('fill','black')
                break     
        }
        svg.append(c);
    }

    mur(){
        if (this.x-this.r < 0){
            this.v_x = Math.abs(this.v_x)
        }else{if (this.x + this.r>width){
            this.v_x = -Math.abs(this.v_x)
        }}
        if (this.y-this.r < 0){
            this.v_y = Math.abs(this.v_y)
        }else{if (this.y +this.r> height){
            this.v_y = -Math.abs(this.v_y)
        }}
        
    }

    transmition(autre){
        if (this.state == 1){
            r = Math.random()
            if (autre.state == 0 & r < Transm){
                autre.state = 1
                autre.time = 0;
                nb_malade ++;
                nb_sain --;
                needtoplot = true;
            }
        }
    }

    colision(autre){
        let dist = Math.pow(autre.x-this.x,2) + Math.pow(autre.y-this.y,2);
        if (dist <= Math.pow(autre.r+this.r+2,2)){
            autre.v_x = dl*(Math.random()-0.5);
            autre.v_y = dl*(Math.random()-0.5);
            
            this.v_x = dl*(Math.random()-0.5);
            this.v_y = dl*(Math.random()-0.5);
            
            this.transmition(autre) //on regarde si on donne
            autre.transmition(this)  //on regarde si on reçoit
        }
    }
    
    update(){
        if (this.time > T_guerri){
            if (this.state == 1){
                this.state = 2;
                nb_guerri ++;
                nb_malade --;
                needtoplot = true;
            }
        }
        this.mur()
        this.x = this.x + this.v_x;
        this.y = this.y + this.v_y;
        this.time += 1;
        this.draw()
        }
    }
    

function sliding(){
    var slider_guerri = document.getElementById("T_guerri");
    var slider_transm = document.getElementById("Transm");
    var slider_pop = document.getElementById("Pop");
    T_guerri = slider_guerri.value/T;
    Transm = slider_transm.value/100;
    nb_sain = slider_pop.value-1;


    slider_guerri.oninput = function() {
        T_guerri = this.value/T;
    }
    slider_transm.oninput = function() {
        Transm = this.value/100;
    }
    slider_pop.oninput = function() {
        if (this.value-1 < nb_sain){
            Particules = Particules.slice(nb_sain-this.value+1)
            console.log('en dessous')
        }else{
            for(let i=0;i<this.value-1-nb_sain;i++){
                x = Math.random()*width;
                y = Math.random()*height;
                r = Math.floor(Math.random()*3+3);
                vx = dl*(Math.random()-0.5);
                vy = dl*(Math.random()-0.5);
                Particules.unshift(new particule(x, y, r, vx, vy, 0));
            }
        }
        nb_sain = this.value-1;
        Newframe(svg)
    }
    let svg = document.querySelector("svg");
    Newframe(svg);
}
    



for (var i = 0; i < nb_sain; i++) {
    x = Math.random()*width;
    y = Math.random()*height;
    r = Math.floor(Math.random()*3+3);
    vx = dt*(Math.random()-0.5);
    vy = dt*(Math.random()-0.5);
    Particules.push(new particule(x, y, r, vx, vy, 0));
  }
add()

function add(){
    x = Math.random()*width;
    y = Math.random()*height;
    r = Math.floor(Math.random()*3+3);
    vx = dl*(Math.random()-0.5);
    vy = dl*(Math.random()-0.5);
    a = new particule(x, y, r, vx, vy, 1);
    a.time = 0;
    Particules.push(a);
    nb_malade ++;
    needtoplot = true
}
function kill(){
    let i = Particules.length-1
    while (i>0 & Particules[i].state != 1){
        i--
    }
    if (Particules[i].state == 1){
        Particules.splice(i, 1)
        nb_malade --;
        needtoplot = true;
    }
}

let onoff = false;
function start_stop(){
    onoff = ! onoff;
    }


function clearsvg(svg){
    while (svg.lastChild) {
        svg.removeChild(svg.lastChild);
    }
}

function graph(){
    var chart = new CanvasJS.Chart("chartContainer", {
        theme: "light2",
        title:{
            text: "Population"
        },
        axisY:{
            includeZero: true,
        },
        data: [{
            showInLegend: true, 
            legendText:'Proportion of sick people',
            lineColor:'pink',
            lineThickness:'4', 
            markerType:"none",      
            type: "line",
              indexLabelFontSize: 16,
            dataPoints: Contamines,
        },
        {
            showInLegend:true,
            legendText:'Proportion of good people',
            lineColor:'yellow',
            lineThickness:'4', 
            markerType:"none",      
            type: "line",
              indexLabelFontSize: 16,
            dataPoints: Sains,
        },
        {
            showInLegend:true,
            name:'Sauves',
            legendText:"Proportion of immune people",
            lineColor:'blue',
            lineThickness:'4', 
            markerType:"none",      
            type: "line",
              indexLabelFontSize: 16,
            dataPoints: Guerris,
        }],
    });
    chart.render();
    
    };

function Newframe(svg){
    clearsvg(svg)
    for (var i=0; i< Particules.length;i++){
        part = Particules[i];
        for (var j=0; j<i; j++){
            part.colision(Particules[j]);
        }
    }
    for (var part of Particules){
        part.update();
    }
    if (needtoplot || t%500 == 0){
        let N = nb_guerri + nb_malade + nb_sain;
        Contamines.push({x:t, y:nb_malade/N});
        Sains.push({x:t, y:nb_sain/N});
        Guerris.push({x:t, y:nb_guerri/N});
        graph()
        needtoplot = false
        console.log(Transm)
    }
}

window.onload = function () { 
    let svg = document.querySelector("svg");
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    Newframe(svg);
    sliding()
    setInterval(
        function(){

        if (onoff){
            t++;
            Newframe(svg)
        }
        }, T)
    
}
