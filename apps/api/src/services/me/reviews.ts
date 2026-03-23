import { createPortfolioReview, listPortfolioReviewsByUserId } from "../../repositories/me/reviews";

type SubmitPortfolioReviewInput = {
  readonly userId: string;
  readonly portfolioUrl: string;
  readonly focus: string;
};

export function submitPortfolioReview(input: SubmitPortfolioReviewInput) {
  return createPortfolioReview(input);
}

export function listPortfolioReviewHistory(userId: string) {
  return listPortfolioReviewsByUserId(userId);
}
