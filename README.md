# Winter Cover Crop Mapping

Historical research code for mapping winter cover crops in the Western Lake Erie Basin using Google Earth Engine (GEE).

This repository contains Google Earth Engine scripts developed for previous research on mapping winter cover crops across the Maumee River watershed. We used Sentinel-2 and Landsat imagery, vegetation indices, and random forest classification. The repository is preserved as a reference resource for students and researchers who wish to understand, reuse, or extend the existing workflows.

> **Repository status: Historical research code.** The scripts are preserved for future reference and are not actively maintained. Compatibility with current software, datasets, and Google Earth Engine assets has not necessarily been verified.

## Overview

The repository includes scripts and workflows related to:

- Building cloud-masked fall and winter image composites from Sentinel-2 and Landsat.
- Harmonizing Landsat 5 (TM) and Landsat 7 (ETM+) to Landsat 8 (OLI).
- Calculating vegetation indices such as NDVI, NGRDI, DVI and RVI.
- Restricting the analysis to corn and soybean fields using the USDA NASS Cropland Data Layer (CDL).
- Classifying cover crop vs. no cover crop with random forest and assessing accuracy with confusion matrices.
- Exploring cover crop phenology through vegetation index time series.

The scripts may provide a useful starting point for understanding previous analyses and developing new cover crop mapping workflows.

## General Workflow

1. Define the study area (Maumee River watershed boundary).
2. Build cloud-masked median composites for the fall (October–December) and late winter/early spring (January–April) of each season.
3. Add vegetation indices as classification features.
4. Mask the composites to corn and soybean fields using the CDL.
5. Train a random forest classifier on digitized cover / no cover crop samples.
6. Validate with held-out samples (confusion matrix, overall accuracy) and visual assessment.
7. Export classified maps to Google Drive.

## Repository Contents

All scripts are Google Earth Engine JavaScript and are run in the [GEE Code Editor](https://code.earthengine.google.com/).

| File | Description |
|---|---|
| `classification_script_first_draft` | First version of the Sentinel-2 cover crop classification, with training/testing data, random forest classification, NDVI time series charts, and exports. |
| `Classification_script_second_draft` | Revised classification using two median composites per season (October–December and January–March), with cover and no cover crop training polygons digitized from the composites. |
| `Classification with_single_composites` | Classification based on a single seasonal Sentinel-2 composite for each season from 2015–16 to 2018–19. |
| `Classification using Landsat data` | Landsat-based classification, including harmonization of Landsat 5 and 7 to Landsat 8 and cloud masking. |
| `Phenology of cover crops` | Vegetation index time series for cover crop and no cover crop fields across the 2018–19 season. |
| `classification_visual_assessment` | Monthly Sentinel-2 composites (October 2018–March 2019) for visually checking classification results. |
| `Image_from_Image_collection` | Utility for pulling individual images out of a Sentinel-2 image collection for inspection. |
| `Multiyear_based_classification` | Incomplete outline of a multi-year (2015–2017) Landsat classification. Not runnable as is. |

Please inspect each script to understand its specific inputs, assumptions, dependencies, and expected outputs before using it.

### Notes for reuse

- **Private assets:** the scripts load assets from the author's Earth Engine account (`users/kessi9400/...`), such as the watershed boundary and training/validation data. These may not be accessible to others; replace them with your own assets.
- **Retired datasets:** some datasets used here have since been deprecated in Earth Engine:
  - Landsat Collection 1 (`LANDSAT/.../C01/T1_SR`) has been replaced by Collection 2 (e.g., `LANDSAT/LC08/C02/T1_L2`), which uses different band names and scaling.
  - `COPERNICUS/S2` has been superseded by `COPERNICUS/S2_HARMONIZED`.
- **Classifier:** `ee.Classifier.randomForest` is deprecated; use `ee.Classifier.smileRandomForest`.
- **Embedded geometries:** some scripts include hand-digitized training polygons in their imports section, which makes the files large.
- **Running a script:** copy its contents into a new script in the GEE Code Editor and click **Run**.

## Technologies

The project uses or may depend on the following technologies:

- **Google Earth Engine** — satellite imagery processing and geospatial analysis.
- **Sentinel-2 and Landsat 5/7/8** — optical satellite imagery.
- **USDA NASS Cropland Data Layer** — crop type masks.
- **Random forest classification** — cover crop vs. no cover crop mapping.

Specific dataset requirements may differ between scripts.

## Author

Kushal KC, The Ohio State University
