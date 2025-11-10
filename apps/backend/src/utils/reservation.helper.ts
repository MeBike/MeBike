import HTTP_STATUS from "~/constants/http-status"
import { ErrorWithStatus } from "~/models/errors"

export const generateEndTime = (startTime: Date | string, holdHours = 1): Date => {
  const start = new Date(startTime)
  const holdMs = holdHours * 60 * 60 * 1000
  return new Date(start.getTime() + holdMs)
}

export const validateSlotTime = (slot: string): { hour: number; minute: number } => {
  const match = slot.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/)
  if (!match) {
    throw new ErrorWithStatus({
      message: `Định dạng giờ không hợp lệ: ${slot}. Phải là HH:MM (00:00 - 23:59)`,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  const hour = Number(match[1])
  const minute = Number(match[2])
  return { hour, minute }
}

export const applySlotToDate = (date: Date, slotStart: string): { start: Date; end: Date } => {
  const { hour, minute } = validateSlotTime(slotStart)

  const start = new Date(date)
  start.setUTCHours(hour, minute, 0, 0)

  const end = new Date(start)
  end.setUTCHours(end.getHours() + 1)

  return { start, end }
}

export const getHoldHours = (): number => {
  return Number(process.env.HOLD_HOURS_RESERVATION || '1')
}