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

var outline = ee.Image().byte().paint({
  featureCollection: roi,
  color:1,
  width:3
});


//images for october
var S2 = ee.ImageCollection('COPERNICUS/S2').filterBounds(roi).filterDate('2018-03-01', '2018-03-28').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2clouds);
print(S2);
var S2_median = S2.reduce(ee.Reducer.median());
var rgbVism = {
  min: 0.0,
  max: 0.2,
  bands: ['B4_median', 'B3_median', 'B2_median'],
};
Map.addLayer(S2_median,rgbVism);
print(S2_median);
var list = S2.toList(S2.size());
print(list);

var image1 = ee.Image(list.get(0));
var image2 = ee.Image(list.get(1));
var image3 = ee.Image(list.get(2));
var image4 = ee.Image(list.get(3));
var image5 = ee.Image(list.get(4));
var image6 = ee.Image(list.get(5));
var image7 = ee.Image(list.get(6));
var image8 = ee.Image(list.get(7));
var image9 = ee.Image(list.get(8));
var image10 = ee.Image(list.get(9));
var image11 = ee.Image(list.get(10));
var image12 = ee.Image(list.get(11));
var image13 = ee.Image(list.get(12));

var rgbVis = {
  min: 0.0,
  max: 0.2,
  bands: ['B4', 'B3', 'B2'],
};
print(image1);

/*
Map.addLayer(image1, rgbVis, 'image1');
Map.addLayer(image2, rgbVis, 'image2');
Map.addLayer(image3, rgbVis, 'image3');
Map.addLayer(image4, rgbVis, 'image4');
Map.addLayer(image5, rgbVis, 'image5');
Map.addLayer(image6, rgbVis, 'image5');
Map.addLayer(image7, rgbVis, 'image6');
Map.addLayer(image8, rgbVis, 'image7');
Map.addLayer(image9, rgbVis, 'image8');
Map.addLayer(image10, rgbVis, 'image9');
Map.addLayer(image11, rgbVis, 'image11');
Map.addLayer(image12, rgbVis, 'image12');

*/

Map.addLayer(outline, {palette:['red']},'Maumee watershed');

