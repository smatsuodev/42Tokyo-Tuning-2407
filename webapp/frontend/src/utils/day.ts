import dayjs from "dayjs";

export const formatDateTime = (dateTimeString: string, format: string) => {
  return dayjs(dateTimeString).format(format);
};
