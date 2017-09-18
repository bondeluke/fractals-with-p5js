var tree;
var sliders;
var grid;
var colorGrid;

function setup() {
    frameRate(60);
    createCanvas(1000, 1000);

    tree = new Tree(treeStates[1]);

    sliders = [
        new Slider(0, 12, "Iterations", () => tree.iterations, v => tree.iterations = v),
        new Slider(1, 25, "Trunk thickness", () => tree.trunkThickness, v => tree.trunkThickness = v),
        new Slider(0.5, .9, "Thickness multiplier", () => tree.thicknessMultiplier, v => tree.thicknessMultiplier = v, 2),
        new Slider(0, 500, "Trunk height", () => tree.trunkHeight, v => tree.trunkHeight = v),
        new Slider(-180, 180, "Angle 1", () => tree.angle, v => tree.angle = v),
        new Slider(-180, 180, "Angle 2", () => tree.angle2, v => tree.angle2 = v),
        new Slider(0.4, 0.8, "Length multiplier", () => tree.multiplier, v => tree.multiplier = v, 2),
        new Slider(0, 255, "Background color", () => tree.bgColor, v => tree.bgColor = v),
        new Slider(0, 20, "Angle Variation", () => tree.angleVariation, v => tree.angleVariation = v, 0, [225, 200, 212, 220]),
        new Slider(0, 0.2, "Length variation", () => tree.lengthVariation, v => tree.lengthVariation = v, 2, [225, 200, 212, 220])
    ];

    grid = new Grid(sliders, 3);

    var colorSliders = [
        new Slider(0, 255, "Trunk (Red)", () => tree.trunkColor[0], v => tree.trunkColor[0] = v, 0, [255, 0, 0, 220]),
        new Slider(0, 255, "Trunk (Green)", () => tree.trunkColor[1], v => tree.trunkColor[1] = v, 0, [0, 255, 0, 220]),
        new Slider(0, 255, "Trunk (Blue)", () => tree.trunkColor[2], v => tree.trunkColor[2] = v, 0, [0, 0, 255, 220]),

        new Slider(0, 30, "Gradient (Red)", () => tree.colorGradient[0], v => tree.colorGradient[0] = v, 0, [255, 0, 0, 220]),
        new Slider(0, 30, "Gradient (Green)", () => tree.colorGradient[1], v => tree.colorGradient[1] = v, 0, [0, 255, 0, 220]),
        new Slider(0, 30, "Gradient (Blue)", () => tree.colorGradient[2], v => tree.colorGradient[2] = v, 0, [0, 0, 255, 220]),
    ];

    sliders = sliders.concat(colorSliders);

    colorGrid = new Grid(colorSliders, 2);

    grid.setPosition(25, height - grid.height - 20);
    colorGrid.setPosition(width - colorGrid.width - 25, height - grid.height - 20);
}

function draw() {
    background(tree.bgColor);

    grid.render();
    colorGrid.render();
    tree.render();
}

function mousePressed() {
    for (var i = 0; i < sliders.length; i++) {
        sliders[i].onMousePressed();
    }

    tree.onMousePressed();
}

function mouseDragged() {
    for (var i = 0; i < sliders.length; i++) {
        sliders[i].onMouseDragged();
    }

    tree.onMouseDragged();
}

// Slider
function Slider(minValue, maxValue, label, get, set, precision = 0, color = [202, 200, 212, 220]) {
    // Computed constants
    this.radius = this.diameter / 2;
    this.sliderHeight = this.diameter + this.margin * 2;

    // Instance variables
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.get = get;
    this.set = set;
    this.label = label;
    this.precision = precision;
    this.valueChangeListeners = [];
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

Slider.prototype.height = 60;
Slider.prototype.width = 180;
Slider.prototype.margin = 5;
Slider.prototype.diameter = 30;
Slider.prototype.controlSizeRatio = 0.55;
Slider.prototype.backgroundColor = 240;

Slider.prototype.getValue = function (sliderX) {
    var range = this.maxValue - this.minValue;
    var magnitude = (sliderX - this.minSliderX) / (this.maxSliderX - this.minSliderX);
    return (magnitude * range + this.minValue);
}

Slider.prototype.getDisplayValue = function () {
    return this.label + ": " + this.get().toFixed(this.precision).toString();
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
        this.setValue(this.getValue(sliderX));
    }
}

//Slider.prototype.valueChangedEvent = function(newValue){
//	for(var i = 0; i < this.valueChangeListeners.length; i++){
//		this.valueChangeListeners[i](newValue);
//	}
//}

Slider.prototype.getSliderX = function () {
    var range = this.maxSliderX - this.minSliderX;
    var magnitude = (this.get() - this.minValue) / (this.maxValue - this.minValue);
    return magnitude * range + this.minSliderX;
}

Slider.prototype.setValue = function (value) {
    debugger;
    // TODO: Make discrete using this.precision
    value = localRound(value, this.precision);

    if (this.get() != value) {
        this.set(value);
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
    var thickness = this.trunkThickness;
    var c = this.trunkColor;
    var g = this.colorGradient;

    var v = createVector(0, -this.trunkHeight);
    var trunk = new Branch(this.x, this.y, v, thickness, c);
    var branchesToProcess = [trunk];
    var newBranches = [];

    for (var i = 1; i <= this.iterations; i++) {
        thickness = max(thickness * this.thicknessMultiplier, 1);
        var newColor = [c[0] + i * g[0], c[1] + i * g[1], c[2] + i * g[2], 256];
        for (var j = 0; j < branchesToProcess.length; j++) {
            var b = branchesToProcess[j];
            newBranches.push(this.createSprout(b, this.angle, thickness, newColor));
            newBranches.push(this.createSprout(b, this.angle2, thickness, newColor));
        }
        this.branches = this.branches.concat(branchesToProcess);
        branchesToProcess = newBranches;
        newBranches = [];
    }

    this.branches = this.branches.concat(branchesToProcess);
}

Tree.prototype.createSprout = function (branch, angle, thickness, color) {
    var v = createVector(branch.v.x, branch.v.y);
    var r = getRandomArbitrary(-1 * this.angleVariation, this.angleVariation);
    v.rotate(radians(angle + r));
    v.setMag(v.mag() * (this.multiplier + getRandomArbitrary(-1 * this.lengthVariation, this.lengthVariation)));
    return new Branch(branch.x2, branch.y2, v, thickness, color);
}

Tree.prototype.render = function () {
    push();
    fill(150, 220, 150);
    ellipse(this.x, this.y, 52, 24);
    pop();

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
        trunkHeight: this.trunkHeight,
        angleVariation: this.angleVariation,
        lengthVariation: this.lengthVariation,
        iterations: this.iterations,
        angle: this.angle,
        multiplier: this.multiplier,
        angle2: this.angle2,
        x: this.x,
        y: this.y,
        trunkThickness: this.trunkThickness,
        thicknessMultiplier: this.thicknessMultiplier,
        trunkColor: this.trunkColor,
        bgColor: this.bgColor,
        colorGradient: this.colorGradient
    }
}

Tree.prototype.setState = function (state) {
    this.trunkHeight = state.trunkHeight;
    this.angleVariation = state.angleVariation;
    this.lengthVariation = state.lengthVariation;
    this.iterations = state.iterations;
    this.angle = state.angle;
    this.multiplier = state.multiplier;
    this.angle2 = state.angle2;
    this.x = state.x;
    this.y = state.y;
    this.trunkThickness = state.trunkThickness;
    this.trunkColor = state.trunkColor;
    this.colorGradient = state.colorGradient;
    this.thicknessMultiplier = state.thicknessMultiplier;
    this.bgColor = state.bgColor;
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
    debugger;
    if (precision === 0)
        return parseInt(num);

    var pow = Math.pow(10, precision);

    return parseInt(num * pow) / pow;
}

function halfway(min, max) {
    return (min + max) / 2;
}

// Grid
function Grid(items, cols = 4) {
    this.cols = cols;
    this.margin = 5;
    this.items = items; // each item needs a setPosition(), width, and height properties
    this.width = this.getWidth();
    this.height = this.getHeight();
}

Grid.prototype.render = function () {
    var i = 0;

    var r, c;
    for (c = 0; c < this.cols; c++) {
        for (r = 0; r < this.getNumRows(); r++) {
            if (i >= this.items.length) break;

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

Grid.prototype.getNumRows = function() {
    var count = this.items.length;
    var lastRowMissing = count % this.cols === 0 ? 0 : this.cols - (count % this.cols);
    return (count + lastRowMissing) / this.cols;
}

Grid.prototype.getHeight = function () {
    return this.margin + (this.margin + this.items[0].height) * this.getNumRows();
}

// Cool trees
var tree = {
    "trunkHeight": 108,
    "angleVariation": 10,
    "lengthVariation": 0.01,
    "iterations": 11,
    "angle": 25,
    "multiplier": 0.8,
    "angle2": -18,
    "x": 478,
    "y": 664,
    "trunkThickness": 15,
    "thicknessMultiplier": 0.6,
    "trunkColor": [50, 80, 90, 256],
    "colorGradient": [15, 6, 2, 0],
    "bgColor": 235
};

var myFav = {
    "trunkHeight": 214,
    "angleVariation": 1,
    "lengthVariation": 0.04,
    "iterations": 12,
    "angle": 72,
    "multiplier": 0.68,
    "angle2": -23,
    "x": 474,
    "y": 654,
    "trunkThickness": 18,
    "thicknessMultiplier": 0.78,
    "trunkColor": [50, 80, 90, 256],
    "bgColor": 236,
    "colorGradient": [15, 6, 2, 0]
};

var bg = {
    "trunkHeight": 117,
    "angleVariation": 11,
    "lengthVariation": 0.03,
    "iterations": 11,
    "angle": 25,
    "multiplier": 0.8,
    "angle2": -25,
    "x": 478,
    "y": 664,
    "trunkThickness": 17,
    "thicknessMultiplier": 0.61,
    "trunkColor": [30, 69, 60, 256],
    "bgColor": 35,
    "colorGradient": [5, 21, 16, 0]
};

var treeStates = [tree, myFav, bg]