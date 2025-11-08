export const generateEndTime = (startTime: Date | string, holdHours = 1): Date => {
  const start = new Date(startTime)
  const holdMs = holdHours * 60 * 60 * 1000
  return new Date(start.getTime() + holdMs)
}

export const fromMinutesToMs = (minutes: number): number => minutes * 60 * 1000

export const validateSlotTime = (slot: string): { hour: number; minute: number } => {
  const [h, m] = slot.split(':').map(Number)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Giờ không hợp lệ: ${slot}`)
  }
  return { hour: h, minute: m }
}

export const applySlotToDate = (date: Date, slotStart: string, slotEnd: string): { start: Date; end: Date } => {
  const { hour: sh, minute: sm } = validateSlotTime(slotStart)
  const { hour: eh, minute: em } = validateSlotTime(slotEnd)

  const start = new Date(date)
  start.setHours(sh, sm, 0, 0)

  const end = new Date(start)
  end.setHours(eh, em, 0, 0)

  if (end <= start) throw new Error('slot_end phải lớn hơn slot_start')
  return { start, end }
}

export const getHoldHours = (): number => {
  return Number(process.env.HOLD_HOURS_RESERVATION || '1')
}