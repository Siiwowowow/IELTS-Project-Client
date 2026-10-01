import { httpClient } from "@/lib/axios/httpClient";

export type UserVocabulary = {
  id: string;
  word: string;
  bangla: string;
  pronunciation: string | null;
  partOfSpeech: string;
  definition: string;
  example: string;
  exampleBangla: string | null;
  collocations: string[];
  topic: string;
  level: "Intermediate" | "Advanced";
  simpleExample: string | null;
  compoundExample: string | null;
  complexExample: string | null;
};

export type CreateVocabularyInput = Omit<UserVocabulary, "id">;
export type VocabularyBookmark = { id: string; wordId: string; word: string; meaning: string };
export type VocabularyLibrary = { words: UserVocabulary[]; bookmarks: VocabularyBookmark[] };

export const vocabularyService = {
  getMine: () => httpClient.get<VocabularyLibrary>("/vocabulary/me"),
  createWord: (data: CreateVocabularyInput) => httpClient.post<UserVocabulary>("/vocabulary/words", data),
  deleteWord: (id: string) => httpClient.delete<null>(`/vocabulary/words/${id}`),
  getWords: () => httpClient.get<UserVocabulary[]>("/vocabulary/words"),
  toggleBookmark: (wordId: string, word: string, meaning: string) => httpClient.post<{ bookmarked: boolean; wordId: string }>(`/vocabulary/bookmarks/${encodeURIComponent(wordId)}`, { word, meaning }),
};
