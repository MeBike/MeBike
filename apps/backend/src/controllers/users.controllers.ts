import { Request, Response, NextFunction } from 'express'

import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import { LoginReqBody } from '~/models/requests/users.requests'
import User from '~/models/schemas/user.schema'
import usersService from '~/services/users.services'



export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId

  const result = await usersService.login({
    user_id: user_id.toString(),
    verify: user.verify
  })

  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}