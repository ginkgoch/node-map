# Release Note

## v1.12
* Add `ViewportUtils.getInitViewport` function to get a proper lng, lat, zoom from envelope
* Allow to build geometries with number arrays for easier number input. e.g. `new LineString([{x:0, y:0}, {x:10, y:10}])` becomes `LineString.fromNumbers([0, 0, 10, 10])`
* Implement query function on FeatureSource which allows to query features based on spatial relationship: `intersect`, `disjoint`, `within`, `overlap` and `touch`
* Add declare file (*.d.ts) for native register for better typescript support
* Fix a bug of a returning type is bind to another lib’s specific version, which makes typescript upstream project compile filed
* Add a strategy to auto break down values by its index position. Previously, it breaks down by value, when the maximum value is far away from the second large value, the effect is not good.
* Allow to create new delimited file with specified features.

## v1.11
* Add a set of APIs for building geometries with number arrays
* Add declare files for better compatible for Typescript
* Add algorithm to breakdown values by position
* Add options as parameter overload instead of using many parameters
* Add CSV file creation support
* Fix query disjoint features not support bug

## v1.10
* Add getInitViewport for better compatible working with Leaflet

## v1.9
* Support to set antialias
* Support to plot labels in polygon interior point - affect drawing * performance currently
* Support to compress coordinates for viewport
* Support to adjust envelope based on viewport size
* Support rendering in electron
* Support multi-source feature layer
* Support fill area with pattern
* Support draw lines with line dash
* Refactor FeatureLayer inheritance
* Improve drawing quality
* Improve drawing performance by avoid unnecessary steps (projection * etc.)
* Improve envelope() returns a concrete type instead of interface

## v1.8
* Add CRUD shapefile support
* Bug fix for geom and shapefile

## v1.7
* Add dynamicFields for link dynamic data for feature source
* Add createEmpty function on ShapefileFeatureSource
* Fix a performance bug for drawing large shapefile

## v1.6
* Simplify native code registration for cross platform
* Add GeoJSO support
* Add CSV support
* Minor bugs fix

## v1.5
* Improve API and fill documents
* Fix prj file is not load correctly

## v1.4
* Add scale level on MapEngine
* Add XYZMap class for building tiled map service with XYZ standard
* Shapefile automatically load *.prj file if exists
* Add visible property on layer
* Add LayerFactory to build layers with URL
* Add RGBA color support
* Add intersection function on MapEngine
* Add index for shapefile for better querying performance
* Remove the projection WKT last invalid char
* Serialization bug fix
* Add margin on Style for better label rendering

## v1.3
* Add JSON conversion for almost all resources
* Add MemoryFeatureSource to support to manage features in memory
* Minor bugs fix

## v1.2
* Add LayerGroup for batch rendering multiple layers
* Add MapEngine for unified management of layers and rendering
* Minor performance improvement

## v1.1
* Extract shared interface canvas for cross platform
* Extract shared interface image for cross platform
* Add ShapefileFeatureSource support and test
* Add Colors to generate random and gradient colors easily
* Add PropertyAggregator
* Add ValueStyle for rendering based on values
* Add ClassBreakStyle for rendering based on breakdown values

## v1.0
Generally Support following features
* Geometry
* Feature
* FeatureSource
* FeatureLayer
* Renderer
* Style