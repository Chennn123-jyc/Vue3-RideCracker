
export interface SportMode {
    id: string; // 唯一标识（如 'cycling'）
    label: string; // 显示名称（如 '骑行'）
    icon: string; // 图标类名（Font Awesome）
    color: string; // 主题色（对应历史记录卡片、按钮样式）
    defaultMaxSpeed?: number; // 该运动默认最大速度（用于速度圆环计算）
    isNeedGPS?: boolean; // 是否需要GPS定位（如跑步需要，室内运动不需要）
  }
  
  /**
   * 所有运动模式的集中配置
   * 后续新增/修改运动模式，只需在这里调整，全局生效
   */

export const SPORT_MODES: SportMode[] = [
    {
      id: 'cycling',
      label: '骑行',
      icon: 'bicycle', // 修改为图标名称而非CSS类名
      color: 'primary',
      defaultMaxSpeed: 50,
      isNeedGPS: true,
    },
    {
      id: 'running',
      label: '跑步',
      icon: 'running', // 修改为图标名称
      color: 'accent1',
      defaultMaxSpeed: 25,
      isNeedGPS: true,
    },
    {
      id: 'hiking',
      label: '徒步',
      icon: 'hiking', // 修改为图标名称
      color: 'accent3',
      defaultMaxSpeed: 15,
      isNeedGPS: true,
    },
    {
      id: 'walking',
      label: '步行',
      icon: 'walking', // 修改为图标名称
      color: 'accent2',
      defaultMaxSpeed: 10,
      isNeedGPS: true,
    },
    {
      id: 'swimming',
      label: '游泳',
      icon: 'swimmer', // 修改为图标名称
      color: 'primary',
      defaultMaxSpeed: 8,
      isNeedGPS: false,
    },
    {
      id: 'basketball',
      label: '篮球',
      icon: 'basketball-ball', // 修改为图标名称
      color: 'accent1',
      defaultMaxSpeed: 12,
      isNeedGPS: false,
    },
  ];

  /**
   * 运动状态枚举（统一管理运动的所有状态，避免硬编码）
   */
  export enum SportStatus {
    IDLE = 'idle', // 未开始
    ACTIVE = 'active', // 运动中
    PAUSED = 'paused', // 已暂停
    ENDED = 'ended', // 已结束
  }
  
  /**
   * 运动相关默认配置（全局通用的默认值）
   */
  export const SPORT_DEFAULTS = {
    DEFAULT_MODE: 'cycling', // 默认选中的运动模式
    MIN_DURATION_TO_SAVE: 10, // 最小运动时长（秒）：低于此值不保存记录
    GPS_UPDATE_INTERVAL: 1000, // GPS定位更新间隔（毫秒）
  };
  
  /**
   * 运动数据单位配置（按运动类型区分单位）
   */
  export const SPORT_UNITS = {
    speed: {
      default: 'km/h', // 默认速度单位
      alternatives: ['m/s', 'km/h', 'mph'], // 可选单位
    },
    distance: {
      default: 'km',
      alternatives: ['m', 'km'],
    },
    duration: {
      default: 'hh:mm:ss',
    },
  };