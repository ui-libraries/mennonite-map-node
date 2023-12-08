// require modules
const L = require('leaflet');
const $ = require('jquery');
require('leaflet-geometryutil');
require('leaflet-arrowheads');


// define map options
const mapOptions = {
    center: [-10, -80], // center the map
    zoom: 4, // set the initial zoom
};

// define the map with the options above
const map = L.map("map", mapOptions);

// define and add a base map to the map using Carto's Voyager tiles
const CartoDB_Voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map); // add this to the map so that it is on by default

// define another base map option using Esri's World Imagery tiles
const imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// use jquery to load mennonite GeoJSON data
$.when(
    $.getJSON("data/latin-america-mennonite-colonies.geojson"),
    $.getJSON("data/la-colony-migration-arrows.geojson")
    // when the files are done loading,
    // identify them with names and process them through a function
).done(function (lamennonite, lamigration) {
    // instantiate the latin america mennonite colony layer
    const MennoniteColonies = L.geoJson(lamennonite, {
        // style the layer
        style: function (feature) {
            return {
                fillColor: "red", // set the polygon fill to red
                fillOpacity: 0.5, // give the polygon fill a 30% opacity
                color: "red", // set the outline color to red
                weight: 0.5, // give the outline a weight
                opacity: 0.7 // give the outline 70% opacity
            };
        },
        onEachFeature: function (feature, layer) {
            // define layer properties
            let props = layer.feature.properties;
            // define the tooltip info
            let colonyTooltip = '<b>' + props.Name + ' Colony, ' + props.Country + '</b><hr>Click here for more information';
            // define the popup info
            let colonyPopup = '<b>' + props.Name + ' Colony, ' + props.Country + '</b><br>' + 'Year established: ' + props.Est_date + '<br>' + props.Area_ha + ' hectares<hr>To open the Global Anabaptist<br>Mennonite Encyclopedia Online<br>page for this colony, <a target="_blank" href="' + props.Article + '">click here</a>';
            // bind the tooltip to the layer and add the content defined as "colonyTooltip"
            layer.bindTooltip(colonyTooltip, {
                sticky: true,
                className: "tooltip",
            });
            // bind the popup to the layer and add the content defined as "colonyPopup"
            layer.bindPopup(colonyPopup);
            /*         
                     layer.on("click", function() {
                       //console.log('layer clicked');
                       layer.bindPopup(colonyPopup);
                     });
           */
            // define style changes on mouseover
            layer.on("mouseover", function () {
                // run the setStyle method on the layer
                layer.setStyle({
                    fillColor: "yellow" // make the fill yellow
                });
            });
            // define style changes on mouseout
            layer.on("mouseout", function () {
                // run the setStyle method again
                layer.setStyle({
                    fillColor: "red" // reset the fill to red
                });
            });
        }
    }).addTo(map);

    // define the migration arrow layer and add it to the map
    const MigrationArrows = L.geoJson(lamigration, {
        arrowheads: {
            yawn: 40,
            size: '10px',
            frequency: 'endonly'
        },
        // Style the layer
        style: function (feature) {
            return {
                color: 'tan',
                dashArray: '3, 6',
                weight: 5.0,
                opacity: 0.75
            };
        }
    }).addTo(map);

    // fit the map to the bounds of the MennoniteColonies layer
    //map.fitBounds(MennoniteColonies.getBounds());

    // add these maps to a object named baseMaps
    const baseMaps = {
        "Carto Voyager": CartoDB_Voyager,
        "Esri Imagery": imagery
    };

    const overlays = {
        "Mennonite Colonies": MennoniteColonies
    };

    // define a layer control
    const layerControl = L.control.layers(baseMaps, overlays, { // null is a placeholder for overlays
        collapsed: false // keeps the layer control open by default
    }).addTo(map);

    // define the value in the slider when the map loads
    let currentYear = $('.slider').val();

    // define the year input form
    let timeForm = document.getElementById('form');

    // call functions defined below
    sequenceUI(MigrationArrows, MennoniteColonies, currentYear, timeForm); // calls the time slider and sends the layer to it
    createTemporalLegend(currentYear); // calling this function here ensures that the temporal legend displays the appropriate year on load
    updateColonies(MigrationArrows, MennoniteColonies, currentYear);
});

// call the UI slider with a function called "sequenceUI"
function sequenceUI(MigrationArrows, MennoniteColonies, currentYear, timeForm) { // feed it the colony data

    // use the jQuery ajax method to get the slider element
    $('.slider')
        .on('input change', function () { // when the input changes...
            let currentYear = $(this).val(); // identify the year selected with "currentYear"
            createTemporalLegend(currentYear); // call the createTemporalLegend function
            updateColonies(MigrationArrows, MennoniteColonies, currentYear); // updates the layer according to the slider year upon loading
        });

    // if a year is submitted on timeForm...
    timeForm.addEventListener('submit', function updateTimeRange(e) {
        var currentYear = document.getElementById('year').value; // define currentYear as the submitted year
        $('.slider').val(currentYear); // adjust the time slider to the submitted year
        createTemporalLegend(currentYear); // run this function
        updateColonies(MigrationArrows, MennoniteColonies, currentYear); // run this function
        e.preventDefault(); // prevent defaulting
    });

}; // End sequenceUI function

// Define updateColonies function and feed it the colony data and the user-selected year
function updateColonies(MigrationArrows, MennoniteColonies, currentYear) {
    // access each layer in the colony data
    MennoniteColonies.eachLayer(function (layer) {
        // define the colony establishment years
        let estYear = layer.feature.properties.Est_date;
        // use conditional logic to test if the layer properties match the time slider year
        if (estYear <= currentYear) {
            // if there is a match, add the MennoniteColonies layer to the map
            layer.addTo(map);
        } else {
            // otherwise, remove the layer from the map
            map.removeLayer(layer);
        };

    });
    // access each layer in the migration arrow data
    MigrationArrows.eachLayer(function (layer) {
        // define the migration arrow years
        let arrowYear = layer.feature.properties['Est-Year'];
        // use conditional logic to test if the layer properties match the time slider year
        if (arrowYear == currentYear) {
            // if there is a match, add the MigrationArrows layer to the map
            layer.addTo(map);
        } else {
            // otherwise, remove the layer from the map
            map.removeLayer(layer);
        };

    });
}; // End updateColonies function

// Add a temporal legend in sync with the UI slider
function createTemporalLegend(currentYear) { // feed it the selected year

    $('#temporal span').html("Year: " + currentYear); // change grade value to that currently selected by UI slider

}; // End createTemporalLegend function