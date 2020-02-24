# Release Notes

## v1.12.0
* Add `ViewportUtils.getInitViewport` function to get a proper lng, lat, zoom from envelope
* Allow to build geometries with number arrays for easier number input. e.g. `new LineString([{x:0, y:0}, {x:10, y:10}])` becomes `LineString.fromNumbers([0, 0, 10, 10])`
* Implement query function on FeatureSource which allows to query features based on spatial relationship: `intersect`, `disjoint`, `within`, `overlap` and `touch`
* Add declare file (*.d.ts) for native register for better typescript support
* Fix a bug of a returning type is bind to another lib’s specific version, which makes typescript upstream project compile filed
* Add a strategy to auto break down values by its index position. Previously, it breaks down by value, when the maximum value is far away from the second large value, the effect is not good.
* Allow to create new delimited file with specified features.

## v1.9.0
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