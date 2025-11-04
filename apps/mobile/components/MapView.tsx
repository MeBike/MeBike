import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

type MapViewProps = {
  currentLocation?: { latitude: number; longitude: number };
  stations?: Array<{
    _id: string;
    name: string;
    latitude: string;
    longitude: string;
    address: string;
    availableBikes: number;
  }>;
  onStationPress?: (stationId: string) => void;
};

export function MapView({ currentLocation, stations = [], onStationPress }: MapViewProps) {
  const webViewRef = useRef<WebView>(null);

  const tomtomApiKey = Constants.expoConfig?.extra?.tomtomApiKey || process.env.EXPO_PUBLIC_TOMTOM_API_KEY;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" type="text/css" href="https://api.tomtom.com/maps-sdk-for-web/cdn/6/latest/maps.css"/>
      <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6/latest/maps-web.min.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .marker {
          background-color: #0066FF;
          border: 2px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        }
        .current-location {
          background-color: #FF6B35;
          border: 3px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const apiKey = '${tomtomApiKey}';
        const currentLocation = ${JSON.stringify(currentLocation)};
        const stations = ${JSON.stringify(stations)};

        let map;
        let markers = [];

        function initMap() {
          if (currentLocation) {
            map = tt.map({
              key: apiKey,
              container: 'map',
              center: [currentLocation.longitude, currentLocation.latitude],
              zoom: 15
            });
          } else {
            map = tt.map({
              key: apiKey,
              container: 'map',
              center: [105.8342, 21.0278], // Default to Hanoi
              zoom: 12
            });
          }

          // Add current location marker
          if (currentLocation) {
            const currentLocationMarker = new tt.Marker({
              element: createMarkerElement('current-location')
            })
            .setLngLat([currentLocation.longitude, currentLocation.latitude])
            .addTo(map);
          }

          // Add station markers
          stations.forEach(station => {
            const markerElement = createMarkerElement('marker');
            markerElement.addEventListener('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'stationPress',
                stationId: station._id
              }));
            });

            const marker = new tt.Marker({
              element: markerElement
            })
            .setLngLat([parseFloat(station.longitude), parseFloat(station.latitude)])
            .addTo(map);

            markers.push(marker);
          });
        }

        function createMarkerElement(className) {
          const element = document.createElement('div');
          element.className = className;
          return element;
        }

        window.onload = initMap;
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'stationPress' && onStationPress) {
        onStationPress(data.stationId);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});