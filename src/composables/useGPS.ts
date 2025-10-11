import { ref, onMounted, onUnmounted, Ref } from 'vue';

export interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null; // 速度，单位米/秒
  timestamp: number;
}

export interface GPSData {
  position: Ref<Position | null>;
  error: Ref<string | null>;
  formattedSpeed: Ref<string>;
  distance: Ref<number>;
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentPosition: () => { lat: number; lng: number; timestamp: string } | null; // 添加这个方法
}

export default function useGPS(): GPSData {
  const position = ref<Position | null>(null);
  const error = ref<string | null>(null);
  const watchId = ref<number | null>(null);
  const isTracking = ref(false);
  const distance = ref(0);
  const lastPosition = ref<Position | null>(null);
  
  // 计算两点之间的距离（使用Haversine公式）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // 地球半径，单位米
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // 返回距离，单位米
  };

  // 格式化速度显示（米/秒转公里/小时）
  const formattedSpeed = ref('0.0');
  
  const updateFormattedSpeed = () => {
    if (position.value && position.value.speed !== null) {
      // 将米/秒转换为公里/小时并保留一位小数
      const kmh = position.value.speed * 3.6;
      formattedSpeed.value = kmh.toFixed(1);
    } else {
      formattedSpeed.value = '0.0';
    }
  };

  const startTracking = () => {
    if (isTracking.value) return;
    
    if (!navigator.geolocation) {
      error.value = '您的浏览器不支持GPS定位';
      return;
    }

    isTracking.value = true;
    distance.value = 0;
    lastPosition.value = null;

    watchId.value = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        };
        
        position.value = newPosition;
        updateFormattedSpeed();
        
        // 计算行驶距离
        if (lastPosition.value) {
          const dist = calculateDistance(
            lastPosition.value.latitude,
            lastPosition.value.longitude,
            newPosition.latitude,
            newPosition.longitude
          );
          distance.value += dist;
        }
        
        lastPosition.value = newPosition;
      },
      (err) => {
        error.value = err.message;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value);
      watchId.value = null;
    }
    isTracking.value = false;
  };

  // 添加获取轨迹点的方法
  const getCurrentPosition = () => {
    if (position.value) {
      return {
        lat: position.value.latitude,  
        lng: position.value.longitude, 
        timestamp: new Date().toISOString()
      };
    }
    return null;
  };

  onUnmounted(() => {
    stopTracking();
  });

  return {
    position,
    error,
    formattedSpeed,
    distance,
    startTracking,
    stopTracking,
    getCurrentPosition // 添加到返回对象中
  };
}