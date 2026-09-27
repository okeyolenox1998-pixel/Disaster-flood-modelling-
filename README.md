# Nairobi Urban Flood Inundation Mapping

## Overview
This repository contains a Google Earth Engine script designed to model urban flood inundation across Nairobi City County. By combining multi-temporal Sentinel-1 Synthetic Aperture Radar (SAR) imagery with a CART machine learning classifier, the workflow maps landcover types and highlights vulnerable zones affected by heavy seasonal rainfall.

## Urban Storytelling & Lens Response
> **Application Prompt:** *Please briefly describe your past experiences in telling the story about heritage or a city through your lens and the role you played in it.*

Through the lens of geospatial analytics and cloud-based remote sensing, this project narrates the story of Nairobi’s urban vulnerability to extreme hydrological events. Rapid infrastructure expansion frequently intersects with natural drainage paths, increasing risk for vulnerable urban populations. 

Using multi-temporal Sentinel-1 C-band SAR data capturing the historic 2018 MAM long rains, I designed an analytical workflow to isolate flood extents and classify urban landscapes. My role involved developing the end-to-end processing script in Google Earth Engine—from dual-polarization (VV + VH) speckle filtering and thresholding to training a supervised CART classifier and exporting high-resolution geospatial classification layers for disaster risk reduction applications.

## Technical Architecture & Workflow
* **Platform:** Google Earth Engine (JavaScript API)
* **Data Sources:** Sentinel-1 Ground Range Detected (GRD) imagery, custom Regional of Interest (ROI) boundaries.
* **Methodology:** Dual-band backscatter combination, spatial focal mean speckle reduction, and supervised CART classification.
* **Target Classes:** 
  1. Permanent Water (Blue)
  2. Flooded Water (Cyan)
  3. Urban Infrastructure (Red)
  4. Flood Channels (Orange)
  5. Low Vegetation (Green)
* **Outputs:** GeoTIFF raster export tasks configured for Google Drive integration.

## Repository Files
* `nairobi_flood_mapping.js`: The primary execution script for Earth Engine.
