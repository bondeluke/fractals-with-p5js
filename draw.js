var tree;
var sliders;
var sliderGrid;

function setup() {
    frameRate(60);
    createCanvas(900, 900);

    var initialState = {
        "trunkHeight": 200,
        "angleVariation": 0,
        "multiplierVariation": 0,
        "iterations": 12,
        "angle": 73.92857142857143,
        "multiplier": 0.6757142857142857,
        "angleMultiplier": -0.37142857142857144,
        "x": 452,
        "y": 666,
        "trunkThickness": 15
    };

    tree = new Tree(width / 2, height - 250);

    tree.setState(initialState);

    sliders = [
        new Slider(0, 12, "Iterations", () => tree.iterations, v => tree.iterations = v),
        new Slider(0.4, 0.8, "Length multiplier", () => tree.multiplier, v => tree.multiplier = v, 2),
        new Slider(0, 0.2, "Multiplier variation", () => tree.multiplierVariation, v => tree.multiplierVariation = v, 2),
        new Slider(0, 500, "Trunk height", () => tree.trunkHeight, v => tree.trunkHeight = v),
        new Slider(0, 180, "Angle", () => tree.angle, v => tree.angle = v),
        new Slider(-4, 4, "Angle multiplier", () => tree.angleMultiplier, v => tree.angleMultiplier = v, 1),
        new Slider(0, 20, "Angle variation", () => tree.angleVariation, v => tree.angleVariation = v),
        new Slider(1, 20, "Trunk thickness", () => tree.trunkThickness, v => tree.trunkThickness = v)
    ];

    sliderGrid = new Grid(sliders, 4);

    var gridX = (width - sliderGrid.getWidth()) / 2;
    sliderGrid.setPosition(gridX, height - sliderGrid.getHeight() - 20);

}

function draw() {
    background(230);

    sliderGrid.render();
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
function Slider(minValue, maxValue, label, get, set, precision = 0) {
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
Slider.prototype.controlColor = [220, 180, 200, 220];
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
    fill(this.controlColor);
    ellipse(this.getSliderX(), this.sliderY, this.diameter, this.diameter);
    fill(0);
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

    if (this.get() != value) {
        this.set(value);
        tree.repopulateBranches();
    }
}

function Branch(x, y, v, weight) {
    this.x = x;
    this.y = y;
    this.v = v;
    this.x2 = x + v.x;
    this.y2 = y + v.y;
    this.weight = weight;
}

Branch.prototype.render = function () {
    push();
    strokeWeight(this.weight);
    line(this.x, this.y, this.x2, this.y2);
    pop();
}

function Tree(xPos, yPos) {
    this.x = xPos;
    this.y = yPos;
    this.trunkHeight = 200;
    this.angleVariation = 0;
    this.multiplierVariation = 0;
    this.iterations = 10;
    this.angle = 45; // in degrees;
    this.multiplier = 0.6;
    this.angleMultiplier = -1;
    this.trunkThickness = 5;
}

Tree.prototype.repopulateBranches = function () {
    this.branches = [];
    var thicknessMultipler = 0.65;
    var thickness = this.trunkThickness;

    var v = createVector(0, -this.trunkHeight);
    var trunk = new Branch(this.x, this.y, v, thickness);
    var branchesToProcess = [trunk];
    var newBranches = [];

    for (var i = 0; i < this.iterations; i++) {
        thickness = max(thickness * thicknessMultipler, 1);
        for (var j = 0; j < branchesToProcess.length; j++) {
            var b = branchesToProcess[j];
            newBranches.push(this.createSprout(b, 1, thickness));
            newBranches.push(this.createSprout(b, this.angleMultiplier, thickness));
        }
        this.branches = this.branches.concat(branchesToProcess);
        branchesToProcess = newBranches;
        newBranches = [];
    }

    this.branches = this.branches.concat(branchesToProcess);
}

Tree.prototype.createSprout = function (branch, angleMultiplier, thickness) {
    var v = createVector(branch.v.x, branch.v.y);
    var r = getRandomInt(-1 * this.angleVariation, this.angleVariation);
    var angle = (angleMultiplier * this.angle) + r;
    v.rotate(radians(angle));
    v.setMag(v.mag() * (this.multiplier + getRandomArbitrary(-1 * this.multiplierVariation, this.multiplierVariation)));
    return new Branch(branch.x2, branch.y2, v, thickness);
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
        multiplierVariation: this.multiplierVariation,
        iterations: this.iterations,
        angle: this.angle,
        multiplier: this.multiplier,
        angleMultiplier: this.angleMultiplier,
        x: this.x,
        y: this.y,
        trunkThickness: this.trunkThickness
    }
}

Tree.prototype.setState = function (state) {
    this.trunkHeight = state.trunkHeight;
    this.angleVariation = state.angleVariation;
    this.multiplierVariation = state.multiplierVariation;
    this.iterations = state.iterations;
    this.angle = state.angle;
    this.multiplier = state.multiplier;
    this.angleMultiplier = state.angleMultiplier;
    this.x = state.x;
    this.y = state.y;
    this.trunkThickness = state.trunkThickness;
    this.repopulateBranches();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function round(x, base) {
    var pow = Math.pow(base || 10, x);
    return +(Math.round(this * pow) / pow);
}

function Grid(items, cols = 4) {
    this.cols = cols;
    this.margin = 5;
    this.items = items; // each item needs a setPosition(), width, and height properties
}

Grid.prototype.render = function () {
    var i = 0;

    var r, c;
    for (r = 0; ; r++) {
        for (c = 0; c < this.cols; c++) {
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

Grid.prototype.getHeight = function () {
    var count = this.items.length;
    var lastRowMissing = count % this.cols === 0 ? 0 : this.cols - (count % this.cols);
    var numRows = (count + lastRowMissing) / this.cols;
    return this.margin + (this.margin + this.items[0].height) * numRows;
}