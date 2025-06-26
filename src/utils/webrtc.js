/**
 * WebRTC视频流管理类
 * 注意：ZLMRTCClient.js已在index.html中作为全局脚本加载
 */
export class WebRTCManager {
  constructor() {
    this.players = new Map() // 存储播放器实例
    this.baseUrl = 'http://192.168.2.57'
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
        // 检查ZLMRTCClient是否可用
        if (typeof ZLMRTCClient === 'undefined') {
          reject(new Error('ZLMRTCClient is not available'))
          return
        }

        // 检查元素是否存在
        const element = document.getElementById(elementId)
        if (!element) {
          reject(new Error(`Element with id '${elementId}' not found`))
          return
        }

        console.log(`Creating WebRTC player for element: ${elementId}, stream: ${streamId}`)

        // 构建WebRTC信令URL
        const zlmsdpUrl = `${this.baseUrl}/webrtc-api/live/PbOUmNpZKCDFt_01.flv`
        console.log(`WebRTC SDP URL: ${zlmsdpUrl}`)

        // 创建播放器实例
        const player = new ZLMRTCClient.Endpoint({
          element: element,          // 视频显示元素
          debug: true,              // 开启调试模式
          zlmsdpUrl: zlmsdpUrl,     // WebRTC信令交换URL
          recvOnly: true,           // 只接收流，不发送
          videoEnable: streamId <= 4, // 通道1-4为视频
          audioEnable: streamId === 5, // 通道5为音频
          useCamera: false          // 不使用本地摄像头
        })

        // 监听事件
        player.on(ZLMRTCClient.Events.WEBRTC_ON_REMOTE_STREAMS, (event) => {
          console.log(`Remote stream received for stream ${streamId}:`, event)
          resolve(player)
        })

        player.on(ZLMRTCClient.Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, (error) => {
          console.error(`WebRTC offer/answer exchange failed for stream ${streamId}:`, error)
          reject(new Error(`WebRTC signaling failed: ${error.msg || 'Unknown error'}`))
        })

        player.on(ZLMRTCClient.Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, (state) => {
          console.log(`Connection state changed for stream ${streamId}: ${state}`)
          if (state === 'failed' || state === 'disconnected') {
            reject(new Error(`WebRTC connection failed: ${state}`))
          }
        })

        player.on(ZLMRTCClient.Events.WEBRTC_ICE_CANDIDATE_ERROR, (error) => {
          console.error(`ICE candidate error for stream ${streamId}:`, error)
        })

        // 存储播放器实例
        this.players.set(elementId, player)
        
        // 播放器会在构造函数中自动开始连接（因为recvOnly: true）
        console.log(`Player created and starting for stream ${streamId}`)

      } catch (error) {
        console.error(`Error creating player:`, error)
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