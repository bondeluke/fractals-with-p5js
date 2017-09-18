var tree;
var allSliders;
var grid;
var colorGrid;
var presetChoice;
var presets;

function setup() {
    frameRate(60);
    createCanvas(1000, 1000);

    presets = new Slider(0, treeStates.length - 1, "Presets", () => presetChoice, v => setTheScene(v), 0, [5, 115, 110, 240]);
    presets.setPosition(12, 12);

    setTheScene(0);
}

function setTheScene(choice) {
    presetChoice = choice;

    tree = new Tree(treeStates[choice]);

    setupGridsAndSliders();
}

function draw() {
    background(tree.bgColor);

    presets.render();

    grid.render();
    colorGrid.render();
    tree.render();
}

function mousePressed() {
    for (var i = 0; i < allSliders.length; i++) {
        allSliders[i].onMousePressed();
    }

    tree.onMousePressed();
}

function mouseDragged() {
    for (var i = 0; i < allSliders.length; i++) {
        allSliders[i].onMouseDragged();
    }

    tree.onMouseDragged();
}

function setupGridsAndSliders() {
    var c = tree.branchConfigs.length;
    var iterationLimit = c === 2 ? 12 : (c === 3 ? 8 : 6);
    tree.iterations = min(tree.iterations, iterationLimit);

    var main = sliderFactory.getMain(iterationLimit);
    var branchSliders = sliderFactory.getBranchSliders();
    var variation = sliderFactory.getVaration();
    var colorSliders = sliderFactory.getColors();

    var mainSliders = main.concat(variation).concat(branchSliders);

    allSliders = mainSliders.concat(colorSliders);
    allSliders.push(presets);

    grid = new Grid(mainSliders, 4, true);
    colorGrid = new Grid(colorSliders, 2);

    var h = 370;
    grid.setPosition(25, height - h - 20);
    colorGrid.setPosition(width - colorGrid.width - 25, height - h - 20);
}

var memory = [];

function updateBranchConfigsAndSliders(newCount) {
    var bc = tree.branchConfigs;
    while (bc.length < newCount) {
        var config = memory.length > 0 ? memory.pop() : jsonClone(bc[bc.length - 1]);
        bc.push(config);
    }
    while (bc.length > newCount) {
        memory.push(bc.pop());
    };
    setupGridsAndSliders();
}

// Slider
function Slider(minValue, maxValue, label, get, set, precision = 0, color = [202, 200, 212, 220]) {
    // Computed constants
    this.radius = this.diameter / 2;
    this.sliderHeight = this.diameter + this.margin * 2;

    // Instance variables
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.sourceGet = get;
    this.sourceSet = set;
    this.label = label;
    this.precision = precision;
    this.color = color;
}

Slider.prototype.setPosition = function (xPos, yPos) {
    this.x = xPos;
    this.y = yPos;

    var marginRadius = this.margin + this.radius;
    this.minSliderX = xPos + marginRadius;
    this.maxSliderX = xPos + this.width - marginRadius;
    this.sliderY = yPos + this.height - marginRadius;
}

Slider.prototype.height = 50;
Slider.prototype.width = 150;
Slider.prototype.margin = 5;
Slider.prototype.diameter = 25;
Slider.prototype.backgroundColor = 240;

Slider.prototype.getValueFromSlider = function (sliderX) {
    var range = this.maxValue - this.minValue;
    var magnitude = (sliderX - this.minSliderX) / (this.maxSliderX - this.minSliderX);
    return (magnitude * range + this.minValue);
}

Slider.prototype.getDisplayValue = function () {
    return this.label + ": " + this.sourceGet().toFixed(this.precision).toString();
}

Slider.prototype.render = function () {
    push();
    strokeWeight(1);
    fill(this.backgroundColor);
    rect(this.x, this.y, this.width, this.height);
    line(this.minSliderX, this.sliderY, this.maxSliderX, this.sliderY);
    fill(this.color);
    ellipse(this.getSliderX(), this.sliderY, this.diameter, this.diameter);
    fill(0);
    strokeWeight(0);
    text(this.getDisplayValue(), this.minSliderX, this.y + this.height - this.sliderHeight - 1);
    pop();
}

Slider.prototype.onMousePressed = function () {
    this.mouseIsOver = dist(mouseX, mouseY, this.getSliderX(), this.sliderY) < this.radius;
}

Slider.prototype.onMouseDragged = function () {
    if (this.mouseIsOver) {
        var sliderX = max([min([mouseX, this.maxSliderX]), this.minSliderX]);
        this.setValue(this.getValueFromSlider(sliderX));
    }
}

Slider.prototype.getSliderX = function () {
    var range = this.maxSliderX - this.minSliderX;
    var magnitude = (this.sourceGet() - this.minValue) / (this.maxValue - this.minValue);
    return magnitude * range + this.minSliderX;
}

Slider.prototype.setValue = function (value) {
    value = localRound(value, this.precision);

    if (this.sourceGet() != value) {
        this.sourceSet(value);
        tree.repopulateBranches();
    }
}

// Branch
function Branch(x, y, v, weight, color) {
    this.x = x;
    this.y = y;
    this.v = v;
    this.x2 = x + v.x;
    this.y2 = y + v.y;
    this.weight = weight;
    this.color = color;
}

Branch.prototype.render = function () {
    push();
    strokeWeight(this.weight);
    stroke(this.color);
    line(this.x, this.y, this.x2, this.y2);
    pop();
}

// Tree
function Tree(initialState) {
    this.setState(initialState);
}

Tree.prototype.repopulateBranches = function () {
    this.branches = [];
    var thickness = this.trunkWeight;
    var c = this.trunkColor;
    var g = this.colorChange;

    var v = createVector(0, -this.trunkHeight);
    v.rotate(radians(this.trunkAngle));
    var trunk = new Branch(this.x, this.y, v, thickness, c);
    var branchesToProcess = [trunk];
    var newBranches = [];

    for (var i = 1; i <= this.iterations; i++) {
        var newColor = [c[0] + i * g[0], c[1] + i * g[1], c[2] + i * g[2], 256];
        for (var j = 0; j < branchesToProcess.length; j++) {
            var configs = this.branchConfigs.slice(); // copy the array;

            if (this.randomSelection && i > 1) {
                var r = getRandomInt(max(configs.length - i, 2), configs.length);
                configs = shuffleLocal(configs);
                configs.splice(r);
            }

            for (var b = 0; b < configs.length; b++) {
                newBranches.push(this.createSprout(branchesToProcess[j], configs[b], newColor));
            }
        }
        this.branches = this.branches.concat(branchesToProcess);
        branchesToProcess = newBranches;
        newBranches = [];
    }

    this.branches = this.branches.concat(branchesToProcess);
}

Tree.prototype.createSprout = function (p, bc, color) {
    var pv = createVector(p.v.x, p.v.y); // Position vector
    var sv = createVector(p.v.x, p.v.y); // Sprout vector

    // Random variations
    var pr = getRandomArbitrary(-1 * this.positionVariation, this.positionVariation);
    var ar = getRandomArbitrary(-1 * this.angleVariation, this.angleVariation);
    var lr = getRandomArbitrary(-1 * this.lengthVariation, this.lengthVariation);
    var wr = getRandomArbitrary(-1 * this.weightVariation, this.weightVariation);

    // Position
    pv.setMag(pv.mag() * min(bc.positionRatio + pr, 1));
    var x = p.x + pv.x;
    var y = p.y + pv.y;

    // Rotation and length
    sv.rotate(radians(bc.angle + ar));
    sv.setMag(sv.mag() * (bc.lengthRatio + lr));

    // Weight
    var weight = p.weight * min(bc.weightRatio + wr, 1);

    return new Branch(x, y, sv, weight, color);
}

Tree.prototype.render = function () {
    //push();
    //fill(150, 220, 150);
    //ellipse(this.x, this.y, 52, 24);
    //pop();

    for (var i = 0; i < this.branches.length; i++) {
        this.branches[i].render();
    }
}

Tree.prototype.onMousePressed = function () {
    this.mouseIsOver = dist(mouseX, mouseY, this.x, this.y) < 40;
}

Tree.prototype.onMouseDragged = function () {
    if (this.mouseIsOver) {
        this.setPosition(mouseX, mouseY);
    }
}

Tree.prototype.setPosition = function (xPos, yPos) {
    this.x = xPos;
    this.y = yPos;
    this.repopulateBranches();
}

Tree.prototype.getState = function () {
    return {
        iterations: this.iterations,
        branchConfigs: this.branchConfigs,
        randomSelection: this.randomSelection,
        trunkHeight: this.trunkHeight,
        trunkWeight: this.trunkWeight,
        trunkAngle: this.trunkAngle,
        angleVariation: this.angleVariation,
        positionVariation: this.positionVariation,
        lengthVariation: this.lengthVariation,
        weightVariation: this.weightVariation,
        trunkColor: this.trunkColor,
        colorChange: this.colorChange,
        bgColor: this.bgColor,
        x: this.x,
        y: this.y
    }
}

Tree.prototype.setState = function (s) {
    this.iterations = s.iterations;
    this.branchConfigs = s.branchConfigs;
    this.randomSelection = s.randomSelection ? s.randomSelection : false;
    this.trunkHeight = s.trunkHeight;
    this.trunkWeight = s.trunkWeight;
    this.trunkAngle = s.trunkAngle ? s.trunkAngle : 0;
    this.angleVariation = s.angleVariation ? s.angleVariation : 0;
    this.lengthVariation = s.lengthVariation ? s.lengthVariation : 0;
    this.weightVariation = s.weightVariation ? s.weightVariation : 0;
    this.positionVariation = s.positionVariation ? s.positionVariation : 0;
    this.trunkColor = s.trunkColor;
    this.colorChange = s.colorChange;
    this.bgColor = s.bgColor;
    this.x = s.x;
    this.y = s.y;
    this.repopulateBranches();
}

// Helpers
function getRandomInt(min, max) { // inclusive
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.random() * (max - min)) + min;
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function localRound(num, precision) {
    if (precision === 0)
        return parseInt(Math.round(num));

    var pow = Math.pow(10, precision);

    return parseInt(num * pow) / pow;
}

function jsonClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function shuffleLocal(array) {
    var counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        var index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        var temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

// Grid
function Grid(items, cols = 4, leftToRight = false) {
    this.cols = cols;
    this.margin = 5;
    this.items = items; // each item needs a setPosition(), width, and height properties
    this.width = this.getWidth();
    this.height = this.getHeight();
    this.leftToRight = leftToRight;
}

Grid.prototype.render = function () {
    var i = 0;

    var a, b;
    var limA = this.leftToRight ? this.cols : this.getNumRows();
    var limB = this.leftToRight ? this.getNumRows() : this.cols;
    for (b = 0; b < limB; b++) {
        for (a = 0; a < limA; a++) {
            if (i >= this.items.length) break;

            var r = this.leftToRight ? b : a;
            var c = this.leftToRight ? a : b;

            var item = this.items[i];

            var x = this.x + this.margin * (c + 1) + c * item.width;
            var y = this.y + this.margin * (r + 1) + r * item.height;

            item.setPosition(x, y);
            item.render();

            i++;
        }

        if (i >= this.items.length) break;
    }
}

Grid.prototype.setPosition = function (xPos, yPos) {
    this.x = xPos;
    this.y = yPos;
}

Grid.prototype.getWidth = function () {
    return this.margin + (this.margin + this.items[0].width) * (this.cols);
}

Grid.prototype.getNumRows = function () {
    var count = this.items.length;
    var lastRowMissing = count % this.cols === 0 ? 0 : this.cols - (count % this.cols);
    return (count + lastRowMissing) / this.cols;
}

Grid.prototype.getHeight = function() {
    return this.margin + (this.margin + this.items[0].height) * this.getNumRows();
}

// Cool trees
var treeStates = [
    {
        "iterations": 3,
        "branchConfigs": [
            { "angle": 60, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.9 },
            { "angle": -60, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.9 }
        ],
        "randomSelection": false,
        "trunkHeight": 247,
        "trunkWeight": 2,
        "trunkAngle": 0,
        "angleVariation": 0,
        "positionVariation": 0,
        "lengthVariation": 0,
        "weightVariation": 0,
        "trunkColor": [0, 0, 0, 256],
        "colorChange": [-30, -30, -30, 0],
        "bgColor": 245,
        "x": 496,
        "y": 551
    },
    {
        "iterations": 8,
        "branchConfigs": [
            { "angle": 60, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.65 },
            { "angle": -60, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.65 }
        ],
        "trunkHeight": 278,
        "trunkWeight": 10,
        "positionVariation": 0,
        "angleVariation": 0,
        "lengthVariation": 0,
        "weightVariation": 0,
        "trunkColor": [103, 196, 191, 256],
        "colorChange": [14, -14, 12, 0],
        "bgColor": 236,
        "x": 500,
        "y": 654
    },
    {
        "iterations": 7,
        "branchConfigs": [
            { "angle": 25, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.6 },
            { "angle": -25, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.6 },
            { "angle": 2, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.6 }
        ],
        "trunkHeight": 139,
        "trunkWeight": 15,
        "positionVariation": 0.05,
        "angleVariation": 20,
        "lengthVariation": 0.03,
        "weightVariation": 0.16,
        "trunkColor": [52, 52, 94, 256],
        "colorChange": [28, 11, 5, 0],
        "bgColor": 235,
        "x": 500,
        "y": 654
    },
    {
        "iterations": 12,
        "branchConfigs": [
            { "angle": 72, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.78 },
            { "angle": -23, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.78 }
        ],
        "trunkHeight": 197,
        "trunkWeight": 18,
        "angleVariation": 1,
        "positionVariation": 0,
        "lengthVariation": 0.04,
        "weightVariation": 0,
        "trunkColor": [50, 80, 90, 256],
        "colorChange": [15, 6, 2, 0],
        "bgColor": 236,
        "x": 478,
        "y": 598
    },
    {
        "iterations": 11,
        "branchConfigs": [
            { "angle": 25, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.61 },
            { "angle": -25, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.61 }
        ],
        "trunkHeight": 117,
        "trunkWeight": 17,
        "angleVariation": 11,
        "positionVariation": 0,
        "lengthVariation": 0.03,
        "weightVariation": 0,
        "trunkColor": [30, 69, 60, 256],
        "colorChange": [5, 21, 16, 0],
        "bgColor": 35,
        "x": 489,
        "y": 611
    },
    {
        "iterations": 8,
        "branchConfigs": [
            { "angle": 8, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.75 },
            { "angle": -8, "positionRatio": 0.72, "lengthRatio": 0.68, "weightRatio": 0.75 },
            { "angle": -3, "positionRatio": 0.9, "lengthRatio": 0.68, "weightRatio": 0.75 }
        ],
        "trunkHeight": 142,
        "trunkWeight": 4,
        "angleVariation": 14,
        "positionVariation": 0.03,
        "lengthVariation": 0.17,
        "weightVariation": 0.01,
        "trunkColor": [25, 63, 69, 256],
        "colorChange": [19, 15, 9, 0],
        "bgColor": 220,
        "x": 485,
        "y": 600
    },
    {
        "iterations": 11,
        "branchConfigs": [
            { "angle": 71, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.9 },
            { "angle": -12, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.9 }
        ],
        "trunkHeight": 169,
        "trunkWeight": 25,
        "angleVariation": 1,
        "positionVariation": 0,
        "lengthVariation": 0.08,
        "weightVariation": 0,
        "trunkColor": [36, 74, 50, 256],
        "colorChange": [0, 4, 0, 0],
        "bgColor": 245,
        "x": 484,
        "y": 588
    },
    {
        "iterations": 12,
        "branchConfigs": [
            { "angle": 30, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.9 },
            { "angle": -30, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.9 }
        ],
        "trunkHeight": 120,
        "trunkWeight": 25,
        "angleVariation": 15,
        "positionVariation": 0,
        "lengthVariation": 0.01,
        "weightVariation": 0,
        "trunkColor": [52, 52, 94, 256],
        "colorChange": [20, 11, 5, 0],
        "bgColor": 196,
        "x": 481,
        "y": 613
    },
    {
        "iterations": 10,
        "branchConfigs": [
            { "angle": 54, "positionRatio": 1, "lengthRatio": 0.76, "weightRatio": 0.75 },
            { "angle": -34, "positionRatio": 1, "lengthRatio": 0.76, "weightRatio": 0.75 }
        ],
        "trunkHeight": 153,
        "trunkWeight": 17,
        "angleVariation": 10,
        "positionVariation": 0,
        "lengthVariation": 0.04,
        "weightVariation": 0,
        "trunkColor": [187, 207, 185, 256],
        "colorChange": [-17, -22, -11, 0],
        "bgColor": 0,
        "x": 466,
        "y": 598
    },
    {
        "iterations": 6,
        "branchConfigs": [
            { "angle": 34, "positionRatio": 1, "lengthRatio": 0.59, "weightRatio": 0.72 },
            { "angle": -13, "positionRatio": 0.83, "lengthRatio": 0.6, "weightRatio": 0.68 },
            { "angle": -38, "positionRatio": 0.7, "lengthRatio": 0.65, "weightRatio": 0.74 },
            { "angle": 41, "positionRatio": 0.54, "lengthRatio": 0.61, "weightRatio": 0.74 }
        ],
        "trunkHeight": 237,
        "trunkWeight": 12,
        "angleVariation": 3,
        "positionVariation": 0.06,
        "lengthVariation": 0.02,
        "weightVariation": 0.06,
        "trunkColor": [108, 85, 68, 256],
        "colorChange": [-12, 8, -3, 0],
        "bgColor": 245,
        "x": 484,
        "y": 600
    }, {
        "iterations": 6,
        "branchConfigs": [
            { "angle": 34, "positionRatio": 0.98, "lengthRatio": 0.59, "weightRatio": 0.66 },
            { "angle": -16, "positionRatio": 0.83, "lengthRatio": 0.6, "weightRatio": 0.68 },
            { "angle": -38, "positionRatio": 0.7, "lengthRatio": 0.6, "weightRatio": 0.72 },
            { "angle": 41, "positionRatio": 0.54, "lengthRatio": 0.62, "weightRatio": 0.73 },
            { "angle": -34, "positionRatio": 0.41, "lengthRatio": 0.66, "weightRatio": 0.77 }
        ],
        "randomSelection": true,
        "trunkHeight": 237,
        "trunkWeight": 11,
        "trunkAngle": 1,
        "angleVariation": 4,
        "positionVariation": 0.04,
        "lengthVariation": 0.03,
        "weightVariation": 0.03,
        "trunkColor": [108, 85, 68, 256],
        "colorChange": [-12, 8, -3, 0],
        "bgColor": 245,
        "x": 489,
        "y": 555
    }, {
        "iterations": 5,
        "branchConfigs": [
            { "angle": 81, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.53 },
            { "angle": -38, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.64 },
            { "angle": -34, "positionRatio": 0.21, "lengthRatio": 0.6, "weightRatio": 0.62 },
            { "angle": 34, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.62 },
            { "angle": 47, "positionRatio": 0.36, "lengthRatio": 0.4, "weightRatio": 0.5 }
        ],
        "randomSelection": false,
        "trunkHeight": 250,
        "trunkWeight": 7,
        "trunkAngle": -3,
        "angleVariation": 0,
        "positionVariation": 0.09,
        "lengthVariation": 0,
        "weightVariation": 0.05,
        "trunkColor": [30, 59, 50, 256],
        "colorChange": [-4, 11, 17, 0],
        "bgColor": 245,
        "x": 489,
        "y": 569
    }];

var sliderFactory = (function () {
    var main = [
        new Slider(0, 6, "Iterations", () => tree.iterations, v => tree.iterations = v),
        new Slider(1, 5, "Branch factor", () => tree.branchConfigs.length, updateBranchConfigsAndSliders),
        new Slider(100, 300, "Trunk length", () => tree.trunkHeight, v => tree.trunkHeight = v),
        new Slider(1, 25, "Trunk weight", () => tree.trunkWeight, v => tree.trunkWeight = v)
    ];

    var variation = [
        new Slider(0, 20, "Angle Variation", () => tree.angleVariation, v => tree.angleVariation = v, 0, [225, 200, 212, 220]),
        new Slider(0, 0.3, "Position variation", () => tree.positionVariation, v => tree.positionVariation = v, 2, [225, 200, 212, 220]),
        new Slider(0, 0.3, "Length variation", () => tree.lengthVariation, v => tree.lengthVariation = v, 2, [225, 200, 212, 220]),
        new Slider(0, 0.3, "Weight variation", () => tree.weightVariation, v => tree.weightVariation = v, 2, [225, 200, 212, 220])
    ];

    var colorSliders = [
        new Slider(0, 255, "Trunk (Red)", () => tree.trunkColor[0], v => tree.trunkColor[0] = v, 0, [255, 0, 0, 220]),
        new Slider(0, 255, "Trunk (Green)", () => tree.trunkColor[1], v => tree.trunkColor[1] = v, 0, [0, 255, 0, 220]),
        new Slider(0, 255, "Trunk (Blue)", () => tree.trunkColor[2], v => tree.trunkColor[2] = v, 0, [0, 0, 255, 220]),

        new Slider(0, 245, "Background color", () => tree.bgColor, v => tree.bgColor = v, 0, [160, 160, 160, 200]),

        new Slider(-30, 30, "Change (Red)", () => tree.colorChange[0], v => tree.colorChange[0] = v, 0, [255, 0, 0, 220]),
        new Slider(-30, 30, "Change (Green)", () => tree.colorChange[1], v => tree.colorChange[1] = v, 0, [0, 255, 0, 220]),
        new Slider(-30, 30, "Change (Blue)", () => tree.colorChange[2], v => tree.colorChange[2] = v, 0, [0, 0, 255, 220]),

        new Slider(-90, 90, "Trunk Angle", () => tree.trunkAngle, v => tree.trunkAngle = v, 0, [160, 160, 160, 200]),
    ];

    return {
        getMain: function (iterationLimit) {
            main[0].maxValue = iterationLimit;
            return main;
        },
        getVaration() {
            return variation;
        },
        getColors() {
            return colorSliders;
        },
        getBranchSliders() {
            var branchSliders = [];

            for (var i = 0; i < tree.branchConfigs.length; i++) {
                var group = (function (i) { // Trapping i in an IIFE closure
                    var branchId = "B" + (i + 1);

                    return [
                        new Slider(-180, 180, branchId + " Angle", () => tree.branchConfigs[i].angle, v => tree.branchConfigs[i].angle = v, 0, [180, 205, 228, 220]),
                        new Slider(0.0, 1.0, branchId + " Position Ratio", () => tree.branchConfigs[i].positionRatio, v => tree.branchConfigs[i].positionRatio = v, 2, [180, 205, 218, 220]),
                        new Slider(0.4, .9, branchId + " Length Ratio", () => tree.branchConfigs[i].lengthRatio, v => tree.branchConfigs[i].lengthRatio = v, 2, [180, 205, 218, 220]),
                        new Slider(0.5, .9, branchId + " Weight Ratio", () => tree.branchConfigs[i].weightRatio, v => tree.branchConfigs[i].weightRatio = v, 2, [180, 205, 218, 220])
                    ];
                })(i);

                branchSliders = branchSliders.concat(group);
            }

            return branchSliders;
        }
    }
})();