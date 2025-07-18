import jwt from 'jsonwebtoken'

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET!
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  )
}

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET!
  
  return jwt.sign(
    { userId, type: 'refresh' },
    secret,
    { expiresIn: '30d' } as any
  )
}

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!)
}