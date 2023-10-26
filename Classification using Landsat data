//code to harmonize TM (Landsat 5) and ETM+ (Landsat 7) to OLI (Landsat 8)
var data = ee.FeatureCollection('users/kessi9400/Cover_non_cover_digitized_combined');
var withRandom = data.randomColumn('random');
var split = 0.7;

var training = withRandom.filter(ee.Filter.lt('random', split));
var validation = withRandom.filter(ee.Filter.gte('random',split));
print(training);
print(validation);
var roi = ee.FeatureCollection('users/kessi9400/Maumee_WGS84');

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
var cdl_2014 = annual_cdl(2014);
var cdl_2013 = annual_cdl(2013);
var cdl_2012 = annual_cdl(2012);
var cdl_2011 = annual_cdl(2011);
var cdl_2010 = annual_cdl(2010);
var cdl_2009 = annual_cdl(2009);
var cdl_2008 = annual_cdl(2008);
var cdl_2007 = annual_cdl(2007);
var cdl_2006 = annual_cdl(2006);
var cdl_2005 = annual_cdl(2005);


//for landsat
var getNDVI7 = function(image) {
  var ndvi = image.normalizedDifference(['NIR', 'Red']).rename("ndvi");
  var ngrdi = image.normalizedDifference(['Green','Red']).rename("ngrdi");
  var dvi = image.select('NIR').subtract(image.select('Red')).rename('dvi');
  var rvi = image.select('NIR').divide(image.select('Red')).rename('rvi');
  var image1 = image.addBands(ndvi);
  var image2 = image1.addBands(ngrdi);
  var image3 = image2.addBands(dvi);
  var image4 = image3.addBands(rvi);
  var image5 = image4.select(['Red','SWIR1','SWIR2','ndvi','ngrdi','dvi','rvi']);
  return(image5); 
  
};




var coefficients = {itcps: ee.Image.constant([0.0003, 0.0088, 0.0061, 0.0412, 0.0254, 0.0172])
.multiply(10000),
slopes: ee.Image.constant([0.8474, 0.8483, 0.9047, 0.8462, 0.8937, 0.9071])
};

// Function to get and rename bands of interest from OLI.
function renameOli(img) {
  return img.select(
      ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'pixel_qa'],
      ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2', 'pixel_qa']);
}

// Function to get and rename bands of interest from ETM+.
function renameEtm(img) {
  return img.select(
      ['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'pixel_qa'],
      ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2', 'pixel_qa']);
}


function etmToOli(img) {
  return img.select(['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2'])
      .multiply(coefficients.slopes)
      .add(coefficients.itcps)
      .round()
      .toShort()
      .addBands(img.select('pixel_qa'));
}

//cloud masking
function fmask(img) {
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;
  var qa = img.select('pixel_qa');
  var mask = qa.bitwiseAnd(cloudShadowBitMask)
                 .eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return img.updateMask(mask);
}

//combine functions
// Define function to prepare OLI images.
function prepOli(img) {
  var orig = img;
  img = renameOli(img);
  img = fmask(img);
  //img = calcNbr(img);
  return ee.Image(img.copyProperties(orig, orig.propertyNames()));
}

// Define function to prepare ETM+ images.
function prepEtm(img) {
  var orig = img;
  img = renameEtm(img);
  img = fmask(img);
  img = etmToOli(img);
  //img = calcNbr(img);
  return ee.Image(img.copyProperties(orig, orig.propertyNames()));
}


//Retrieve Landsat sensor collections
var oliCol = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR');
var etmCol = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR');
var tmCol = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR');

//Define image collection fiter

function forfilter(start_date, end_date){
  var colFilter = ee.Filter.and(
    ee.Filter.bounds(roi), ee.Filter.date(start_date, end_date),
    ee.Filter.lt('CLOUD_COVER', 50), ee.Filter.lt('GEOMETRIC_RMSE_MODEL', 10),
    ee.Filter.or(
        ee.Filter.eq('IMAGE_QUALITY', 9),
        ee.Filter.eq('IMAGE_QUALITY_OLI', 9)));
  
  return colFilter;
}

        
//Prepare the collections
// Filter collections and prepare them for merging.

//training on 2018-19 season
var cf18_oct = forfilter('2018-10-01', '2018-12-30');
var oliCol18_oct = oliCol.filter(cf18_oct).map(prepOli);
/*
var etmCol18_oct = etmCol.filter(cf18_oct).map(prepEtm).map(function(image){
  var filled = image.focal_mean(2, 'square','pixels',1);
  return filled.blend(image);
});
*/
var etmCol18_oct = oliCol18_oct;
var etmCol18_oct_med = ee.ImageCollection(etmCol18_oct).map(getNDVI7).reduce(ee.Reducer.median());


var cf18_feb = forfilter('2019-01-01', '2019-03-30');
var oliCol18_feb = oliCol.filter(cf18_feb).map(prepOli);
/*
var etmCol18_feb = etmCol.filter(cf18_feb).map(prepEtm).map(function(image){
  var filled = image.focal_mean(2, 'square','pixels',1);
  return filled.blend(image);
});
*/
var etmCol18_feb = oliCol18_feb;
var etmCol18_feb_med = ee.ImageCollection(etmCol18_feb).map(getNDVI7).reduce(ee.Reducer.median());

var etm_18 = ee.ImageCollection.fromImages([etmCol18_oct_med, etmCol18_feb_med]);

//classification on other seasons
var cf08_oct = forfilter('2015-10-01', '2015-12-30');
var oliCol08_oct = oliCol.filter(cf08_oct).map(prepOli);
/*
var etmCol08_oct = etmCol.filter(cf08_oct).map(prepEtm).map(function(image){
  var filled = image.focal_mean(2, 'square','pixels',1);
  return filled.blend(image);
});
*/
var etmCol08_oct = oliCol08_oct;
var etmCol08_oct_med = ee.ImageCollection(etmCol08_oct).map(getNDVI7).reduce(ee.Reducer.median());


var cf08_feb = forfilter('2016-01-01', '2016-03-30');
var oliCol08_feb = oliCol.filter(cf08_feb).map(prepOli);
/*
var etmCol08_feb = etmCol.filter(cf08_feb).map(prepEtm).map(function(image){
  var filled = image.focal_mean(2, 'square','pixels',1);
  return filled.blend(image);
});
*/
var etmCol08_feb = oliCol08_oct;
var etmCol08_feb_med = ee.ImageCollection(etmCol08_feb).map(getNDVI7).reduce(ee.Reducer.median());

var etm_08 = ee.ImageCollection.fromImages([etmCol08_oct_med, etmCol08_feb_med]);


var stackCollection = function(collection) {
  // Create an initial image.
  var first = ee.Image(collection.first()).select([]);

  // Write a function that appends a band to an image.
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};

var merged18 = stackCollection(etm_18);
var merged08 = stackCollection(etm_08);
//print(merged08);
///Map.addLayer(merged08);
//Map.addLayer(cdl_2012);
var merged18 = merged18.updateMask(cdl_2018);
var merged08 = merged08.updateMask(cdl_2015);
//print(merged18);

var bands1 = merged18.bandNames();
print(merged18);
var bands2 = merged08.bandNames();

var training_data = merged18.select(bands1).sampleRegions({
  collection: training,
  properties: ['cover_type'],
  scale: 30,
  geometries: true
});
print(training_data);
//make a random forest classifier and train it
var rf_classifier = ee.Classifier.randomForest(100)
.train({
  features: training_data,
  classProperty: 'cover_type',
  inputProperties: bands1
  
});



var classified = merged18.select(bands1).classify(rf_classifier);
//print(classified);
var palette = [
  '00FF00',// cover crop (1)red
  'FF0000'//  no cover crop (2)green
];

var t = merged18.select(bands1).sampleRegions({
  collection:training,
  properties:['cover_type'],
  scale:30
});
print(t);

var testing_data = merged18.select(bands1).sampleRegions({
  collection: validation,
  properties: ['cover_type'],
  scale: 30
});
//classify the validation data
var confMatrix = rf_classifier.confusionMatrix();
print(confMatrix);
print('training_accuracy', confMatrix.accuracy());


//confusion matrix
print(testing_data);
var validated = testing_data.classify(rf_classifier);
//print(validated);
var test_accuracy = validated.errorMatrix('cover_type','classification');
print('validation error matrix:', test_accuracy);
print('validation overall accuracy:', test_accuracy.accuracy());

Map.addLayer(roi);
Map.addLayer(classified, {min:1, max:2, palette: palette, maxPixels: 50000000000}, 'Cover crop classification');

Export.image.toDrive({
  image: classified,
  description: 'L8_classified_2008_09',
  scale: 30,
  maxPixels: 5000000000,
  region: maumee
});
//tmCol = tmCol.filter(cf).map(prepEtm);

// Merge the collections.
//var col = oliCol.merge(etmCol).merge(tmCol);
/*
var test = ee.ImageCollection(etmCol).reduce(ee.Reducer.median());
var rgbVis = {
  min: 0.0,
  max: 3000,
  bands: ['Red_median', 'Green_median', 'Blue_median'],
};
Map.addLayer(test, rgbVis);

print(etmCol);
*/



