// BEHAVIOUR: what happens on the page. Runs top to bottom when the page loads.

// Loads map into view of Montreal
const map = L.map('map', { preferCanvas: true }).setView([45.5017, -73.5673], 12);  // [latitude, longitude]: Montreal

// Base map: OpenStreetMap.
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// How many parking spaces to draw
const LIMIT = Infinity; 
const boroughColors = {
  'Verdun': '#1b9e77',
  'Rosemont-La Petite-Patrie': '#d95f02',
  'Outremont': '#7570b3',
  'Ville-Marie': '#e7298a',
  'Le Plateau-Mont-Royal': '#66a61e',
  'Le Sud-Ouest': '#e6ab02',
  'Ahuntsic-Cartierville': '#a6761d',
  'Côte-des-Neiges-Notre-Dame-de-Grâce': '#1f78b4'
};
// Load the parking.geojson file and add it to the map
fetch('../data/parking.geojson')
  .then(function (response) {
    if (!response.ok) { throw new Error('HTTP ' + response.status + ' loading parking.geojson'); }
    return response.json();
  })
  .then(function (data) {
    const hFeatures = data.features;
    // Populate the borough filter dropdown with borough names
    const boroughFilter = document.getElementById('borough-filter');
    let parkingLayer;
// Draws the parking spaces on the map filtered by borough
    function showFeatures() {
      const selectedBorough = boroughFilter.value;
      const filteredFeatures = selectedBorough === 'all'
        ? hFeatures
        : hFeatures.filter(function (feature) {
          return feature.properties.NOM === selectedBorough;
        });
      const shown = {
        type: 'FeatureCollection',
        features: filteredFeatures.slice(0, LIMIT)
      };

      if (parkingLayer) {
        map.removeLayer(parkingLayer);
      }
// Draw the parking spaces as circle markers colored by borough
      parkingLayer = L.geoJSON(shown, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 5,
            color: '#ffffff',
            weight: 1,
            fillColor: boroughColors[feature.properties.NOM] || '#808080',
            fillOpacity: 1
          });
        },
        // Popup for each point
        onEachFeature: function (feature, layer) {
          const p = feature.properties;
          layer.bindPopup(
            'Hourly Rate: ' + p.nTarifHoraire + '&cent;<br>' +
            'Street Name: ' + (p.sNomRue || p['Street Name']) + '<br>' +
            'Borough: ' + p.NOM
          );
        }
      }).addTo(map);
// Update the status text with the number of parking spaces shown and the selected borough
      const boroughLabel = selectedBorough === 'all' ? 'all boroughs' : selectedBorough;
      document.getElementById('status').textContent =
        shown.features.length + ' parking spaces shown in ' + boroughLabel;
    }

    boroughFilter.addEventListener('change', showFeatures);
    showFeatures();
  })
  .catch(function (err) {
    document.getElementById('status').textContent =
      'Could not load parking.geojson. Open the console (F12) for details.';
    console.error(err);
  });
// Build a legend control in the bottom-right corner of the map
const legend = L.control({ position: 'bottomright' });   // creates a Leaflet control placed bottom-right
legend.onAdd = function () {                              // runs when the control is added to the map
  const div = L.DomUtil.create('div', 'legend');          // makes a <div class="legend"> so styles.css applies
  div.innerHTML = Object.keys(boroughColors).map(function (name) {   // loops through every borough
    return '<div><span style="background:' + boroughColors[name] + '"></span>' + name + '</div>';   // one row: coloured dot + name
  }).join('');                                            // joins all rows into one HTML string
  return div;                                             // hands the finished legend back to Leaflet
};
legend.addTo(map);                                        // puts the legend on the map