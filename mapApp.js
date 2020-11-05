window.addEventListener('DOMContentLoaded', initializeApp);

//the base url end point
const baseUrlEndPoint1 = 'https://corona-api.com/countries';
const baseUrlEndPoint2 = 'https://api.covid19api.com/summary';

//container for displaying the corona details
let coronaDetailsContainer;

//dropdown for country selection
let countrySelectDropdown;

//container for rendering the world corona details
let coronaWorldDetailsContainer

const coronaData = {
    latest: {},
    locations: []
}

let geocoder;

async function geocodeReverseFromLatLngToPlace(lat, lng){
    return new Promise((resolve, reject) => {
        geocoder.mapboxClient.geocodeReverse(
        {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
        },
        function(error, response){
            if(error){
                reject(error);
            }
            resolve(response.features[0] && response.features[0].place_name)
        });
    })
}

mapboxgl.accessToken = 'pk.eyJ1IjoiaC1rYXVzaCIsImEiOiJja2gzb2wybXowMGZ5Mnhuc2o3MnF4MGQ4In0.5na7bzXuKXvg3K4QUrIfIg';

function renderMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaC1rYXVzaCIsImEiOiJja2gzb2wybXowMGZ5Mnhuc2o3MnF4MGQ4In0.5na7bzXuKXvg3K4QUrIfIg';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [-103.59179687498357, 40.66995747013945],
        zoom: 3,
    });

    geocoder = new MapboxGeocoder ({
        accessToken: mapboxgl.accessToken
    })

    map.addControl(geocoder);
    map.addControl(new mapboxgl.NavigationControl());
 
    map.on('load', async function () {
        map.addSource('places', {
        type: 'geojson',
        data: {
            type: "FeatureCollection",
            crs: {
                    "type": "name",
                    "properties": {
                        "name": "urn:ogc:def:crs:OGC:1.3:CRS84",
                 },
        },


        features: await Promise.all(coronaData.locations.map(async location => {
            
            //Do The Reverse Geocoding
            
            const placeName = await geocodeReverseFromLatLngToPlace(
                location.coordinates.latitude,
                location.coordinates.longitude
            );

            console.log(placeName)

            return {
                type: 'Feature',
                properties: {
                    description:  '<table>' + '<thead><tr>' + placeName + '</tr></thead>' + '<tbody>' + '<tr>' + '<td>Confirmed: </td>' + '<td>' + location.latest_data.confirmed + '</td>' + 
                                  '</tr>' + '<tr>' + '<td>Recovered: </td>' + '<td>' + location.latest_data.recovered + '</td>' + '</tr>' + '<tr>' + '<td>Deaths: </td>' + '<td>' + location.latest_data.deaths +
                                  '</td>' + '</tr>' + '<tr>' + '<td>Critical: </td>' + '<td>' + location.latest_data.critical + '</td>' + '</tr>' + '<tr>' + '<td>Latitude: </td>' + '<td>' + location.coordinates.latitude + 
                                  '</td>' + '</tr>' + '<tr>' + '<td>Longitude: </td>' + '<td>' + location.coordinates.longitude + '</td>' + '</tr>' + '<tr>' + '<td>UpdatedAt: </td>' + '<td>' + location.updated_at + '</td>' + '</tr>' + '</tbody>' + '</table>',
                    icon: 'rocket'
                },
                geometry: {
                    type: "Point",
                    coordinates: [
                        location.coordinates.longitude,
                        location.coordinates.latitude
                    ]
                }
            };
        }))
    },
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
});
 
map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'places',
    filter: ['has', 'point_count'],
    paint: {
        'circle-color': ['step',['get', 'point_count'],'#51bbd6',100,'#f1f075',750,'#f28cb1'],
        'circle-radius': ['step',['get', 'point_count'],20,100,30,150,40]
    }
});
 
map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'places',
    filter: ['has', 'point_count'],
    layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
    }
});
 
map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'places',
    filter: ['!', ['has', 'point_count']],
    paint: {
        'circle-color': '#11b4da',
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
    }
});
 
// inspect a cluster on click
map.on('click', 'clusters', function (event) {
    const features = map.queryRenderedFeatures(event.point, {
        layers: ['clusters']
    });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('places').getClusterExpansionZoom(clusterId, function (err, zoom) {
        if (err) return;
 
        map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
        });
    });
});
 

map.on('click', 'unclustered-point', function (event) {
    const coordinates = event.features[0].geometry.coordinates.slice();
    const {description} = event.features[0].properties;
 

    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
    }
 
    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
});
 
map.on('mouseenter', 'clusters', function () {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'clusters', function () {
    map.getCanvas().style.cursor = '';
});
});
}

async function initializeApp() {

    console.log('initialize the app');
    setReferences();
    // doEventBindings();
    NProgress.start();
    // populateLocations();
    await performAsyncCall();
    // renderUI(coronaData.latest, true);
    console.log('Corona Prone Locations Details', coronaData.locations);
    renderMap();
    NProgress.done();

}

async function performAsyncCall() {
    const response = await fetch(baseUrlEndPoint1);
    const dataFromAPI = await response.json();
    const {data} = dataFromAPI;
    coronaData.locations.push(...data);
}

function renderDetailsForSelectedLocation(event) {
    // console.log(event.target.value);
    const countrySelected = event.target.value;
    // console.log(countrySelected.country)
    const locationCoronaDetails = coronaData.locations.reduce((accumulator, currentLocation) => {
        if(currentLocation.name === countrySelected){
            accumulator['country'] = currentLocation.name;
            accumulator['country_code'] = currentLocation.code;
            accumulator.latest.confirmed += currentLocation.latest_data.confirmed;
            accumulator.latest.deaths += currentLocation.latest_data.deaths;
        }
        return accumulator
    },{
        country: '',
        country_code: '',
        latest: {
            confirmed: 0,
            deaths: 0
        }
    });
    // console.log(locationCoronaDetails);
    renderUI(locationCoronaDetails);

}

function setReferences(){
    coronaDetailsContainer = document.querySelector('#corona-details');
    countrySelectDropdown = document.querySelector('[name="select-country"]');
    coronaWorldDetailsContainer = document.querySelector('#corona-world-details');
}