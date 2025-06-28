import axios from 'axios'

// 获取摄像头列表（需要Basic Auth）
export function deviceList() {
  return axios.get('http://192.168.2.57/easy-api/devices?page=1&size=999', {
    headers: {
      Authorization: 'Basic YWRtaW4xMjM6QWRtaW5AMTIz'
    }
  })
} 