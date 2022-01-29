
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// copy the contents of a float 32 js typed array into a std::vector<float> type. 
function typedFloat32Array2Vector(typedArray) {
  var vec = new essentiaExtractor.module.VectorFloat();
  for (var i=0; i<typedArray.length; i++) {
    if (typeof typedArray[i] === 'undefined') {
      vec.push_back(0);
    }
    else {
      vec.push_back(typedArray[i]);
    }
  }
  return vec;
}