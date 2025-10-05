declare global {
    namespace Express {
      interface Request {
        user?: JWTPayload; // 保持不变
      }
      
      namespace Multer {
        interface File {
          // 只添加官方类型中没有的自定义属性（如无需额外属性可删除此块）
          // 例如：customField?: string;
        }
      }
    }
  }
  
  export {};