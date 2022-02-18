
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timeDiff() {
  const secDiff = (Date.now()-startTime) / 1000;
  startTime = Date.now();
  return "0."+Math.floor(secDiff/60)+"."+Math.floor(secDiff%60);
}

function indexOfMax(arr) {

  if (arr.length === 0) {
      return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
          maxIndex = i;
          max = arr[i];
      }
  }

  return maxIndex;
}

function mostFrequent(arr){

  let obj = {};
  let maxVal;
  let maxOcc;

  for(let val of arr){
    obj[val] = ++obj[val] || 1;
    if(maxOcc === undefined || obj[val] > maxOcc){
        maxVal = val;
        maxOcc = obj[val];
    }
  }
  return maxVal;
}

Array.prototype.rotate = function(n) {
  n = n % this.length;
  while (this.length && n < 0) n += this.length;
  this.push.apply(this, this.splice(0, n));
  return this;
}

function getObjectKeyByPrefix(obj, name){
  if (typeof obj !== "object") {
      throw new Error("object is required!");
  }
  for (var prop in obj) {
      if (prop.indexOf(name) === 0){
          return prop;
      }
  }
  return "no such property!";
}