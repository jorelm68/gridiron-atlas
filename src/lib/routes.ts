/** URL helpers shared by server and client components. */
export const teamHref = (franchiseId: string) => `/teams/${franchiseId.toLowerCase()}`;
export const statHref = (statId: string) => `/learn/stats/${statId}`;
export const leagueTopicHref = (topicId: string) => `/learn/league/${topicId}`;
export const playerHref = (playerId: string) => `/players/${encodeURIComponent(playerId)}`;
export const gameHref = (gameId: string) => `/games/${encodeURIComponent(gameId)}`;
