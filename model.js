const svgNS = "http://www.w3.org/2000/svg";

//constantes graphiques
const width = 800;          //initalisation largeur
const height = 800;         //Initialisation hauteur


//Constantes de temps
const v = 20;   //20px par secondes
const T = 1/25;   // 1/nb de frame par secondes
const dl = v*T;   // deplacement elementaire
let t = 0;      //Durée depuis le début de l'experience
let needtoplot = true;

//Constante liées a la maladie
let T_mort = 400/T; //Durée pour mourir en tics car divise par la periode (400 secondes en théorie)
let T_guerri = 50/T; //Durée pour guerrir 50 secondes en theorie
let Transm = 0.5; //probabilité de transmettre
let confin = 0; //proportion de confinés
let comportement = 1; //comment se deplacent les non confinés

let nb_sain = 249;  //nombre de personnes saines
let nb_malade = 0; //nombre de personnes maldes
let nb_guerri = 0;
let N = nb_sain + nb_malade + nb_guerri;
let Contamines = new Array; //nombre de contaminees AU COURS DU TEMPS
let Sains = new Array;      //nombre de sains AU COURS DU TEMPS
let Guerris = new Array;    //nombre de guerrisAU COURS DU TEMPS

let Particules = new Array; //initialisation du tableau avec toutes les particules

let check =0;
//definition de la classe


class particule {
    /** 
    * Classe définissant une particule
    * Elle est définit par sa vitesse, sa position, sa taille et son état.
    * On lui rajoute un attribue time decrivant la durée depuis laquelle elle est infecté
    */
    constructor(start_x, start_y, radius,dx,dy,state) {
        this.x = start_x;
        this.y = start_y;
        this.r = radius;
        
        this.time = NaN;
        this.dx = dx;
        this.dy = dy;
        this.state = state;
        this.comportement = comportement; //La personne est elle bien confinée ? si 0 : pas de deplacement
    }
    
    draw() {
        /**
         * Fonction que l'on appelle a l'apparition d'un particule
         * Permet de créer le cercle qui la représente.
         * La couleur dépend de son etat
         */
        let svg = document.querySelector("svg");
        let c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', this.x); // svg's circle center
        c.setAttribute('cy', this.y);
        c.setAttribute('r', this.r);  // svg's circle radius
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
        svg.append(c) //on ajoute notre creation au container svg
    }

    mur(){
        /**
         * Detecte la colision a un mur
         * Le choc est elastique
         */
        if (this.x-this.r < 0){
            this.dx = Math.abs(this.dx)
        }else{if (this.x + this.r>width){
            this.dx = -Math.abs(this.dx)
        }}
        if (this.y-this.r < 0){
            this.dy = Math.abs(this.dy)
        }else{if (this.y +this.r> height){
            this.dy = -Math.abs(this.dy)
        }}
        
    }

    transmition(autre){
        /**
         * Transmet l'etat 1 avec une probabilité Transm
         */
        if (this.state == 1){
            let p = Math.random()
            if (autre.state == 0 & p < Transm){
                autre.state = 1; //etat transmit
                autre.time = 0;  
                nb_malade ++; //un nouveau malade
                nb_sain --; //un sain de moins
                needtoplot = true;
            }
        }
    }
    colision(autre){
        /**
         * Est appele lorsque deux particules rentrent en contact
         */ 
        let res = false
        let dist = Math.pow(autre.x-this.x,2) + Math.pow(autre.y-this.y,2); //(Dx**2+Dy**2)
        if (dist <= Math.pow(autre.r+this.r,2)){ //plus petit que la somme des rayons
/*             let vit = dl * autre.comportement
            autre.dx = 2*vit*(Math.random()-0.5);  //Nouvelle direction de déplacement aleatoire
            autre.dy = 2*vit*(Math.random()-0.5);   */
            
            let vit = this.comportement * dl
            this.dx = 2*vit*(Math.random()-0.5);
            this.dy = 2*vit*(Math.random()-0.5);
            
            this.transmition(autre); //on regarde si on donne
//            autre.transmition(this);  //on regarde si on reçoit
            res = true;
            
        }
        check ++;
        return res;
    }

    ChangementEtat(){
        /**
         * Est on malade depuis suffisament longtemps pur être guerri ?
         */
        if (this.time > T_guerri){
            if (this.state == 1){
                this.state = 2;
                this.time = NaN; //plus besoin de compter le temps
                nb_guerri ++;
                nb_malade --;
                needtoplot = true;
            }
        }
    }
    
    deplacement(){
        /**
         * Evolution de la particule entre la frame actuelle
         * et la suivante
         * L'impact entre les particules sera calculer en amont
         */
        this.ChangementEtat(); //on change d'etat ?
        this.mur(); //on cogne un mur ?
        this.x = this.x + this.dx; //deplacement 
        this.y = this.y + this.dy;
        this.time += 1;
        }
    }
    

function sliding(){
    /**
     * Donne une valeur au variable en fonction des curseurs
     */
    var slider_guerri = document.getElementById("T_guerri");
    var slider_transm = document.getElementById("Transm");
    var slider_pop = document.getElementById("Pop");
    var slider_confin = document.getElementById("conf"); //proporsion de confiné

    var ecrans = document.getElementsByClassName('ecran')
    //si on deplace le slider
    slider_guerri.oninput = function() {
        T_guerri = Number(this.value)/T;
        ecrans[0].innerHTML = ('000' + this.value).substr(-3);
    }
    slider_transm.oninput = function() {
        Transm = Number(this.value);
        ecrans[1].innerHTML = Transm.toFixed(2);
    }
    slider_pop.oninput = function() {
        /*  On ne peut pas simplement changer nb_sain
            Car il faut aussi changer le t'nregistrment 
            des particules.
        
        */
        N = nb_malade + nb_guerri + nb_sain;
        let newN = Number(this.value);
        let svg = document.querySelector("svg");
        if (newN < N){
            /* Si on est plus bas que l'ancienne valeur de N
               Il faut enlever des cases
            */
            Particules = Particules.slice(0,newN) //on enlève la difference
            for ( var i = 0; i < N - newN; i++){
                svg.removeChild(svg.lastChild);
            }
        }else{
            for(var i=0; i < newN - N;i++){
                var x = Math.random()*width;
                var y = Math.random()*height;
                var r = Math.floor(Math.random()*3+3);
                
                var part = new particule(x, y, r, 0, 0, 0)
                if (i < confin*(newN - N)){
                    part.comportement = 0; //elle est totalement confinée.
                }else{
                var vit = comportement * dl
                part.dx = 2*vit*(Math.random()-0.5);
                part.dy = 2*vit*(Math.random()-0.5);}
            Particules.push(part);
            part.draw()
            }
        }
    var s = 0;
    i = 0;
    r =0;
    for(var part of Particules){
        switch (part.state){
            case 0:
                s++
                break;
            case 1:
                i++;
                break;
            case 2:
                r++;
                break;
            case -1:
                break  
            
        }
    }
    nb_sain = s;
    nb_guerri = r;
    nb_malade = i;
    N = s + r + i;
    ecrans[2].innerHTML = ('000' + N).substr(-3);

    }
    slider_confin.oninput = function(){
        confin = Number(this.value);
        for (let i=0; i< N;i++){
            part = Particules[i];
            if (i<confin * N){
                console.log("confiné")
                part.comportement = 0;
                part.dx = 0;
                part.dy = 0;
            }else{
                let vit = comportement * dl
                let dx = 2*vit*(Math.random()-0.5)
                let dy = 2*vit*(Math.random()-0.5)
                part.comportement = comportement;
                part.dx = dx;
                part.dy = dy;
                console.log("deconfit"), part
            }
            ecrans[3].innerHTML = confin.toFixed(2);
    }
    }
}


function InitMonde(){
    var slider_guerri = document.getElementById("T_guerri");
    var slider_transm = document.getElementById("Transm");
    var slider_pop = document.getElementById("Pop");
    var slider_confin = document.getElementById("conf");

    T_guerri = Number(slider_guerri.value/T);

    Transm = Number(slider_transm.value);
    confin = Number(slider_confin.value);
    N = Number(slider_pop.value);

    nb_sain = N - 1;
    nb_guerri = 0;
    nb_malade = 0;
    onoff = false;
    t = 0;
    Particules = new Array;
    Contamines = new Array; //nombre de contaminees AU COURS DU TEMPS
    Sains = new Array;      //nombre de sains AU COURS DU TEMPS
    Guerris = new Array;
    add(false)
    for (var i = 0; i < nb_sain; i++) {
        var x = Math.random()*width;
        var y = Math.random()*height;
        // var r = Math.floor(Math.random()*3+3);
        var r = 6;
        var part = new particule(x, y, r, 0, 0, 0)
        if (i < confin * nb_sain){
            part.comportement = 0; //elle est totalement confinée.
        }else{
        var vit = comportement * dl
        part.dx = 2*vit*(Math.random()-0.5);
        part.dy = 2*vit*(Math.random()-0.5);
        }   
        Particules.push(part);
        part.draw()
        }
    var ecrans = document.getElementsByClassName('ecran')
    ecrans[0].innerHTML = ('000'+ T_guerri*T).substr(-3);
    ecrans[1].innerHTML = Transm.toFixed(2);
    ecrans[2].innerHTML = ('000'+ N).substr(-3);
    ecrans[3].innerHTML = confin.toFixed(2);
}

function add(running){
    let x = Math.random()*width;
    let y = Math.random()*height;
    let r=6
    // r = Math.floor(Math.random()*3+3);
    let vit = comportement * dl
    let dx = 2*vit*(Math.random()-0.5);
    let dy = 2*vit*(Math.random()-0.5);
    let a = new particule(x, y, r, dx, dy, 1);
    a.time = 0;
    Particules.push(a);
    a.draw()
    if(running){
        if (Math.random() < confin){
            a.dx = 0
            a.dy = 0
            a.comportement = 0;
            a.comportement = 0;
        }
        N++;
        document.getElementById("Pop").value = N;
        document.getElementsByClassName('ecran')[2].innerHTML = N;
    }
    nb_malade ++;
    eedtoplot = true;
}

function kill(){
    let i = N-1
    while (i>0 & Particules[i].state != 1){
        i--
    }
    if (Particules[i].state == 1){
        Particules.splice(i, 1)
        let svg = document.querySelector("svg")
        svg.removeChild(svg.children[i]);
        nb_malade --;
        N --;
        needtoplot = true;
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
    
    }


function Newframe(svg){
    check = 0
    let region = new Rectangle(width/2,height/2,width/2,height/2)
    let qt = new QuadTree(region,Math.floor(N/20));
    for (let i =0; i<N; i++){
        var part = Particules[i]
        let p = new Point(part.x,part.y,i)
        qt.insert(p)
    }
    for (let i =0; i<N; i++){
        var part = Particules[i];
        let range = new Circle(part.x, part.y, 12)
        let seen = qt.query(range);
            for (let point of seen){ 
                if (i!=point.userData){
                part.colision(Particules[point.userData]) }
            }
        }
    console.log(check)
    let Ronds = $( svg ).children();
    for (var i = 0; i < N; i += 1){
        var part = Particules[i]
        part.deplacement();
        Ronds[i].setAttribute('cx',part.x)
        Ronds[i].setAttribute('cy',part.y)
        switch (part.state) {
            case 0:
                Ronds[i].setAttribute('fill', 'yellow')
                break;
            case 1:
                Ronds[i].setAttribute('fill', 'pink');
                break;
            case 2:
                Ronds[i].setAttribute('fill','blue');
                break;
            case -1:
                Ronds[i].setAttribute('fill','black')
                break     
        }
    }
    if (( needtoplot || t%500 == 0 ) & t%25 == 0 ){
        let N = nb_guerri + nb_malade + nb_sain;
        Contamines.push({x:t*T, y:nb_malade/N});
        Sains.push({x:t*T, y:nb_sain/N});
        Guerris.push({x:t*T, y:nb_guerri/N});
        graph()
        needtoplot = false;
    }
}

let onoff = false;
function start_stop(){
    onoff = ! onoff;
    graph()
    }


window.onload = function () { 
    InitMonde()
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
function reset(){
    let svg = document.querySelector("svg");
    while (svg.lastChild) {
        svg.removeChild(svg.lastChild);
    }

    InitMonde();
}
