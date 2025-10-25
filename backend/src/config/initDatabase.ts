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

    // 用户资料扩展表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bio TEXT,
        location VARCHAR(100),
        website VARCHAR(255),
        birth_date DATE,
        gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_profile (user_id)
      )
    `);
    console.log('✓ 用户资料表创建成功');

    // 创建用户个人音乐表（放在其他表之前，因为其他表可能引用它）
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS user_music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(1000) NOT NULL, -- 增加长度到 1000
        file_size BIGINT,
        file_format VARCHAR(10),
        title VARCHAR(255),
        artist VARCHAR(255),
        album VARCHAR(255),
        duration INT DEFAULT 0,
        cover_url VARCHAR(500),
        lyrics TEXT,
        upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        play_count INT DEFAULT 0,
        is_public BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_music_user (user_id),
        INDEX idx_user_music_title (title),
        INDEX idx_user_music_artist (artist)
      )
    `);
    console.log('✓ 用户个人音乐表创建成功');

    // 音乐表 - 增强版（保留原有的公共音乐表）
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        duration INT NOT NULL DEFAULT 0,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT,
        file_format VARCHAR(10) COMMENT 'mp3, flac, wav等',
        cover_url VARCHAR(500),
        lyrics TEXT,
        uploader_id INT NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        play_count INT DEFAULT 0,
        like_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_music_title (title),
        INDEX idx_music_artist (artist),
        INDEX idx_music_uploader (uploader_id)
      )
    `);
    console.log('✓ 音乐表创建成功');

    // 修改用户喜欢音乐表，支持用户个人音乐
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS user_liked_music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        music_id INT NULL, -- 可以为空，用于关联公共音乐
        user_music_id INT NULL, -- 可以为空，用于关联用户个人音乐
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
        FOREIGN KEY (user_music_id) REFERENCES user_music(id) ON DELETE CASCADE,
        -- 确保至少有一个音乐ID不为空，但不能同时为空
        CHECK (
          (music_id IS NOT NULL AND user_music_id IS NULL) OR 
          (music_id IS NULL AND user_music_id IS NOT NULL)
        ),
        -- 唯一约束，防止重复喜欢同一音乐
        UNIQUE KEY unique_user_music_combination (user_id, music_id, user_music_id),
        INDEX idx_user_liked (user_id, liked_at DESC)
      )
    `);
    console.log('✓ 用户喜欢音乐表创建成功（已支持个人音乐）');

    // 音乐标签表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS music_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        music_id INT NOT NULL,
        tag VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
        INDEX idx_tag (tag),
        UNIQUE KEY unique_music_tag (music_id, tag)
      )
    `);
    console.log('✓ 音乐标签表创建成功');

    // 用户播放历史表 - 修改为支持用户个人音乐
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS user_play_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        music_id INT NULL, -- 可以为空，用于关联公共音乐
        user_music_id INT NULL, -- 可以为空，用于关联用户个人音乐
        play_count INT DEFAULT 1,
        last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_play_time INT DEFAULT 0 COMMENT '总播放时长(秒)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
        FOREIGN KEY (user_music_id) REFERENCES user_music(id) ON DELETE CASCADE,
        -- 确保至少有一个音乐ID不为空，但不能同时为空
        CHECK (
          (music_id IS NOT NULL AND user_music_id IS NULL) OR 
          (music_id IS NULL AND user_music_id IS NOT NULL)
        ),
        UNIQUE KEY unique_user_music_history (user_id, music_id, user_music_id),
        INDEX idx_user_played (user_id, last_played_at DESC)
      )
    `);
    console.log('✓ 用户播放历史表创建成功（已支持个人音乐）');

    // 用户设置表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_setting (user_id, setting_key),
        INDEX idx_user_settings (user_id)
      )
    `);
    console.log('✓ 用户设置表创建成功');

    // 播放列表表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        description TEXT,
        cover_url VARCHAR(500),
        is_public BOOLEAN DEFAULT FALSE,
        song_count INT DEFAULT 0,
        play_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_playlist_user (user_id)
      )
    `);
    console.log('✓ 播放列表表创建成功');

    // 播放列表音乐关联表 - 修改为支持用户个人音乐
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS playlist_music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        playlist_id INT NOT NULL,
        music_id INT NULL, -- 可以为空，用于关联公共音乐
        user_music_id INT NULL, -- 可以为空，用于关联用户个人音乐
        sort_order INT DEFAULT 0 COMMENT '播放顺序',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by INT COMMENT '添加者用户ID',
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
        FOREIGN KEY (user_music_id) REFERENCES user_music(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(id),
        -- 确保至少有一个音乐ID不为空，但不能同时为空
        CHECK (
          (music_id IS NOT NULL AND user_music_id IS NULL) OR 
          (music_id IS NULL AND user_music_id IS NOT NULL)
        ),
        UNIQUE KEY unique_playlist_music (playlist_id, music_id, user_music_id),
        INDEX idx_playlist_order (playlist_id, sort_order)
      )
    `);
    console.log('✓ 播放列表音乐关联表创建成功（已支持个人音乐）');

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

    // 插入默认设置数据
    await insertDefaultSettings();

    console.log('🎉 所有数据库表初始化完成！');

  } catch (error) {
    console.error('❌ 数据库表初始化失败:', error);
    throw error;
  }
};

// 插入默认用户设置
const insertDefaultSettings = async (): Promise<void> => {
  try {
    // 这里可以插入一些默认的系统设置
    // 例如默认音频质量、主题等
    console.log('✓ 默认设置初始化完成');
  } catch (error) {
    console.error('默认设置插入失败:', error);
  }
};

// 数据库迁移脚本（用于已有数据库升级）
// 在 migrateDatabase 函数中添加
export const migrateDatabase = async (): Promise<void> => {
  try {
    console.log('开始检查数据库迁移...');
    
    // 检查表是否存在，如果不存在则创建
    const tables = [
      'users', 'user_profiles', 'user_music', 'music', 'music_tags', 'user_liked_music',
      'user_play_history', 'user_settings', 'playlists', 'playlist_music',
      'sport_sessions', 'sport_tracks', 'shares', 'likes', 'comments'
    ];

    for (const table of tables) {
      const [rows] = await dbPool.execute(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [table]
      );
      
      const tableExists = (rows as any)[0].count > 0;
      
      if (!tableExists) {
        console.log(`⚠️  表 ${table} 不存在，需要重新初始化数据库`);
        await initDatabase();
        return;
      }
    }
    
    // 检查 user_music 表的 file_path 字段长度
    const [columnInfo] = await dbPool.execute(
      `SELECT CHARACTER_MAXIMUM_LENGTH 
       FROM information_schema.columns 
       WHERE table_schema = DATABASE() 
         AND table_name = 'user_music' 
         AND column_name = 'file_path'`
    );
    
    const maxLength = (columnInfo as any)[0]?.CHARACTER_MAXIMUM_LENGTH;
    console.log(`🔍 user_music.file_path 当前长度: ${maxLength}`);
    
    if (maxLength < 1000) {
      console.log('⚠️  检测到 user_music 表需要更新 file_path 字段长度');
      await upgradeUserMusicTable();
    }
    
    // 检查 user_liked_music 表是否有 user_music_id 列
    const [columns] = await dbPool.execute(
      `SELECT COLUMN_NAME FROM information_schema.columns 
       WHERE table_schema = DATABASE() AND table_name = 'user_liked_music' AND column_name = 'user_music_id'`
    );
    
    const hasUserMusicId = (columns as any[]).length > 0;
    
    if (!hasUserMusicId) {
      console.log('⚠️  检测到旧版 user_liked_music 表，需要升级...');
      await upgradeUserLikedMusicTable();
    }
    
    console.log('✓ 数据库表结构检查完成，无需迁移');
  } catch (error) {
    console.error('数据库迁移检查失败:', error);
    throw error;
  }
};

// 升级 user_music 表
const upgradeUserMusicTable = async (): Promise<void> => {
  try {
    console.log('开始升级 user_music 表...');
    
    // 修改 file_path 字段长度
    await dbPool.execute(`
      ALTER TABLE user_music 
      MODIFY COLUMN file_path VARCHAR(1000) NOT NULL
    `);
    
    console.log('✓ user_music 表升级完成');
  } catch (error) {
    console.error('user_music 表升级失败:', error);
    throw error;
  }
};

// 升级用户喜欢音乐表
const upgradeUserLikedMusicTable = async (): Promise<void> => {
  try {
    // 创建临时表备份数据
    await dbPool.execute(`
      CREATE TABLE user_liked_music_backup AS 
      SELECT * FROM user_liked_music
    `);
    
    // 删除原表
    await dbPool.execute(`DROP TABLE user_liked_music`);
    
    // 重新创建表（使用新结构）
    await dbPool.execute(`
      CREATE TABLE user_liked_music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        music_id INT NULL,
        user_music_id INT NULL,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
        FOREIGN KEY (user_music_id) REFERENCES user_music(id) ON DELETE CASCADE,
        CHECK (
          (music_id IS NOT NULL AND user_music_id IS NULL) OR 
          (music_id IS NULL AND user_music_id IS NOT NULL)
        ),
        UNIQUE KEY unique_user_music_combination (user_id, music_id, user_music_id),
        INDEX idx_user_liked (user_id, liked_at DESC)
      )
    `);
    
    // 恢复数据（只恢复 music_id 相关的数据）
    await dbPool.execute(`
      INSERT INTO user_liked_music (user_id, music_id, user_music_id, liked_at)
      SELECT user_id, music_id, NULL, liked_at 
      FROM user_liked_music_backup
    `);
    
    // 删除备份表
    await dbPool.execute(`DROP TABLE user_liked_music_backup`);
    
    console.log('✓ 用户喜欢音乐表升级完成');
  } catch (error) {
    console.error('用户喜欢音乐表升级失败:', error);
    throw error;
  }
};

// 安全的重置数据库函数（仅开发环境使用）
export const resetDatabase = async (): Promise<void> => {
  // 只在开发环境下允许重置
  if (process.env.NODE_ENV !== 'development') {
    console.error('❌ 重置数据库只能在开发环境中执行！');
    return;
  }

  try {
    console.log('⚠️  开始重置数据库...');
    
    // 按依赖关系逆序删除表
    const tablesToDrop = [
      'comments', 'likes', 'shares', 'playlist_music', 'playlists',
      'sport_tracks', 'sport_sessions', 'user_settings', 'user_play_history',
      'user_liked_music', 'music_tags', 'user_profiles', 'user_music', 'music', 'users'
    ];

    // 禁用外键检查
    await dbPool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    for (const table of tablesToDrop) {
      try {
        await dbPool.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✓ 删除表: ${table}`);
      } catch (error) {
        console.log(`⏭️  表 ${table} 不存在，跳过删除`);
      }
    }
    
    // 重新启用外键检查
    await dbPool.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✓ 数据库重置完成，开始重新初始化...');
    await initDatabase();
    
  } catch (error) {
    console.error('❌ 数据库重置失败:', error);
    throw error;
  }
};