import {QueryEngine} from "@comunica/query-sparql";

console.log("Hello world")

function buildQuery(
    query: readonly string[],
    prefixes: Record<string, string>): string {
    return `
            ${Object.keys(prefixes).map(prefix => `PREFIX ${prefix}: <${prefixes[prefix]}>`).join("\n")}
            SELECT *
            WHERE {
            ${query.join(". \n")} .
            }
            `
}


const prefixes = {
    schema: "http://schema.org/",
    mv: "http://schema.mobivoc.org/",
    gr: "http://purl.org/goodrelations/v1#",
    vp: "https://data.velopark.be/openvelopark/vocabulary#",
    vpt: "https://data.velopark.be/openvelopark/terms#"
}
const queryWithShape = `
        ?parking a <http://schema.mobivoc.org/BicycleParkingStation>.
        GRAPH ?g {
            VALUES ?type { vpt:BicycleLocker vpt:BicycleStand vpt:ResidentBicycleParking vpt:PublicBicycleParking }.
            ?section a ?type.
            
            OPTIONAL {
                ?section schema:geo [
                    a schema:GeoCoordinates ;
                    schema:latitude ?latitude ;
                    schema:longitude ?longitude
                ] }.
            OPTIONAL {
                ?x schema:geo [
                a schema:GeoShape ;
                schema:polygon ?shape
                ]
            }.
       }`

const queryWithoutShape = `
        ?parking a <http://schema.mobivoc.org/BicycleParkingStation>.
        GRAPH ?g {
            VALUES ?type { vpt:BicycleLocker vpt:BicycleStand vpt:ResidentBicycleParking vpt:PublicBicycleParking }.
            ?section a ?type.
            
            OPTIONAL {
                ?section schema:geo [
                    a schema:GeoCoordinates ;
                    schema:latitude ?latitude ;
                    schema:longitude ?longitude
                ] }.
       }`

let sources = ["NoShape.jsonld", "Shape.jsonld"]

async function main() {
    const comunica =new QueryEngine()
    for (const source of sources) {
        for (let i = 0; i < [queryWithoutShape, queryWithShape].length; i++){
            const query = [queryWithoutShape, queryWithShape][i];

            const q = buildQuery([query], prefixes)
            const url = "http://127.0.0.1:8080/"+source
            console.log("source is", url)
            const bindingsStream = await comunica.queryBindings(
                q, {sources: [url]}
            )
            const bindings = await bindingsStream.toArray()
            console.log("Got "+bindings.length+" bindings for "+url+" with query "+(i == 0 ? 'no shape' : "with shape")+":")
            bindings.forEach(b => {
                console.log("    "+b.toString())
            })
        }
    }


}


main()