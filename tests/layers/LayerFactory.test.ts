import { LayerFactory, ShapefileFeatureSource, MemoryFeatureSource } from "../../src/layers";

describe('LayerFactory', () => {
    it('url', () => {
        let url = new URL('HTTPS://~/Downloads/cntry02.shp?q=key1,key2&q=Foo1');
        expect(url.protocol).toEqual('https:');
        expect(url.searchParams.get('q')).toEqual('key1,key2');
    });

    it('create shapefile layer - 1', () => {
        let url = 'shp://./tests/data/layers/USStates.shp?srs=EPSG:4326';
        let layer  = LayerFactory.create(new URL(url));

        expect(layer.source).toBeInstanceOf(ShapefileFeatureSource);
        expect(layer.name).toEqual('USStates');
        expect((<ShapefileFeatureSource>layer.source).filePath).toEqual('./tests/data/layers/USStates.shp');
        expect(layer.source.projection.from.projection).toEqual('EPSG:4326');
        expect(layer.source.projection.from.unit).toEqual('degrees');
    });

    it('create shapefile layer - 2', () => {
        let url = 'shp://./tests/data/layers/USStates.shp?srs=EPSG:4326&name=NewName';
        let layer  = LayerFactory.create(new URL(url));

        expect(layer.source).toBeInstanceOf(ShapefileFeatureSource);
        expect(layer.name).toEqual('NewName');
        expect((<ShapefileFeatureSource>layer.source).filePath).toEqual('./tests/data/layers/USStates.shp');
        expect(layer.source.projection.from.projection).toEqual('EPSG:4326');
        expect(layer.source.projection.from.unit).toEqual('degrees');
    });

    it('create memory layer', async () => {
        let url = 'mem://dynamic?fields=name|c|10,rec_id|n|4,landlocked|b|1';
        let layer = LayerFactory.create(new URL(url));

        expect(layer.source).toBeInstanceOf(MemoryFeatureSource);
        expect(layer.name).toEqual('dynamic');

        const source = <MemoryFeatureSource>layer.source;
        const fields = await source.fields();
        expect(fields.length).toBe(3);

        expect(fields[0].name).toEqual('name');
        expect(fields[0].type).toEqual('c');
        expect(fields[0].length).toEqual(10);

        expect(fields[1].name).toEqual('rec_id');
        expect(fields[1].type).toEqual('n');
        expect(fields[1].length).toEqual(4);

        expect(fields[2].name).toEqual('landlocked');
        expect(fields[2].type).toEqual('b');
        expect(fields[2].length).toEqual(1);
    });
});