//Load sentinel-1 c-band SAR Ground Range collection (log scale, VV, ascending)
var collection = ee.ImageCollection('COPERNICUS/S1_GRD')
     .filter(ee.Filter.eq('instrumentMode', 'IW'))
     .filter(ee.Filter.or(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'),ee.Filter.eq('orbitProperties_pass', 'DESCENDING')))
     .filterMetadata('resolution_meters', 'equals', 10)
     .filterBounds(roi)
     .select('VV', 'VH');
     
     // --- Date windows updated to capture the historic 2018 MAM floods ---
     var before = collection.filterDate('2018-01-01', '2018-02-28').mosaic();
     var after = collection.filterDate('2018-04-15', '2018-05-31').mosaic();
     
     // Display map
     Map.centerObject(roi, 11);
     Map.addLayer(before, {min: -15, max: 0}, 'before flood', 0);
     Map.addLayer(after, {min: -55, max: 0}, 'after flood', 0);
     
     //Apply filter to reduce speckle
     var SMOOTHING_RADIUS = 50;
     var before_filtered = before.focal_mean(SMOOTHING_RADIUS, 'circle','meters');
     var after_filtered = after.focal_mean(SMOOTHING_RADIUS, 'circle','meters');
     
     //Display filtered images
     Map.addLayer(before_filtered, {min: -15, max: 0}, 'Before Flood Filtered', 0);
     Map.addLayer(after_filtered, {min: -55, max: 0}, 'After Flood Filtered', 0);
     
     // --- Thresholds for each polarization ---
     var WATER_THRESHOLD_VH = -16;
     var WATER_THRESHOLD_VV = -10; 
     
     // --- Separate VH and VV bands from filtered composites ---
     var before_VH = before_filtered.select('VH');
     var before_VV = before_filtered.select('VV');
     var after_VH  = after_filtered.select('VH');
     var after_VV  = after_filtered.select('VV');
     
     // --- Classify water in each band, before and after ---
     var water_before_VH = before_VH.lt(WATER_THRESHOLD_VH);
     var water_before_VV = before_VV.lt(WATER_THRESHOLD_VV);
     var water_after_VH  = after_VH.lt(WATER_THRESHOLD_VH);
     var water_after_VV  = after_VV.lt(WATER_THRESHOLD_VV);

     // --- Combine bands: a pixel is 'water' only if BOTH bands agree ---
     var water_before_combined = water_before_VH.and(water_before_VV);
     var water_after_combined  = water_after_VH.and(water_after_VV);
     
     // --- Extract flood inundation (new water only) ---
     var flood_inundation = water_after_combined.and(water_before_combined.not());
     
     // --- Clean up speckle noise ---
     var flood_cleaned = flood_inundation
       .updateMask(flood_inundation)
       .connectedPixelCount(8, true)
       .gte(4);
       
     // --- Display Filtered Backgrounds (Clipped to Shapefile) ---
     Map.addLayer(before_filtered.clip(roi), {min: -15, max: 0}, 'Before Flood Filtered', 0);
     Map.addLayer(after_filtered.clip(roi), {min: -55, max: 0}, 'After Flood Filtered', 0);

     // --- Display Final Cleaned Flood ---
     Map.addLayer(flood_cleaned.updateMask(flood_cleaned).clip(roi), 
                  {palette: ['0000FF']}, 
                  'Flood Inundation Map (VH + VV)');

     Map.addLayer(roi, {color: 'red'}, 'Nairobi roi Boundary');
     
// =========================================================================
// 2. MACHINE LEARNING SETUP (CART CLASSIFIER)
// =========================================================================

var newfc = open_water_permanent
  .merge(open_water_flooded)
  .merge(urban)
  .merge(flood_channel)
  .merge(low_vegetation);

var finalImg = ee.Image.cat(before_filtered, after_filtered);
var bands = ['VV', 'VH', 'VV_1', 'VH_1']; 

var training = finalImg.select(bands).sampleRegions({
  collection: newfc,
  properties: ['landcover'],
  scale: 10 
});

var classifier = ee.Classifier.smileCart().train({
  features: training,
  classProperty: 'landcover',
  inputProperties: bands
});

// =========================================================================
// 3. RUN CLASSIFICATION & DISPLAY
// =========================================================================

var classified = finalImg.select(bands).classify(classifier);

Map.addLayer(classified.clip(roi), {
  min: 1, 
  max: 5, 
  palette: ['0000FF', '00FFFF', 'FF0000', 'FFA500', '00FF00']
}, 'Machine Learning Classification');

print('CART Error Matrix: ', classifier.confusionMatrix());
print('CART Overall Accuracy: ', classifier.confusionMatrix().accuracy());

// =========================================================================
// 4. EXPORT TO GOOGLE DRIVE
// =========================================================================

Export.image.toDrive({
  image: classified.clip(roi),
  description: 'Nairobi_ML_Flood_Classification_2018',
  scale: 10,
  region: roi.geometry(),
  maxPixels: 1e13
});
