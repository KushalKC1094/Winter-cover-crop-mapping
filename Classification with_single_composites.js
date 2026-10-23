//based on single composite
var roi = ee.FeatureCollection('users/kessi9400/Maumee_WGS84');
var data = ee.FeatureCollection('users/kessi9400/Cover_non_cover_digitized_combined');

print(data);

var withRandom = data.randomColumn('random');
var split = 0.7;

var training = withRandom.filter(ee.Filter.lt('random', split));
var validation = withRandom.filter(ee.Filter.gte('random',split));



//Cropland Data layer
var cdl = ee.ImageCollection('USDA/NASS/CDL');
var maumee = ee.FeatureCollection('users/kessi9400/Maumee_WGS84');

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

//Annual Cropland data layer for corn and soybean
var cdl_2019 = annual_cdl(2019);
var cdl_2018 = annual_cdl(2018);
var cdl_2017 = annual_cdl(2017);
var cdl_2016 = annual_cdl(2016);
var cdl_2015 = annual_cdl(2015);

//for sentinel
var getNDVIS2 = function(image){
  //var scaled = image.select(['B4_median', 'B8_median', 'B11_median', 'B12_median']);//.multiply(0.0001); //already scaled while cloud masking
  var ndvi = image.normalizedDifference(['B8','B4']).rename("ndvi");
  var ngrdi = image.normalizedDifference(['B3','B4']).rename('ngrdi');
  var dvi = image.select('B8').subtract(image.select('B4')).rename('dvi');
  var rvi = image.select('B8').divide(image.select('B4')).rename('rvi');
  var image1 = image.addBands(ndvi);
  var image2 = image1.addBands(ngrdi);
  var image3 = image2.addBands(dvi);
  var image4 = image3.addBands(rvi);
  var image5 = image4.select(['B4','B5','B11','B12','ndvi','ngrdi','dvi','rvi']);
  return(image5);
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

var roi = ee.FeatureCollection('users/kessi9400/Maumee_WGS84');
//print(roi);
Map.addLayer(roi);

//for 2018-19 season
var composite18 = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2018-10-01', '2019-03-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
var composite18_indices = composite18.map(getNDVIS2); 
var composite18_median = ee.ImageCollection(composite18_indices)
    .reduce(ee.Reducer.median());
//for 2015-16 season
var composite15 = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2016-04-01', '2016-04-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
var composite15_indices = composite15.map(getNDVIS2); 
var composite15_median = ee.ImageCollection(composite15_indices)
    .reduce(ee.Reducer.median());

//for 2016-17 season
var composite16 = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2016-10-01', '2017-03-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
var composite16_indices = composite16.map(getNDVIS2); 
var composite16_median = ee.ImageCollection(composite16_indices)
    .reduce(ee.Reducer.median());

//for 2017-18 season
var composite17 = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2017-10-01', '2018-03-30').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
var composite17_indices = composite17.map(getNDVIS2); 
var composite17_median = ee.ImageCollection(composite17_indices)
    .reduce(ee.Reducer.median());

var rgbVis = {
  min: 0.0,
  max: 0.2,
  gamma: [1, 1.6, 1],
  bands: ['B4_median', 'B3_median', 'B2_median'],
};

var comp2018 = composite18_median.updateMask(cdl_2018);
var comp2015 = composite15_median.updateMask(cdl_2015);
var comp2016 = composite16_median.updateMask(cdl_2016);
var comp2017 = composite17_median.updateMask(cdl_2017);
/*
Map.addLayer(comp2018, rgbVis, 'composite18');
Map.addLayer(comp2015, rgbVis, 'composite15');
Map.addLayer(comp2016, rgbVis, 'composite16');
Map.addLayer(comp2017, rgbVis, 'composite17');
*/




var bands1 = comp2018.bandNames();
var bands2 = comp2017.bandNames();

var training_data = comp2018.select(bands1).sampleRegions({
  collection: training,
  properties: ['cover_type'],
  scale: 10
});

print('training_data', training_data);

//make a random forest classifier and train it
var rf_classifier = ee.Classifier.randomForest(100)
.train({
  features: training_data,
  classProperty: 'cover_type',
  inputProperties: bands1
  
});

var classified = comp2017.select(bands2).classify(rf_classifier);
//print(classified);
//Map.addLayer(classified,{min:0,max:100,palette:"white,gray,black"},"primitive");

var palette = [
  '00FF00',// cover crop (1)red
  'FF0000'//  no cover crop (2)green
];


var testing_data = comp2018.select(bands1).sampleRegions({
  collection: validation,
  properties: ['cover_type'],
  scale: 10
});
//classify the validation data
var confMatrix = rf_classifier.confusionMatrix();
print(confMatrix);
print('training_accuracy', confMatrix.accuracy());

//confusion matrix
var validated = testing_data.classify(rf_classifier);


//print(validated);
var test_accuracy = validated.errorMatrix('cover_type','classification');
print('validation error matrix:', test_accuracy);
print('validation overall accuracy:', test_accuracy.accuracy());


Map.addLayer(classified, {min:1, max:2, palette: palette, maxPixels: 50000000000}, 'Cover crop classification');


Export.image.toDrive({
  image: classified,
  description: 'covercrop_classified_2018_19',
  scale: 10,
  maxPixels: 5000000000,
  region: maumee
});


