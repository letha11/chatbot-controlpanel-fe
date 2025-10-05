import dotenv from 'dotenv'

dotenv.config()

export const config = {
  internalApiKey: process.env.INTERNAL_API_KEY || '',
}