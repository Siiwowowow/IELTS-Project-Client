export type VocabularyWord = {
  id: string;
  word: string;
  bangla: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  exampleBangla: string;
  collocations: string[];
  topic: string;
  level: "Intermediate" | "Advanced";
  simpleExample?: string;
  compoundExample?: string;
  complexExample?: string;
};

export const ieltsVocabulary: VocabularyWord[] = [
  { id: "allocate", word: "allocate", bangla: "বরাদ্দ করা", pronunciation: "/ˈæləkeɪt/", partOfSpeech: "verb", definition: "to distribute something for a particular purpose", example: "Governments should allocate more funding to public education.", exampleBangla: "সরকারের সরকারি শিক্ষায় আরও অর্থ বরাদ্দ করা উচিত।", collocations: ["allocate resources", "allocate funding", "allocate time"], topic: "Education", level: "Intermediate" },
  { id: "curriculum", word: "curriculum", bangla: "পাঠ্যক্রম", pronunciation: "/kəˈrɪkjələm/", partOfSpeech: "noun", definition: "the subjects included in a course of study", example: "Financial literacy should be included in the school curriculum.", exampleBangla: "আর্থিক সাক্ষরতা স্কুলের পাঠ্যক্রমে অন্তর্ভুক্ত করা উচিত।", collocations: ["school curriculum", "national curriculum", "revise a curriculum"], topic: "Education", level: "Intermediate" },
  { id: "detrimental", word: "detrimental", bangla: "ক্ষতিকর", pronunciation: "/ˌdetrɪˈmentl/", partOfSpeech: "adjective", definition: "causing harm or damage", example: "Excessive screen time can be detrimental to children's health.", exampleBangla: "অতিরিক্ত স্ক্রিন টাইম শিশুদের স্বাস্থ্যের জন্য ক্ষতিকর হতে পারে।", collocations: ["detrimental effect", "detrimental to health", "potentially detrimental"], topic: "Technology", level: "Advanced" },
  { id: "mitigate", word: "mitigate", bangla: "প্রশমিত করা", pronunciation: "/ˈmɪtɪɡeɪt/", partOfSpeech: "verb", definition: "to make a harmful situation less severe", example: "Renewable energy can help mitigate the effects of climate change.", exampleBangla: "নবায়নযোগ্য জ্বালানি জলবায়ু পরিবর্তনের প্রভাব প্রশমিত করতে সাহায্য করতে পারে।", collocations: ["mitigate risk", "mitigate the impact", "mitigating factors"], topic: "Environment", level: "Advanced" },
  { id: "sustainable", word: "sustainable", bangla: "টেকসই", pronunciation: "/səˈsteɪnəbl/", partOfSpeech: "adjective", definition: "able to continue without damaging the environment", example: "Cities need sustainable public transport systems.", exampleBangla: "শহরগুলোতে টেকসই গণপরিবহন ব্যবস্থা প্রয়োজন।", collocations: ["sustainable development", "sustainable solution", "environmentally sustainable"], topic: "Environment", level: "Intermediate" },
  { id: "inevitable", word: "inevitable", bangla: "অনিবার্য", pronunciation: "/ɪnˈevɪtəbl/", partOfSpeech: "adjective", definition: "certain to happen and impossible to avoid", example: "Some degree of automation in the workplace is inevitable.", exampleBangla: "কর্মক্ষেত্রে কিছু মাত্রার স্বয়ংক্রিয়তা অনিবার্য।", collocations: ["seem inevitable", "inevitable consequence", "almost inevitable"], topic: "Technology", level: "Intermediate" },
  { id: "disparity", word: "disparity", bangla: "বৈষম্য", pronunciation: "/dɪˈspærəti/", partOfSpeech: "noun", definition: "a noticeable and often unfair difference", example: "The policy aims to reduce the disparity between urban and rural areas.", exampleBangla: "নীতিটির লক্ষ্য শহর ও গ্রামের মধ্যকার বৈষম্য কমানো।", collocations: ["income disparity", "regional disparity", "reduce disparity"], topic: "Society", level: "Advanced" },
  { id: "prevalent", word: "prevalent", bangla: "ব্যাপকভাবে প্রচলিত", pronunciation: "/ˈprevələnt/", partOfSpeech: "adjective", definition: "common or widespread in a particular area or time", example: "Remote working has become increasingly prevalent.", exampleBangla: "দূরবর্তী কাজ ক্রমশ ব্যাপকভাবে প্রচলিত হয়ে উঠেছে।", collocations: ["highly prevalent", "increasingly prevalent", "prevalent among"], topic: "Society", level: "Advanced" },
  { id: "facilitate", word: "facilitate", bangla: "সহজতর করা", pronunciation: "/fəˈsɪlɪteɪt/", partOfSpeech: "verb", definition: "to make an action or process easier", example: "Digital tools can facilitate collaboration between students.", exampleBangla: "ডিজিটাল সরঞ্জাম শিক্ষার্থীদের মধ্যে সহযোগিতা সহজতর করতে পারে।", collocations: ["facilitate learning", "facilitate communication", "facilitate access"], topic: "Education", level: "Advanced" },
  { id: "conventional", word: "conventional", bangla: "প্রচলিত", pronunciation: "/kənˈvenʃənl/", partOfSpeech: "adjective", definition: "based on traditional or generally accepted methods", example: "Online courses challenge conventional methods of teaching.", exampleBangla: "অনলাইন কোর্স প্রচলিত শিক্ষাদান পদ্ধতিকে চ্যালেঞ্জ করে।", collocations: ["conventional method", "conventional wisdom", "conventional approach"], topic: "Education", level: "Intermediate" },
  { id: "depletion", word: "depletion", bangla: "নিঃশেষ হয়ে যাওয়া", pronunciation: "/dɪˈpliːʃn/", partOfSpeech: "noun", definition: "a reduction in the amount of something", example: "The depletion of natural resources threatens future generations.", exampleBangla: "প্রাকৃতিক সম্পদের নিঃশেষ ভবিষ্যৎ প্রজন্মকে হুমকির মুখে ফেলে।", collocations: ["resource depletion", "ozone depletion", "rapid depletion"], topic: "Environment", level: "Advanced" },
  { id: "empirical", word: "empirical", bangla: "পর্যবেক্ষণভিত্তিক", pronunciation: "/ɪmˈpɪrɪkl/", partOfSpeech: "adjective", definition: "based on observation or experience rather than theory", example: "The argument is supported by empirical evidence.", exampleBangla: "যুক্তিটি পর্যবেক্ষণভিত্তিক প্রমাণ দ্বারা সমর্থিত।", collocations: ["empirical evidence", "empirical research", "empirical data"], topic: "Education", level: "Advanced" },
];

export const vocabularyTopics = ["All", "Education", "Environment", "Technology", "Society"] as const;
