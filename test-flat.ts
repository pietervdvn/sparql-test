import {QueryEngine} from "@comunica/query-sparql";

console.log("Same as 'test.ts', except that nothing is wrapped into an additional 'GRAPH'-keyword")

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
        ?section a <http://schema.mobivoc.org/BicycleParkingStation>.

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
            }`

const queryWithOnlyShape = `
        ?section a <http://schema.mobivoc.org/BicycleParkingStation>.
            OPTIONAL {
                ?x schema:geo [
                a schema:GeoShape ;
                schema:polygon ?shape
                ]
            }`


const queryWithoutShape = `
        ?section a <http://schema.mobivoc.org/BicycleParkingStation>.
            OPTIONAL {
                ?section schema:geo [
                    a schema:GeoCoordinates ;
                    schema:latitude ?latitude ;
                    schema:longitude ?longitude
                ] }`


const queryWithoutCoords = `
        ?section a <http://schema.mobivoc.org/BicycleParkingStation>.
            OPTIONAL { ?section schema:geo ?geo }`

let sources = ["NoShapeFlat.jsonld"]

let queries: Record<string, string>  = {
    withShape: queryWithShape,
    withoutShape: queryWithoutShape,
    noCoords: queryWithoutCoords,
    onlyShape: queryWithOnlyShape
}
async function main() {
    const comunica = new QueryEngine()
    for (const source of sources) {
        for (const queryName in queries) {
            const query = queries[queryName]

            const q = buildQuery([query], prefixes)
            const url = "http://127.0.0.1:8080/"+source
           // console.log("source is", url, q)
            const bindingsStream = await comunica.queryBindings(
                q, {sources: [url], lenient: true},
            )
            const bindings = await bindingsStream.toArray()
            console.log("Got "+bindings.length+" bindings for "+url+" with query "+queryName+":")
            console.log(bindings.map(b => b.toString()).join(","))
        }
    }


}


main()