import { Request, Response, NextFunction } from 'express';

const DEFAULT_USER = {
  id: 'local-dev-user',
  email: 'dev@local.com',
  firstName: 'Local',
  lastName: 'Developer',
};

// Development authentication middleware
export function devAuth(req: Request, res: Response, next: NextFunction) {
  // Always set user in development
  (req as any).user = {
    claims: {
      sub: DEFAULT_USER.id,
      email: DEFAULT_USER.email,
      name: `${DEFAULT_USER.firstName} ${DEFAULT_USER.lastName}`,
    }
  };
  
  // Mark as authenticated
  (req as any).isAuthenticated = () => true;
  
  next();
}

export default devAuth;