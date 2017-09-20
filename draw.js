var tree;
var controlSliders;
var grid;
var colorGrid;
var presetChoice;
var presetSlider;
var activeSlider;
var hideControls;

function setup() {
    frameRate(15);
    createCanvas(1344, 756);

    presetSlider = new Slider(0, savedTrees.length - 1, "Presets", () => presetChoice, v => setTheScene(v), 0, [5, 115, 110, 240]);
    presetSlider.setPosition(15, 15);

    var saveButton = createButton('Save');
    saveButton.position(width - 100, 12);
    saveButton.mousePressed(function () {
        savedTrees[presetChoice] = tree.getState();
        alert('Saved preset ' + presetChoice);
    });

    var logStateButton = createButton('Log presets');
    logStateButton.position(width - 100, 40);
    logStateButton.mousePressed(function () {
        console.log(JSON.stringify(savedTrees));
    });

    var saveAsButton = createButton('Save as New');
    saveAsButton.position(width - 100, 68);
    saveAsButton.mousePressed(function () {
        savedTrees.push(tree.getState());
        presetChoice = savedTrees.length - 1;
        presetSlider.maxValue = presetChoice;
        alert('Saved as preset ' + presetChoice);
    });

    var deleteButton = createButton('Delete');
    deleteButton.position(width - 100, 96);
    deleteButton.mousePressed(function () {
        if (confirm('Are you sure you want to delete preset ' + presetChoice)) {
            savedTrees.splice(presetChoice, 1);
            presetChoice = confine(presetChoice, 0, savedTrees.length - 1);
            presetSlider.maxValue = savedTrees.length - 1;
            setTheScene(presetChoice);
        }
    });

    var randomizeButton = createButton('Randomize');
    randomizeButton.position(width - 100, 124);
    randomizeButton.mousePressed(function () {
        for (var i = 0; i < controlSliders.length; i++) {
            var s = controlSliders[i];
            s.setValue(getRandomArbitrary(s.minValue, s.maxValue));
        }
    });

    var resetButton = createButton('Reset');
    resetButton.position(width - 100, 152);
    resetButton.mousePressed(function () {
        setTheScene(presetChoice);
    });

    var downloadButton = createButton('Download');
    downloadButton.position(width - 100, 176);
    downloadButton.mousePressed(function () {
        if (hideControls || confirm('Are you sure you want to download an image without the hiding controls first?')) {
            save('FractalTree.png');
        }
    });

    var shownOnce = false;
    var hideButton = createButton('Hide controls');
    hideButton.position(width - 100, 204);
    hideButton.mousePressed(function () {
        if (!hideControls && !shownOnce) {
            alert('Hiding controls makes for a better image when downloading. Note that you can drag the tree by its base');
            shownOnce = true;
        }
        hideControls = !hideControls;
        hideButton.elt.innerText = hideControls ? 'Unhide' : 'Hide controls';
    });

    setTheScene(getRandomInt(0, savedTrees.length - 1));
}

function setTheScene(choice) {
    presetChoice = choice;

    tree = new Tree(savedTrees[choice]);

    setupGridsAndSliders();
}

function draw() {
    background(tree.bgColor);

    if (!hideControls) {
        presetSlider.render();
        grid.render();
        colorGrid.render();
    }

    tree.render();
}

function mousePressed() {
    for (var i = 0; i < controlSliders.length; i++) {
        controlSliders[i].onMousePressed();
    }

    presetSlider.onMousePressed();
    tree.onMousePressed();
}

function mouseDragged() {
    for (var i = 0; i < controlSliders.length; i++) {
        controlSliders[i].onMouseDragged();
    }

    presetSlider.onMouseDragged();
    tree.onMouseDragged();
}

function keyPressed() {
    for (var i = 0; i < controlSliders.length; i++) {
        controlSliders[i].onKeyPressed();
    }

    presetSlider.onKeyPressed();
}

function setupGridsAndSliders() {
    var windowMargin = 10;
    var c = tree.branchConfigs.length;
    var iterationLimit = c === 2 ? 12 : (c === 3 ? 8 : 6);
    tree.iterations = min(tree.iterations, iterationLimit);

    var main = sliderFactory.getMain(iterationLimit);
    var branchSliders = sliderFactory.getBranchSliders();
    var variation = sliderFactory.getVaration();
    var colorSliders = sliderFactory.getColors();

    var mainSliders = main.concat(variation).concat(branchSliders);

    controlSliders = mainSliders.concat(colorSliders);

    grid = new Grid(mainSliders, 4, true);
    colorGrid = new Grid(colorSliders, 2);

    var h = 370;
    grid.setPosition(windowMargin, 310);
    colorGrid.setPosition(windowMargin, 80);
}

var memory = [];

function updateBranchConfigsAndSliders(newCount) {
    var bc = tree.branchConfigs;
    while (bc.length < newCount) {
        var config = memory.length > 0 ? memory.pop() : {
            angle: getRandomInt(-90, 90),
            positionRatio: 1.0,
            lengthRatio: 0.65,
            weightRatio: 0.7
        };
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
    this.active = false;
    this.disabled = false;
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
Slider.prototype.width = 140;
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

    var d = this.disabled;
    var a = this.active;
    var alpha = d ? 60 : 255;

    var bgValue = d ? 175 : this.backgroundColor + (a ? -15 : 0);
    fill(d ? 185 : bgValue, bgValue + (a ? 5 : 0), bgValue, alpha);
    rect(this.x, this.y, this.width, this.height);

    stroke(0, alpha);
    line(this.minSliderX, this.sliderY, this.maxSliderX, this.sliderY);

    var c = jsonClone(this.color); c[3] = d ? alpha / 3 : c[3];
    fill(c);
    ellipse(this.getSliderX(), this.sliderY, this.diameter, this.diameter);

    fill(0, alpha);
    strokeWeight(0);
    text(this.getDisplayValue(), this.minSliderX, this.y + this.height - this.sliderHeight - 1);

    pop();
}

Slider.prototype.onMousePressed = function () {
    if (this.disabled) return;

    this.mouseIsOver = dist(mouseX, mouseY, this.getSliderX(), this.sliderY) < this.radius;
    var within = function (val, min, max) { return min < val && val < max }
    this.active = within(mouseX, this.x, this.x + this.width) && within(mouseY, this.y, this.y + this.height);
}

Slider.prototype.onMouseDragged = function () {
    if (this.mouseIsOver) {
        var sliderX = confine(mouseX, this.minSliderX, this.maxSliderX);
        this.setValue(this.getValueFromSlider(sliderX));
    }
}

Slider.prototype.onKeyPressed = function () {
    if (!this.active) return;

    var value = this.sourceGet();
    var step = 1 / Math.pow(10, this.precision);

    if (keyCode === 37 || keyCode === 40) { // left or down
        this.setValue(value - step);
    } else if (keyCode === 38 || keyCode === 39) {
        this.setValue(value + step);
    }
}

Slider.prototype.getSliderX = function () {
    var range = this.maxSliderX - this.minSliderX;
    var magnitude = (this.sourceGet() - this.minValue) / (this.maxValue - this.minValue);
    return magnitude * range + this.minSliderX;
}

Slider.prototype.setValue = function (value) {
    value = confine(localRound(value, this.precision), this.minValue, this.maxValue);

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
    pv.setMag(pv.mag() * confine(bc.positionRatio + pr, 0, 1));
    var x = p.x + pv.x;
    var y = p.y + pv.y;

    // Rotation and length
    sv.rotate(radians(bc.angle + ar));
    sv.setMag(sv.mag() * (bc.lengthRatio + lr));

    // Weight
    var weight = p.weight * confine(bc.weightRatio + wr, 0, 1);

    return new Branch(x, y, sv, weight, color);
}

Tree.prototype.render = function () {
    for (var i = 0; i < this.branches.length; i++) {
        this.branches[i].render();
    }
}

Tree.prototype.onMousePressed = function () {
    this.mouseIsOver = dist(mouseX, mouseY, this.x, this.y) < 80;
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
    s = jsonClone(s);
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

    return parseInt(Math.round(num * pow)) / pow;
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

function confine(value, lowerLimit, upperLimit) {
    return max([min([value, upperLimit]), lowerLimit]);
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

Grid.prototype.getHeight = function () {
    return this.margin + (this.margin + this.items[0].height) * this.getNumRows();
}

var savedTrees = [
    {
        "iterations": 3,
        "branchConfigs":
        [
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
        "colorChange": [0, 0, 0, 0],
        "bgColor": 245,
        "x": 943,
        "y": 618
    },
    {
        "iterations": 8,
        "branchConfigs":
        [
            { "angle": 60, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.65 },
            { "angle": -60, "positionRatio": 1, "lengthRatio": 0.6, "weightRatio": 0.65 }
        ],
        "randomSelection": false,
        "trunkHeight": 240,
        "trunkWeight": 10,
        "trunkAngle": 0,
        "angleVariation": 0,
        "positionVariation": 0,
        "lengthVariation": 0,
        "weightVariation": 0,
        "trunkColor": [103, 196, 191, 256],
        "colorChange": [14, -14, 12, 0],
        "bgColor": 236,
        "x": 951,
        "y": 636
    },
    {
        "iterations": 7,
        "branchConfigs": [
            { "angle": 25, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.6 },
            { "angle": -25, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.6 },
            { "angle": 2, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.6 }
        ],
        "randomSelection": false,
        "trunkHeight": 129,
        "trunkWeight": 15,
        "trunkAngle": 0,
        "angleVariation": 20,
        "positionVariation": 0.05,
        "lengthVariation": 0.03,
        "weightVariation": 0.16,
        "trunkColor": [52, 52, 94, 256],
        "colorChange": [28, 11, 5, 0],
        "bgColor": 235,
        "x": 956,
        "y": 641
    },
    {
        "iterations": 12,
        "branchConfigs":
        [
            { "angle": 72, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.78 },
            { "angle": -23, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.78 }
        ],
        "randomSelection": false,
        "trunkHeight": 184,
        "trunkWeight": 18,
        "trunkAngle": 0,
        "angleVariation": 1,
        "positionVariation": 0,
        "lengthVariation": 0.04,
        "weightVariation": 0,
        "trunkColor": [50, 80, 90, 256],
        "colorChange": [15, 6, 2, 0],
        "bgColor": 236,
        "x": 908,
        "y": 635
    },
    {
        "iterations": 11,
        "branchConfigs":
        [
            { "angle": 25, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.61 },
            { "angle": -25, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.61 }
        ],
        "randomSelection": false,
        "trunkHeight": 117,
        "trunkWeight": 17,
        "trunkAngle": 0,
        "angleVariation": 11,
        "positionVariation": 0,
        "lengthVariation": 0.03,
        "weightVariation": 0,
        "trunkColor": [30, 69, 60, 256],
        "colorChange": [5, 21, 16, 0],
        "bgColor": 35,
        "x": 957,
        "y": 663
    },
    {
        "iterations": 8,
        "branchConfigs": [
            { "angle": 8, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.75 },
            { "angle": -8, "positionRatio": 0.72, "lengthRatio": 0.68, "weightRatio": 0.75 },
            { "angle": -3, "positionRatio": 0.9, "lengthRatio": 0.68, "weightRatio": 0.75 }
        ],
        "randomSelection": false,
        "trunkHeight": 174,
        "trunkWeight": 4,
        "trunkAngle": 0,
        "angleVariation": 14,
        "positionVariation": 0.03,
        "lengthVariation": 0.17,
        "weightVariation": 0.01,
        "trunkColor": [25, 63, 69, 256],
        "colorChange": [19, 15, 9, 0],
        "bgColor": 220,
        "x": 914,
        "y": 701
    },
    {
        "iterations": 11,
        "branchConfigs":
        [
            { "angle": 71, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.9 },
            { "angle": -12, "positionRatio": 1, "lengthRatio": 0.68, "weightRatio": 0.9 }
        ],
        "randomSelection": false,
        "trunkHeight": 169,
        "trunkWeight": 25,
        "trunkAngle": 0,
        "angleVariation": 1,
        "positionVariation": 0,
        "lengthVariation": 0.08,
        "weightVariation": 0,
        "trunkColor": [36, 74, 50, 256],
        "colorChange": [0, 4, 0, 0],
        "bgColor": 245,
        "x": 909,
        "y": 600
    },
    {
        "iterations": 12,
        "branchConfigs":
        [
            { "angle": 30, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.9 },
            { "angle": -30, "positionRatio": 1, "lengthRatio": 0.8, "weightRatio": 0.9 }
        ],
        "randomSelection": false,
        "trunkHeight": 100,
        "trunkWeight": 25,
        "trunkAngle": 0,
        "angleVariation": 15,
        "positionVariation": 0,
        "lengthVariation": 0.01,
        "weightVariation": 0,
        "trunkColor": [52, 52, 94, 256],
        "colorChange": [20, 11, 5, 0],
        "bgColor": 196,
        "x": 949,
        "y": 634
    },
    {
        "iterations": 10,
        "branchConfigs":
        [
            { "angle": 54, "positionRatio": 1, "lengthRatio": 0.76, "weightRatio": 0.75 },
            { "angle": -34, "positionRatio": 1, "lengthRatio": 0.76, "weightRatio": 0.75 }
        ],
        "randomSelection": false,
        "trunkHeight": 131,
        "trunkWeight": 17,
        "trunkAngle": 0,
        "angleVariation": 10,
        "positionVariation": 0,
        "lengthVariation": 0.04,
        "weightVariation": 0,
        "trunkColor": [187, 207, 185, 256],
        "colorChange": [-17, -22, -11, 0],
        "bgColor": 0,
        "x": 975,
        "y": 655
    },
    {
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
        "x": 947,
        "y": 639
    },
    {
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
        "trunkAngle": 1,
        "angleVariation": 0,
        "positionVariation": 0.09,
        "lengthVariation": 0,
        "weightVariation": 0.05,
        "trunkColor": [30, 59, 50, 256],
        "colorChange": [-4, 11, 17, 0],
        "bgColor": 245,
        "x": 942,
        "y": 667
    },
    {
        "iterations": 5,
        "branchConfigs": [
            { "angle": 9, "positionRatio": 0, "lengthRatio": 0.77, "weightRatio": 0.65 },
            { "angle": -9, "positionRatio": 0.5, "lengthRatio": 0.7, "weightRatio": 0.72 },
            { "angle": -6, "positionRatio": 0.78, "lengthRatio": 0.55, "weightRatio": 0.81 },
            { "angle": -13, "positionRatio": 0.28, "lengthRatio": 0.55, "weightRatio": 0.65 },
            { "angle": 0, "positionRatio": 0.08, "lengthRatio": 0.57, "weightRatio": 0.75 }
        ],
        "randomSelection": false,
        "trunkHeight": 346,
        "trunkWeight": 1,
        "trunkAngle": 3,
        "angleVariation": 0,
        "positionVariation": 0,
        "lengthVariation": 0,
        "weightVariation": 0,
        "trunkColor": [132, 130, 134, 256],
        "colorChange": [-9, -5, -2, 0],
        "bgColor": 245,
        "x": 945,
        "y": 683
    },
    {
        "iterations": 7,
        "branchConfigs": [
            { "angle": 60, "positionRatio": 1, "lengthRatio": 0.78, "weightRatio": 0.9 },
            { "angle": 180, "positionRatio": 0, "lengthRatio": 0.65, "weightRatio": 0.9 },
            { "angle": -60, "positionRatio": 0, "lengthRatio": 0.55, "weightRatio": 0.9 }
        ],
        "randomSelection": false,
        "trunkHeight": 136,
        "trunkWeight": 1,
        "trunkAngle": -60,
        "angleVariation": 0,
        "positionVariation": 0,
        "lengthVariation": 0,
        "weightVariation": 0,
        "trunkColor": [0, 0, 0, 256],
        "colorChange": [0, 0, 0, 0],
        "bgColor": 245,
        "x": 979,
        "y": 427
    },
    {
        "iterations": 7,
        "branchConfigs": [
            { "angle": 60, "positionRatio": 1, "lengthRatio": 0.74, "weightRatio": 0.9 },
            { "angle": 180, "positionRatio": 0, "lengthRatio": 0.4, "weightRatio": 0.9 },
            { "angle": -180, "positionRatio": 0, "lengthRatio": 0.71, "weightRatio": 0.9 }
        ],
        "randomSelection": false,
        "trunkHeight": 136,
        "trunkWeight": 1,
        "trunkAngle": 0,
        "angleVariation": 0,
        "positionVariation": 0,
        "lengthVariation": 0,
        "weightVariation": 0,
        "trunkColor": [0, 0, 0, 256],
        "colorChange": [0, 0, 0, 0],
        "bgColor": 245,
        "x": 935,
        "y": 410
    },
    {
        "iterations": 5,
        "branchConfigs": [
            { "angle": 45, "positionRatio": 1, "lengthRatio": 0.4, "weightRatio": 0.75 },
            { "angle": 45, "positionRatio": 0.56, "lengthRatio": 0.53, "weightRatio": 0.73 },
            { "angle": -45, "positionRatio": 0.42, "lengthRatio": 0.54, "weightRatio": 0.7 },
            { "angle": -40, "positionRatio": 1, "lengthRatio": 0.45, "weightRatio": 0.5 }
        ],
        "randomSelection": false,
        "trunkHeight": 350,
        "trunkWeight": 3,
        "trunkAngle": 0,
        "angleVariation": 0,
        "positionVariation": 0,
        "lengthVariation": 0,
        "weightVariation": 0,
        "trunkColor": [207, 114, 0, 256],
        "colorChange": [-30, -22, 21, 0],
        "bgColor": 245,
        "x": 951,
        "y": 695
    },
    {
        "iterations": 6,
        "branchConfigs": [
            { "angle": -9, "positionRatio": 1, "lengthRatio": 0.56, "weightRatio": 0.62 },
            { "angle": 16, "positionRatio": 0.38, "lengthRatio": 0.6, "weightRatio": 0.65 },
            { "angle": 9, "positionRatio": 0.17, "lengthRatio": 0.6, "weightRatio": 0.65 },
            { "angle": 4, "positionRatio": 0.6, "lengthRatio": 0.65, "weightRatio": 0.66 }
        ],
        "randomSelection": false,
        "trunkHeight": 300,
        "trunkWeight": 4,
        "trunkAngle": 0,
        "angleVariation": 0,
        "positionVariation": 0,
        "lengthVariation": 0,
        "weightVariation": 0,
        "trunkColor": [255, 205, 252, 256],
        "colorChange": [-30, 0, 0, 0],
        "bgColor": 244,
        "x": 927,
        "y": 689
    }
];

var sliderFactory = (function () {
    var main = [
        new Slider(0, 6, "Iterations", () => tree.iterations, v => tree.iterations = v),
        new Slider(1, 5, "Branch factor", () => tree.branchConfigs.length, updateBranchConfigsAndSliders),
        new Slider(100, 500, "Trunk length", () => tree.trunkHeight, v => tree.trunkHeight = v),
        new Slider(1, 25, "Trunk weight", () => tree.trunkWeight, v => tree.trunkWeight = v)
    ];

    var variation = [
        new Slider(0, 20, "Angle variation", () => tree.angleVariation, v => tree.angleVariation = v, 0, [225, 200, 212, 220]),
        new Slider(0, 0.3, "Pos. variation", () => tree.positionVariation, v => tree.positionVariation = v, 2, [225, 200, 212, 220]),
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
                        new Slider(0.0, 1.0, branchId + " Position ratio", () => tree.branchConfigs[i].positionRatio, v => tree.branchConfigs[i].positionRatio = v, 2, [180, 205, 218, 220]),
                        new Slider(0.1, .9, branchId + " Length ratio", () => tree.branchConfigs[i].lengthRatio, v => tree.branchConfigs[i].lengthRatio = v, 2, [180, 205, 218, 220]),
                        new Slider(0.5, .9, branchId + " Weight ratio", () => tree.branchConfigs[i].weightRatio, v => tree.branchConfigs[i].weightRatio = v, 2, [180, 205, 218, 220])
                    ];
                })(i);

                branchSliders = branchSliders.concat(group);
            }

            for (var i = tree.branchConfigs.length; i < 5; i++) {
                var branchId = "B" + (i + 1);

                var dummyGroup = [
                    new Slider(-180, 180, branchId + " Angle", () => 12, v => { }, 0, [180, 205, 228, 220]),
                    new Slider(0.0, 1.0, branchId + " Position ratio", () => 1, v => { }, 2, [180, 205, 218, 220]),
                    new Slider(0.4, .9, branchId + " Length ratio", () => 0.65, v => { }, 2, [180, 205, 218, 220]),
                    new Slider(0.5, .9, branchId + " Weight ratio", () => .7, v => { }, 2, [180, 205, 218, 220])
                ];

                for (var j = 0; j < dummyGroup.length; j++) {
                    dummyGroup[j].disabled = true;
                }

                branchSliders = branchSliders.concat(dummyGroup);
            }
            return branchSliders;
        }
    }
})();

function getWindowWidth() {
    return Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
    );
}

function getWindowHeight() {
    return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
    );
}