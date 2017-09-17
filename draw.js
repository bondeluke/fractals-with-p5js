var tree;
var sliders = [];

function setup() {
	frameRate(60);
	createCanvas(900, 700);
	
	var iterations = 12;
	var angle = 73;
	var multiplier = 0.65;
	var trunkHeight = 232;
	var sliderMargin = 10;
	var sliderLeft = sliderMargin;
	var sliderRight = width - sliderMargin - 180;
	
	tree = new Tree(width/2, height - 50, iterations, angle, multiplier);
		
	var iterationSlider = new Slider(sliderRight, height - sliderMargin - 60, 0, 12, "Iterations");
	iterationSlider.subscribeToValueChangeEvent(tree.setIterations.bind(tree));
	iterationSlider.setValue(iterations);
	
	var heightSlider = new Slider(sliderRight, height - sliderMargin*2 - 120, trunkHeight - 100, trunkHeight + 200, "Trunk height");
	heightSlider.subscribeToValueChangeEvent(tree.setTrunkHeight.bind(tree));
	heightSlider.setValue(trunkHeight)
	
	var angleSlider = new Slider(sliderLeft, height - sliderMargin - 60, 0, 180, "Angle");
	angleSlider.subscribeToValueChangeEvent(tree.setAngle.bind(tree));
	angleSlider.setValue(angle);
	
	var multiplierSlider = new Slider(sliderLeft, height - sliderMargin*2 - 120, 0.4, 0.8, "Multiplier", 2);
	multiplierSlider.subscribeToValueChangeEvent(tree.setMultiplier.bind(tree));
	multiplierSlider.setValue(multiplier)
	
	sliders = [iterationSlider, angleSlider, multiplierSlider, heightSlider];
}

function draw() {
	background(230);

	for(var i = 0; i < sliders.length; i++){
		sliders[i].onDraw();
	}
	
	tree.onDraw();
}

function mousePressed() {
	for(var i = 0; i < sliders.length; i++){
		sliders[i].onMousePressed();
	}
}

function mouseDragged() {
	for(var i = 0; i < sliders.length; i++){
		sliders[i].onMouseDragged();
	}
}

function Slider(xPos, yPos, minValue, maxValue, label, precision = 0){
	// Computed constants
	this.radius = this.diameter / 2;
	this.sliderHeight = this.diameter + this.margin * 2;
	
	// Instance variables
	this.x = xPos;
	this.y = yPos;
	this.minValue = minValue;
	this.maxValue = maxValue;
	var marginRadius = this.margin + this.radius;
	this.minSliderX = xPos + marginRadius;
	this.maxSliderX = xPos + this.width - marginRadius;
	this.sliderX = this.minSliderX + (this.maxSliderX - this.minSliderX) / 2;
	this.sliderY = yPos + this.height - marginRadius;
	this.label = label;
	this.precision = precision;
	this.valueChangeListeners = [];
}

Slider.prototype.height = 60;
Slider.prototype.width = 180;
Slider.prototype.margin = 5;
Slider.prototype.diameter = 30;
Slider.prototype.controlSizeRatio = 0.55;
Slider.prototype.controlColor = [220, 180, 200, 220];
Slider.prototype.backgroundColor = 240;

Slider.prototype.getValue = function(){
	var range = this.maxValue - this.minValue;
	var magnitude = (this.sliderX - this.minSliderX) / (this.maxSliderX - this.minSliderX);
	return (magnitude * range + this.minValue).toFixed(this.precision);
}

Slider.prototype.subscribeToValueChangeEvent = function(listener){
	this.valueChangeListeners.push(listener);
}

Slider.prototype.getDisplayValue = function() {
	return this.label + ": " + this.getValue().toString();
}

Slider.prototype.onDraw = function(){
	push();
	strokeWeight(1);
	fill(this.backgroundColor);
	rect(this.x, this.y, this.width, this.height);
	line(this.minSliderX, this.sliderY, this.maxSliderX, this.sliderY);
	fill(this.controlColor);
	ellipse(this.sliderX, this.sliderY, this.diameter, this.diameter);
	fill(0);
	text(this.getDisplayValue(), this.minSliderX, this.y + this.height - this.sliderHeight - 1);
	pop();
}

Slider.prototype.onMousePressed = function(){
	this.mouseIsOver = dist(mouseX, mouseY, this.sliderX, this.sliderY) < this.radius;
}

Slider.prototype.onMouseDragged = function(){
	if (this.mouseIsOver){
		this.setSliderX(max([min([mouseX, this.maxSliderX]), this.minSliderX]))
	}
}

Slider.prototype.setSliderX = function(newX){
	var oldValue = this.getValue();
		
	this.sliderX = newX;
		
	var newValue = this.getValue();
	
	if (oldValue != newValue){
		this.valueChangedEvent(newValue);
	}
}

Slider.prototype.valueChangedEvent = function(newValue){
	for(var i = 0; i < this.valueChangeListeners.length; i++){
		this.valueChangeListeners[i](newValue);
	}
}

Slider.prototype.getSliderXFromValue = function(value){
	var range = this.maxSliderX - this.minSliderX;
	var magnitude = (value - this.minValue) / (this.maxValue - this.minValue);
	return magnitude * range + this.minSliderX;
}

Slider.prototype.setValue = function(value){
	this.setSliderX(this.getSliderXFromValue(value));
}

function Branch(x, y, v, weight){
	this.x = x;
	this.y = y;
	this.v = v;
	this.x2 = x + v.x;
	this.y2 = y + v.y;
	this.weight = weight;
}

Branch.prototype.onDraw = function(){
	push();
	strokeWeight(this.weight);
	line(this.x, this.y, this.x2, this.y2);
	pop();
}

function Tree(xPos, yPos, iterations, angle, multiplier) {
	this.x = xPos;
	this.y = yPos;
	this.trunkHeight = 200;
	this.iterations = iterations;
	this.angle = angle; // in degrees;
	this.multiplier = multiplier;
	this.repopulateBranches();
}

Tree.prototype.repopulateBranches = function(){
	this.branches = [];
	var thicknessMultipler = 0.65
	var thickness = max(this.iterations * thicknessMultipler, 1);
	
	var v = createVector(0, -this.trunkHeight);
	var trunk = new Branch(this.x, this.y, v, thickness);
	var branchesToProcess = [trunk];
	var newBranches = [];
	
	for(var i = 0; i < this.iterations; i++){
		thickness = max(thickness * thicknessMultipler, 1);
		for(var j = 0; j < branchesToProcess.length; j++){
			var b = branchesToProcess[j];
			newBranches.push(this.createSprout(b, this.angle, thickness));
			newBranches.push(this.createSprout(b, -this.angle, thickness));
		}
		this.branches = this.branches.concat(branchesToProcess);
		branchesToProcess = newBranches;
		newBranches = [];
	}
	
	this.branches = this.branches.concat(branchesToProcess);
}

Tree.prototype.createSprout = function(branch, angle, thickness){
	debugger;
	var v = createVector(branch.v.x, branch.v.y);
	var r = 0;
	var newAngle = angle + r;
	v.rotate(radians(newAngle));
	v.setMag(v.mag() * this.multiplier);
	return new Branch(branch.x2, branch.y2, v, thickness);
}

Tree.prototype.onDraw = function(){
	for(var i = 0; i < this.branches.length; i++){
		this.branches[i].onDraw();
	}
}

Tree.prototype.setIterations = function(iterations){
	this.iterations = iterations;
	this.repopulateBranches();
}

Tree.prototype.setMultiplier = function(multiplier){
	this.multiplier = multiplier;
	this.repopulateBranches();
}

Tree.prototype.setAngle = function(angle){
	this.angle = angle;
	this.repopulateBranches();
}

Tree.prototype.setTrunkHeight = function(height){
	this.trunkHeight = height;
	this.repopulateBranches();
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}