//a code to classify sentinel2 composite for march and april into cover crops

//Cropland Data layer
var cdl = ee.ImageCollection('USDA/NASS/CDL');
var maumee = ee.FeatureCollection('users/kessi9400/Maumee_WGS84');

var training = ee.FeatureCollection('users/kessi9400/Training_data');
var validation = ee.FeatureCollection('users/kessi9400/Testing_data');

//print(training);

//function to generate annual cropland data layer
var annual_cdl = function(year){
  //var cdl = ee.ImageCollection('USDA/NASS/CDL');
  var corn = 1;
  var soybean = 5;
  var cdl_year = ee.Image(cdl.filter(ee.Filter.eq('system:index', String(year))).first()).select('cropland');
  var cdl_year_crop = cdl_year.eq(corn).or(cdl_year.eq(soybean)).updateMask(cdl_year.eq(corn).or(cdl_year.eq(soybean))).toFloat();
  var cdl_annual_clip = cdl_year_crop.clip(maumee);
  return(cdl_annual_clip);
};
//mask coud
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

//Annual Cropland data layer for corn and soybean
var cdl_2018 = annual_cdl(2018);
var getNDVIS2 = function(image){
  //var scaled = image.select(['B4_median', 'B8_median', 'B11_median', 'B12_median']);//.multiply(0.0001);
  var ndvi = image.normalizedDifference(['B8_median','B4_median']);
  var image1 = image.addBands(ndvi);
  //var image2 = image1.select(['B11_median','B12_median','nd']);
  return(image1);
};

var roi = ee.FeatureCollection('users/kessi9400/Maumee_WGS84');
//print(roi);

Map.addLayer(roi);

var yearrangeStart = 2019;
var yearrangeStop = 2020;

//images for october
var S2_oct = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2018-10-1', '2018-10-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
  
var S2_oct_med = ee.ImageCollection(S2_oct)
    .reduce(ee.Reducer.median());
var S2_oct_median = getNDVIS2(S2_oct_med);
    
//images for november
var S2_nov = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2018-11-1', '2018-11-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);

var S2_nov_med = ee.ImageCollection(S2_nov)
    .reduce(ee.Reducer.median());
var S2_nov_median = getNDVIS2(S2_nov_med);

//for december
var S2_dec = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2018-12-1', '2018-12-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
var S2_dec_med = ee.ImageCollection(S2_dec)
    .reduce(ee.Reducer.median());
var S2_dec_median = getNDVIS2(S2_dec_med);

//images for january
var S2_jan = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2019-01-1', '2019-01-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
var S2_jan_med = ee.ImageCollection(S2_jan)
    .reduce(ee.Reducer.median());
var S2_jan_median = getNDVIS2(S2_jan_med);
//images for february
var S2_feb = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2019-02-1', '2019-02-28').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
var S2_feb_med = ee.ImageCollection(S2_feb)
    .reduce(ee.Reducer.median());
var S2_feb_median = getNDVIS2(S2_feb_med);
//images for march
var S2_march = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2019-03-1', '2019-03-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
var S2_march_med = ee.ImageCollection(S2_march)
    .reduce(ee.Reducer.median());
var S2_march_median = getNDVIS2(S2_march_med);
//images for april
var S2_april = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2019-04-1', '2019-04-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds)
  .map(getNDVIS2);
var S2_april_med = ee.ImageCollection(S2_april)
    .reduce(ee.Reducer.median());
var S2_april_median = getNDVIS2(S2_april_med);


var rgbVis = {
  min: 0.0,
  max: 0.2,
  bands: ['B4_median', 'B3_median', 'B2_median'],
};

Map.addLayer( S2_oct_med, rgbVis, 'october_image') ;
Map.addLayer(S2_nov_med, rgbVis, 'november image');
Map.addLayer(S2_dec_med, rgbVis, 'december image');
Map.addLayer(S2_jan_med, rgbVis, 'january image');

// var dt = S2_april_med.date().format();
 //print(dt);

var S2_all = ee.ImageCollection.fromImages([S2_oct_median, S2_nov_median, S2_dec_median, S2_jan_median]);//, S2_feb_med, S2_march_med, S2_april_med]);
//print(S2_all);

var stackCollection = function(collection) {
  // Create an initial image.
  var first = ee.Image(collection.first()).select([]);

  // Write a function that appends a band to an image.
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};


var merged = stackCollection(S2_all);
//print(merged);

var merged = merged.updateMask(cdl_2018);

var bands = merged.bandNames();
//print(bands);


var training_data = merged.select(bands).sampleRegions({
  collection: training,
  properties: ['cover_crop'],
  scale: 10
});

//print('training_data', training_data);

//make a random forest classifier and train it
var rf_classifier = ee.Classifier.randomForest(100)
.train({
  features: training_data,
  classProperty: 'cover_crop',
  inputProperties: bands
  
});

var classified = merged.select(bands).classify(rf_classifier);
//print(classified);
var palette = [
  '00FF00',// cover crop (1)red
  'FF0000'//  no cover crop (2)green
];

var testing_data = merged.select(bands).sampleRegions({
  collection: validation,
  properties: ['cover_crop'],
  scale: 10
});
//classify the validation data
//var confMatrix = rf_classifier.confusionMatrix();
//print(confMatrix);
/*

//confusion matrix
var validated = testing_data.classify(rf_classifier);
//print(validated);
var test_accuracy = validated.errorMatrix('cover_crop','classification');
print('validation error matrix:', test_accuracy);
print('validation overall accuracy:', test_accuracy.accuracy());


Map.addLayer(classified, {min:1, max:2, palette: palette, maxPixels: 50000000000}, 'Cover crop classification');
/*
Export.image.toDrive({
  image: classified,
  description: 'covercrop_test',
  scale: 10,
  maxPixels: 5000000000,
  region: maumee
});

*/
print(classified);
var cover = classified.gte(1).rename('cover');
var non_cover = classified.gte(2).rename('non_cover');

print(cover);
print(non_cover);
Map.addLayer(cover);
Map.addLayer(non_cover);

//var classified_cover_crop = classified.select('1');
var scale = 10;
  var stats = classified.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  crs: 'EPSG:32617',
  scale: 10,
  maxPixels: 1E13
});
print(stats);
//var area = ee.Number(stats.get('constant')).multiply(scale).multiply(scale).divide(1000000);
 
print('Area of green vegetation in is ', area.getInfo(), ' km2');


