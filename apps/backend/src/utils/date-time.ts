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
            value * 1000
            break;
    
        case TimeType.Minute:
            value * 60 * 1000
            break;
        default:
            value * 60 * 60 * 1000
            break;
    }
    return value
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