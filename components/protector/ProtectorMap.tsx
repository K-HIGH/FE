import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface ProtectorMapProps {
  onLocationSelected?: (location: { latitude: number; longitude: number; address: string }) => void;
  searchResult?: {
    latitude: number;
    longitude: number;
    placeName: string;
    address: string;
  } | null;
}

export default function ProtectorMap({ onLocationSelected, searchResult }: ProtectorMapProps) {
  const webViewRef = useRef<WebView>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 검색 결과가 변경될 때 지도 이동 및 마커 추가
  useEffect(() => {
    if (searchResult && isMapLoaded && webViewRef.current) {
      const moveToSearchResult = `
        if (typeof moveToLocation === 'function') {
          moveToLocation(${searchResult.latitude}, ${searchResult.longitude}, 3);
          
          // 검색 결과 마커 추가
          if (typeof addSearchMarker === 'function') {
            addSearchMarker(${searchResult.latitude}, ${searchResult.longitude}, '${searchResult.placeName}', '${searchResult.address}');
          }
        }
      `;
      
      webViewRef.current.postMessage(moveToSearchResult);
    }
  }, [searchResult, isMapLoaded]);

  // 카카오 지도 HTML 콘텐츠 (공식 가이드 기반)
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=3.0">
      <title>Kakao 지도</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; overflow: hidden; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=a04dd5a3c15a754fc6c468ab37425a34&libraries=services&autoload=false"></script>
      <script>
        console.log('카카오 지도 스크립트 시작');
        
        // 카카오 SDK 로드 후 실행
        kakao.maps.load(function() {
          console.log('카카오 SDK 로드 완료');
          
          // 지도를 담을 영역의 DOM 레퍼런스
          var container = document.getElementById('map');
          
          // 지도를 생성할 때 필요한 기본 옵션
          var options = {
            center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청 기본 위치
            level: 3 // 지도의 레벨(확대, 축소 정도)
          };

          // 지도 생성 및 객체 리턴
          var map = new kakao.maps.Map(container, options);
        
        console.log('지도 생성 완료');
        
        // 지도 타입 컨트롤 추가
        var mapTypeControl = new kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
        
        // 줌 컨트롤 추가
        var zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
        
        // 현재 위치 마커들 저장 (피보호인들의 위치)
        var markers = [];
        var searchMarkers = []; // 검색 결과 마커들
        
        // 피보호인 위치 추가 함수
        function addDependentLocation(lat, lng, name, status) {
          console.log('마커 추가:', name, status);
          
          var position = new kakao.maps.LatLng(lat, lng);
          
          // 상태에 따른 마커 이미지 URL 생성
          var markerImageUrl;
          var markerSize = new kakao.maps.Size(24, 35);
          var markerOption = {offset: new kakao.maps.Point(12, 35)};
          
          // 상태에 따른 마커 색상 결정
          if (status === 'at_home') {
            // 연두색 마커 (집에 있음)
            markerImageUrl = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 23 12 23s12-14 12-23c0-6.627-5.373-12-12-12z" fill="#90EE90"/><circle cx="12" cy="12" r="6" fill="white"/></svg>');
          } else if (status === 'out_without_destination') {
            // 회색 마커 (목적지 없이 이동)
            markerImageUrl = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 23 12 23s12-14 12-23c0-6.627-5.373-12-12-12z" fill="#808080"/><circle cx="12" cy="12" r="6" fill="white"/></svg>');
          } else {
            // 빨간색 마커 (외출 중)
            markerImageUrl = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 23 12 23s12-14 12-23c0-6.627-5.373-12-12-12z" fill="#FF0000"/><circle cx="12" cy="12" r="6" fill="white"/></svg>');
          }
          
          // 마커 이미지 생성
          var markerImage = new kakao.maps.MarkerImage(markerImageUrl, markerSize, markerOption);
          
          // 마커 생성
          var marker = new kakao.maps.Marker({
            position: position,
            image: markerImage
          });
          
          // 마커를 지도에 표시
          marker.setMap(map);
          markers.push(marker);
          
          // 인포윈도우 생성
          var infowindow = new kakao.maps.InfoWindow({
            content: '<div style="padding:5px;font-size:12px;text-align:center;">' + name + '</div>'
          });
          
          // 마커 클릭 이벤트
          kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
          });
        }
        
        // React Native로 메시지 전송 함수
        function sendMessageToRN(message) {
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(message));
            }
          } catch (e) {
            console.error('메시지 전송 오류:', e);
          }
        }
        
        // 지도 클릭 이벤트 (주소 검색)
        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
          var latlng = mouseEvent.latLng;
          
          // services 라이브러리로 좌표를 주소로 변환
          var geocoder = new kakao.maps.services.Geocoder();
          
          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
              var address = result[0].address.address_name;
              sendMessageToRN({
                type: 'location_selected',
                latitude: latlng.getLat(),
                longitude: latlng.getLng(),
                address: address
              });
            }
          });
        });
        
        // 더미 피보호인 데이터 추가
        addDependentLocation(37.5665, 126.9780, '피보호인1: 외출(이동 중)', 'out_with_destination');
        addDependentLocation(37.5675, 126.9790, '피보호인2: 이동 중', 'out_without_destination');
        addDependentLocation(37.5655, 126.9770, '피보호인3: 집에 있음', 'at_home');
        
        // 지도 로딩 완료 알림
        sendMessageToRN({ type: 'map_loaded' });
        console.log('카카오 지도 초기화 완료');
        
        // React Native에서 호출할 수 있는 함수들을 전역으로 노출
        window.moveToCurrentLocation = function() {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              var lat = position.coords.latitude;
              var lng = position.coords.longitude;
              var moveLatLon = new kakao.maps.LatLng(lat, lng);
              map.setCenter(moveLatLon);
              map.setLevel(3);
            });
          }
        };
        
        window.moveToLocation = function(lat, lng, level) {
          var moveLatLon = new kakao.maps.LatLng(lat, lng);
          map.setCenter(moveLatLon);
          if (level) map.setLevel(level);
        };
        
        window.updateDependentLocations = function(dependents) {
          // 기존 마커들 제거
          markers.forEach(function(marker) {
            marker.setMap(null);
          });
          markers = [];
          
          // 새로운 마커들 추가
          dependents.forEach(function(dependent) {
            addDependentLocation(
              dependent.latitude,
              dependent.longitude,
              dependent.name + ': ' + dependent.statusText,
              dependent.status
            );
          });
        };
        
        // 검색 결과 마커 추가 함수
        window.addSearchMarker = function(lat, lng, placeName, address) {
          console.log('검색 마커 추가:', placeName);
          
          // 기존 검색 마커들 제거
          searchMarkers.forEach(function(marker) {
            marker.setMap(null);
          });
          searchMarkers = [];
          
          var position = new kakao.maps.LatLng(lat, lng);
          
          // 파란색 검색 마커 이미지
          var markerImageUrl = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 25 15 25s15-13.75 15-25c0-8.284-6.716-15-15-15z" fill="#007bff"/><circle cx="15" cy="15" r="8" fill="white"/><text x="15" y="19" text-anchor="middle" fill="#007bff" font-size="10" font-weight="bold">검색</text></svg>');
          var markerSize = new kakao.maps.Size(30, 40);
          var markerOption = {offset: new kakao.maps.Point(15, 40)};
          
          // 마커 이미지 생성
          var markerImage = new kakao.maps.MarkerImage(markerImageUrl, markerSize, markerOption);
          
          // 마커 생성
          var marker = new kakao.maps.Marker({
            position: position,
            image: markerImage
          });
          
          // 마커를 지도에 표시
          marker.setMap(map);
          searchMarkers.push(marker);
          
          // 인포윈도우 생성
          var infowindow = new kakao.maps.InfoWindow({
            content: '<div style="padding:8px;font-size:12px;text-align:center;min-width:120px;"><strong>' + placeName + '</strong><br/>' + address + '</div>'
          });
          
          // 마커 클릭 이벤트
          kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
          });
          
          // 검색 마커는 자동으로 인포윈도우 표시
          setTimeout(function() {
            infowindow.open(map, marker);
          }, 300);
        };
        
        }); // kakao.maps.load 닫기
        
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'map_loaded':
          setIsMapLoaded(true);
          console.log('지도 로딩 완료');
          break;
        case 'location_selected':
          if (onLocationSelected) {
            onLocationSelected({
              latitude: message.latitude,
              longitude: message.longitude,
              address: message.address
            });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('WebView 메시지 파싱 오류:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        allowsFullscreenVideo={false}
        bounces={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onError={(error) => {
          console.error('WebView 오류:', error);
          Alert.alert('지도 로딩 오류', '지도를 불러올 수 없습니다.');
        }}
        onLoadStart={() => console.log('WebView 로딩 시작')}
        onLoadEnd={() => console.log('WebView 로딩 완료')}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('HTTP 오류:', nativeEvent);
        }}
        renderError={(errorName) => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>지도 로딩 실패: {errorName}</Text>
          </View>
        )}
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