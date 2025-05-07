import { performStart, performStop } from "./start_stop_env";

export const startHandler = async (event: any): Promise<void> => {
  const checkHoliday = event.checkHoliday === true;
  await performStart(checkHoliday);
};

export const stopHandler = async (event: any): Promise<void> => {
  await performStop();
};
