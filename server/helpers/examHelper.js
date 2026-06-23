import { safeJSON } from "./jsonHelper.js";

export const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const stopWords = new Set([
  "the", "is", "are", "am", "a", "an", "and", "or", "to", "of", "in", "on",
  "for", "with", "by", "as", "it", "this", "that", "has", "have", "be",
  "been", "was", "were", "from", "at", "which", "their", "will", "can",
  "also", "into", "such", "through", "about", "more", "its",
]);

export const getKeywordsFromExpectedAnswer = (expectedAnswer = "") => {
  const words = normalizeText(expectedAnswer)
    .split(" ")
    .filter((word) => word.length >= 4 && !stopWords.has(word));

  return [...new Set(words)];
};

export const evaluateSingle = (submitted, correctAnswers, marks) => {
  const isCorrect = correctAnswers.some((c) => c.answer === submitted);

  return {
    isCorrect,
    marks: isCorrect ? Number(marks) : 0,
  };
};

export const evaluateMultiple = (submitted, correctAnswers, marks) => {
  const correct = correctAnswers.map((c) => c.answer).sort();
  const given = Array.isArray(submitted) ? [...submitted].sort() : [];

  const isCorrect =
    correct.length === given.length &&
    correct.every((ans, index) => ans === given[index]);

  return {
    isCorrect,
    marks: isCorrect ? Number(marks) : 0,
  };
};

export const evaluateBlank = evaluateMultiple;

export const parseExamQuestion = (q) => ({
  ...q,
  options: safeJSON(q.options),
  correctAnswers: safeJSON(q.correctAnswers),
});