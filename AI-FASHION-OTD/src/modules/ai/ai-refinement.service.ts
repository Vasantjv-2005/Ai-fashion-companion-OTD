
export interface RefinementContext {
    previousRecommendationIds: string[];
    userRequest: string;
    preferences?: string[];
    exclusions?: string[];
}

/**
 * Builds a structured payload for the AI outfit-refinement service.
 *
 * This function prepares the request but does not call the AI API.
 * The actual API integration can be added when the AI team's
 * endpoint and request format are confirmed.
 */
export function buildRefinementPayload(
    context: RefinementContext,
) {
    const message = context.userRequest.trim();

    if (!message) {
        throw new Error(
            "A refinement message is required.",
        );
    }

    if (context.previousRecommendationIds.length === 0) {
        throw new Error(
            "At least one previous recommendation ID is required.",
        );
    }

    return {
        message,
        context: {
            previousRecommendationIds: [
                ...context.previousRecommendationIds,
            ],
            preferences: context.preferences ?? [],
            exclusions: context.exclusions ?? [],
        },
    };
}
