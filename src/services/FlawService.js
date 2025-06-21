import { updateFlaw } from '@/api/task'
import { getFlawList } from '@/api/task'

/**
 * 故障服务类
 * 封装故障相关的业务逻辑
 */
class FlawService {
  /**
   * 获取故障列表
   * @param {string|number} taskId - 任务ID
   * @returns {Promise} 故障列表数据
   */
  async getFlawList(taskId) {
    try {
      const response = await getFlawList(taskId)
      return {
        success: true,
        data: response.data,
        message: '获取故障列表成功'
      }
    } catch (error) {
      console.error('获取故障列表失败:', error)
      return {
        success: false,
        data: null,
        message: error.message || '获取故障列表失败'
      }
    }
  }

  /**
   * 更新故障信息
   * @param {Object} flawData - 故障数据
   * @returns {Promise} 更新结果
   */
  async updateFlaw(flawData) {
    try {
      const response = await updateFlaw(flawData)
      return {
        success: true,
        data: response.data,
        message: '故障信息更新成功'
      }
    } catch (error) {
      console.error('更新故障信息失败:', error)
      return {
        success: false,
        data: null,
        message: error.message || '更新故障信息失败'
      }
    }
  }

  /**
   * 确认故障
   * @param {string|number} flawId - 故障ID
   * @param {string} status - 故障状态
   * @param {string} remark - 备注信息
   * @returns {Promise} 确认结果
   */
  async confirmFlaw(flawId, status = 'confirmed', remark = '') {
    try {
      const flawData = {
        id: flawId,
        status: status,
        remark: remark,
        confirmedTime: new Date().toISOString()
      }
      
      const response = await updateFlaw(flawData)
      return {
        success: true,
        data: response.data,
        message: '故障确认成功'
      }
    } catch (error) {
      console.error('故障确认失败:', error)
      return {
        success: false,
        data: null,
        message: error.message || '故障确认失败'
      }
    }
  }

  /**
   * 标记为误报
   * @param {string|number} flawId - 故障ID
   * @param {string} remark - 备注信息
   * @returns {Promise} 标记结果
   */
  async markAsFalseAlarm(flawId, remark = '') {
    try {
      const flawData = {
        id: flawId,
        status: 'false_alarm',
        remark: remark,
        confirmedTime: new Date().toISOString()
      }
      
      const response = await updateFlaw(flawData)
      return {
        success: true,
        data: response.data,
        message: '已标记为误报'
      }
    } catch (error) {
      console.error('标记误报失败:', error)
      return {
        success: false,
        data: null,
        message: error.message || '标记误报失败'
      }
    }
  }

  /**
   * 获取故障统计信息
   * @param {Array} flawList - 故障列表
   * @returns {Object} 统计信息
   */
  getFlawStatistics(flawList) {
    const statistics = {
      total: flawList.length,
      confirmed: 0,
      suspected: 0,
      falseAlarm: 0
    }

    flawList.forEach(flaw => {
      switch (flaw.status) {
        case 'confirmed':
          statistics.confirmed++
          break
        case 'suspected':
          statistics.suspected++
          break
        case 'false_alarm':
          statistics.falseAlarm++
          break
        default:
          statistics.suspected++
      }
    })

    return statistics
  }
}

// 创建单例实例
const flawService = new FlawService()

export default flawService 