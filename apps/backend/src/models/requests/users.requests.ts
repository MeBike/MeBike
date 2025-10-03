import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { JwtPayload } from 'jsonwebtoken'

export interface TokenPayLoad extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  exp: number
  iat: number
}

export interface LoginReqBody {
  email: string
  password: string
}