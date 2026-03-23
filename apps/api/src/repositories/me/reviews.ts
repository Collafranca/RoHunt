export type PortfolioReviewRequest = {
  readonly id: string;
  readonly userId: string;
  readonly portfolioUrl: string;
  readonly focus: string;
  readonly status: "queued";
  readonly createdAt: string;
};

type CreatePortfolioReviewInput = {
  readonly userId: string;
  readonly portfolioUrl: string;
  readonly focus: string;
};

const portfolioReviewsByUserId = new Map<string, PortfolioReviewRequest[]>();
let portfolioReviewSequence = 0;

export function listPortfolioReviewsByUserId(userId: string): PortfolioReviewRequest[] {
  return [...(portfolioReviewsByUserId.get(userId) ?? [])];
}

export function createPortfolioReview(input: CreatePortfolioReviewInput): PortfolioReviewRequest {
  portfolioReviewSequence += 1;

  const review: PortfolioReviewRequest = {
    id: `portfolio_review_${portfolioReviewSequence}`,
    userId: input.userId,
    portfolioUrl: input.portfolioUrl,
    focus: input.focus,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  const existing = portfolioReviewsByUserId.get(input.userId) ?? [];
  existing.push(review);
  portfolioReviewsByUserId.set(input.userId, existing);

  return review;
}
