import { Response } from 'express'

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: T
): void => {
  res.status(statusCode).json(data)
}

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: any[]
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    errors
  })
}