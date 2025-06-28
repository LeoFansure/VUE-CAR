import axios from 'axios'

// 获取摄像头列表（需要Basic Auth）
export function deviceList() {
  return axios.get('http://192.168.2.57/easy-api/devices?page=1&size=999', {
    headers: {
      Authorization: 'Basic YWRtaW4xMjM6QWRtaW5AMTIz'
    }
  })
}

/**
 * 获取摄像头设备列表
 * @returns {Promise<Array>} 设备列表
 */
export const getDeviceList = () => {
  return new Promise((resolve, reject) => {
    const myHeaders = new Headers();
    // 根据文档添加 Authorization 头
    myHeaders.append("Authorization", "Basic YWRtaW4xMjM6QWRtaW5AMTIz");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    // 注意：vite.config.js 中需要配置 /easy-api 代理
    fetch("/easy-api/devices?page=1&size=999&status=&id&name", requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        // 假设摄像头列表在 result.data.list 中
        if (result && result.data && Array.isArray(result.data.list)) {
          resolve(result.data.list);
        } else {
          console.error("Unexpected device list format:", result);
          resolve([]); // 返回空数组以避免错误
        }
      })
      .catch((error) => {
        console.error("获取摄像头列表失败:", error);
        reject(error);
      });
  });
}; 