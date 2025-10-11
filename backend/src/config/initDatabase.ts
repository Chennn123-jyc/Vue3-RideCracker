import { dbPool } from './database';

export const initDatabase = async (): Promise<void> => {
  try {
    console.log('开始初始化数据库表结构...');

    // 用户表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ 用户表创建成功');

    // 音乐表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        duration INT NOT NULL DEFAULT 0,
        file_path VARCHAR(500) NOT NULL,
        cover_image VARCHAR(500),
        uploader_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ 音乐表创建成功');

    // 运动会话表
   await dbPool.execute(`
  CREATE TABLE IF NOT EXISTS sport_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sport_type ENUM('running', 'cycling', 'walking', 'hiking', 'gym', 'swimming') NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INT DEFAULT 0,
    calories DECIMAL(8,2) DEFAULT 0,
    distance DECIMAL(8,2) DEFAULT 0,
    steps INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sport_sessions_user_start (user_id, start_time DESC)
  )
`);
console.log('✓ 运动会话表创建成功');

    // 运动轨迹表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS sport_tracks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        timestamp DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sport_sessions(id) ON DELETE CASCADE,
        INDEX idx_sport_tracks_session_time (session_id, timestamp ASC)
      )
    `);
    console.log('✓ 运动轨迹表创建成功');

    // 分享表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        images JSON,
        category ENUM('life', 'sport', 'music', 'thought') DEFAULT 'life',
        is_public BOOLEAN DEFAULT TRUE,
        view_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ 分享表创建成功');

    // 点赞表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        share_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_share (user_id, share_id)
      )
    `);
    console.log('✓ 点赞表创建成功');

    // 评论表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        share_id INT NOT NULL,
        content TEXT NOT NULL,
        parent_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ 评论表创建成功');

    // 播放列表表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ 播放列表表创建成功');

    // 播放列表音乐关联表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS playlist_music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        playlist_id INT NOT NULL,
        music_id INT NOT NULL,
        sort_order INT DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
        UNIQUE KEY unique_playlist_music (playlist_id, music_id)
      )
    `);
    console.log('✓ 播放列表音乐关联表创建成功');

    console.log('🎉 所有数据库表初始化完成！');

  } catch (error) {
    console.error('❌ 数据库表初始化失败:', error);
    throw error;
  }
};