import { createBackgroundCheck, listBackgroundChecksByUserId } from "../../repositories/me/checks";

type SubmitBackgroundCheckInput = {
  readonly userId: string;
  readonly targetUserId: string;
  readonly note: string;
};

export function submitBackgroundCheck(input: SubmitBackgroundCheckInput) {
  return createBackgroundCheck(input);
}

export function listBackgroundCheckHistory(userId: string) {
  return listBackgroundChecksByUserId(userId);
}
