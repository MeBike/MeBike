import { TimeType } from "~/constants/enums";

export const getLocalTime = () => {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);
    return localTime
}

const toMs = (from: TimeType, value: number) => {
    switch (from) {
        case TimeType.Second:
            return value * 1000
    
        case TimeType.Minute:
            return value * 60 * 1000

        default:
            return value * 60 * 60 * 1000
    }
}

export const fromHoursToMs = (value: number) => {
    return toMs(TimeType.Hour, value)
}

export const fromMinutesToMs = (value: number) => {
    return toMs(TimeType.Minute, value)
}

export const fromSecondsToMs = (value: number) => {
    return toMs(TimeType.Second, value)
}

export const formatUTCDateToVietnamese = (dateStr: string) => {
  const date = new Date(dateStr)
  const days = [
    'Chủ Nhật', 'Thứ Hai', 'Thứ Ba',
    'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'
  ]
  const dayName = days[date.getUTCDay()]

  const day = date.getUTCDate().toString().padStart(2, '0')
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const year = date.getUTCFullYear()

  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')

  return `${dayName}, ngày ${day}/${month}/${year} lúc ${hours} giờ ${minutes} phút`
}
