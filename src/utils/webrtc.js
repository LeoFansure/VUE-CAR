import './ZLMRTCClient.js'

/**
 * WebRTC视频流管理类
 */
export class WebRTCManager {
  constructor() {
    this.players = new Map() // 存储播放器实例
    this.baseUrl = 'http://192.168.2.57/webrtc-api'
  }

  /**
   * 创建播放器
   * @param {string} elementId - 视频容器元素ID
   * @param {number} streamId - 流通道号 (1-4为视频，5为音频)
   * @returns {Promise<Object>} 播放器实例
   */
  async createPlayer(elementId, streamId) {
    return new Promise((resolve, reject) => {
      try {
        const player = new ZLMRTCClient.Peer({
          element: document.getElementById(elementId),
          debug: false
        })

        // 构建流地址
        const streamUrl = `${this.baseUrl}/index/api/webrtc?app=live&stream=${streamId}&type=play`
        
        player.on('track', (track, stream) => {
          console.log(`Track received for stream ${streamId}:`, track.kind)
        })

        player.on('error', (error) => {
          console.error(`Player error for stream ${streamId}:`, error)
          reject(error)
        })

        player.start(streamUrl).then(() => {
          this.players.set(elementId, player)
          resolve(player)
        }).catch(reject)

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 停止播放器
   * @param {string} elementId - 视频容器元素ID
   */
  stopPlayer(elementId) {
    const player = this.players.get(elementId)
    if (player) {
      player.close()
      this.players.delete(elementId)
    }
  }

  /**
   * 停止所有播放器
   */
  stopAllPlayers() {
    this.players.forEach((player, elementId) => {
      player.close()
    })
    this.players.clear()
  }

  /**
   * 获取播放器实例
   * @param {string} elementId 
   * @returns {Object|null}
   */
  getPlayer(elementId) {
    return this.players.get(elementId) || null
  }

  /**
   * 检查播放器是否存在
   * @param {string} elementId 
   * @returns {boolean}
   */
  hasPlayer(elementId) {
    return this.players.has(elementId)
  }
}

// 创建全局实例
export const webrtcManager = new WebRTCManager()

/**
 * 播放视频流
 * @param {string} elementId - 视频容器ID
 * @param {number} streamId - 流通道号
 * @returns {Promise<Object>}
 */
export function playVideoStream(elementId, streamId) {
  return webrtcManager.createPlayer(elementId, streamId)
}

/**
 * 停止视频流
 * @param {string} elementId - 视频容器ID
 */
export function stopVideoStream(elementId) {
  webrtcManager.stopPlayer(elementId)
}

/**
 * 切换视频流
 * @param {string} elementId - 视频容器ID
 * @param {number} newStreamId - 新的流通道号
 * @returns {Promise<Object>}
 */
export async function switchVideoStream(elementId, newStreamId) {
  // 先停止当前播放器
  webrtcManager.stopPlayer(elementId)
  
  // 等待一小段时间确保资源释放
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 启动新的播放器
  return webrtcManager.createPlayer(elementId, newStreamId)
} 