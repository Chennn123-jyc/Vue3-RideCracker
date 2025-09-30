export const getAvatarUrl = (avatarPath?: string | null): string => {
    // 如果没有头像或头像为空，使用默认头像
    if (!avatarPath) {
      return '/images/default-avatar.jpg'; // 使用相对路径
    }
    
    // 如果是数据URL（base64格式），直接返回
    if (avatarPath.startsWith('data:image/')) {
      return avatarPath;
    }
    
    // 如果是相对路径或绝对URL，直接返回
    return avatarPath;
  };