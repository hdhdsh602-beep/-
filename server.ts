import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy helper to retrieve Google GenAI client
let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in your environment variables. Please check Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Clean response from Ollama if it wrapped it inside markdown code block
function cleanOllamaJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

// Lazy helper to query Ollama API (e.g. at http://localhost:11434)
async function queryOllama(prompt: string, schema: any | null): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const modelName = process.env.OLLAMA_MODEL || "llama3";

  try {
    const payload: any = {
      model: modelName,
      prompt: prompt,
      stream: false
    };

    if (schema) {
      payload.format = schema;
    }

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      // Set reasonable timeout (25s) so users are not blocked indefinitely
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    const data: any = await response.json();
    return data.response;
  } catch (err: any) {
    if (schema) {
      console.warn("Ollama query with schema failed, falling back to format: 'json'...", err);
      try {
        const response = await fetch(`${ollamaUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            prompt: prompt + "\nRespond with valid JSON adhering strictly to the required keys.",
            stream: false,
            format: "json"
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (!response.ok) {
          throw new Error(`Ollama fallback returned status ${response.status}`);
        }

        const data: any = await response.json();
        return data.response;
      } catch (fallbackErr: any) {
        throw new Error(`حدث خطأ أثناء الاتصال بـ Ollama. تأكد من تشغيل Ollama محلياً باستخدام الأمر: ollama run ${modelName}\nالتفاصيل: ${fallbackErr.message || fallbackErr}`);
      }
    }
    throw new Error(`حدث خطأ أثناء الاتصال بـ Ollama. تأكد من تشغيل Ollama محلياً وثبّت النموذج المناسب.\nالتفاصيل: ${err.message || err}`);
  }
}

// Free translation using LibreTranslate (open source, no API key needed)
async function libreTranslate(text: string, source: string = "en", target: string = "ar"): Promise<string> {
  try {
    const response = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`LibreTranslate returned ${response.status}`);
    const data: any = await response.json();
    return data.translatedText || text;
  } catch (e) {
    console.warn("LibreTranslate failed, using fallback...", e);
    throw e;
  }
}

// Free translation using MyMemory API (1000 words/day free)
async function myMemoryTranslate(text: string, source: string = "en", target: string = "ar"): Promise<string> {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`MyMemory returned ${response.status}`);
    const data: any = await response.json();
    return data.responseData?.translatedText || text;
  } catch (e) {
    console.warn("MyMemory failed, using fallback...", e);
    throw e;
  }
}

// Real-time Translate API to generate high-quality Arabic translated presets on-the-fly!
app.post("/api/translate", async (req, res) => {
  try {
    const { text, fast, provider } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return res.status(400).json({ error: "Text cannot be empty" });
    }

    let prompt = "";
    let schemaConfig: any = null;

    if (fast) {
      prompt = `Translate the following English phrase or sentence into a natural and highly accurate Arabic translation: "${trimmedText}"
Respond strictly with a single JSON object. Do not include markdown code block characters. The JSON must feature these exact keys:
1. title: A short Arabic label (e.g. "ترجمة سريعة")
2. english: The exact English source text.
3. arabic: The accurate translation in Arabic.
4. category: A short Arabic category.
5. phonetics: Phonetic pronunciation guide (e.g., "[kɔːʃn]").`;

      schemaConfig = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          english: { type: Type.STRING },
          arabic: { type: Type.STRING },
          category: { type: Type.STRING },
          phonetics: { type: Type.STRING }
        },
        required: ["title", "english", "arabic", "category", "phonetics"]
      };
    } else {
      prompt = `Translate the following English phrase or sentence into a natural, highly accurate Arabic translation suitable for smart educational AR glasses. Also provide an educational phonetic transcription, category, a friendly educational grammar/linguistic tip in Arabic, and a brand new educational example sentence in English using a key word from the text, with its Arabic translation.

Additionally, extract up to 5 key vocabulary words from the text and provide their part of speech, Arabic meaning, phonetic guide, and a fast Arabic educational usage explanation for each, so that the student can study them interactively.

English Text to translate: "${trimmedText}"

Respond strictly with a single JSON object. Do not include markdown code block characters. The JSON must feature these exact keys:
1. title: A short descriptive Arabic label for the visual content (e.g. "لافتة طريق تحذيرية", "قائمة طعام", "ملاحظة دراسية", "ترجمة نص")
2. english: The exact English text to translate.
3. arabic: The accurate translation in Arabic (rich, educational, and clean).
4. category: A short Arabic category (e.g. "شارع وتنقل", "طعام وضيافة", "أدلة عامة", "تعليم لغوي").
5. phonetics: Phonetic visual pronunciation guide (e.g., "[kɔːʃn]").
6. grammarTip: A helpful, friendly explanation in Arabic of any grammar rule, structure, or vocabulary nuance present in this sentence (e.g., imperative verbs, passive form, perfect tense, or word choice).
7. exampleEn: A helpful example sentence in English showing key vocabulary use.
8. exampleAr: Arabic translation of that example sentence.
9. vocabulary: An array of key English words extracted from the text, each represented as an object with: "word", "type" (part of speech like noun, verb, adjective, preposition), "meaning" (Arabic translation), "phonetic" (pronunciation guide), and "explanation" (very brief Arabic tutorial tip).`;

      schemaConfig = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          english: { type: Type.STRING },
          arabic: { type: Type.STRING },
          category: { type: Type.STRING },
          phonetics: { type: Type.STRING },
          grammarTip: { type: Type.STRING },
          exampleEn: { type: Type.STRING },
          exampleAr: { type: Type.STRING },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                type: { type: Type.STRING },
                meaning: { type: Type.STRING },
                phonetic: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["word", "type", "meaning", "phonetic", "explanation"]
            }
          }
        },
        required: ["title", "english", "arabic", "category", "phonetics", "grammarTip", "exampleEn", "exampleAr", "vocabulary"]
      };
    }

    let parsedJson;

    // Free translation providers (LibreTranslate, MyMemory) - simple text translation only
    if (provider === "libre") {
      const translatedText = await libreTranslate(trimmedText);
      parsedJson = {
        title: "ترجمة حرة",
        english: trimmedText,
        arabic: translatedText,
        category: "ترجمة عامة",
        phonetics: ""
      };
    } else if (provider === "mymemory") {
      const translatedText = await myMemoryTranslate(trimmedText);
      parsedJson = {
        title: "ترجمة سريعة",
        english: trimmedText,
        arabic: translatedText,
        category: "ترجمة عامة",
        phonetics: ""
      };
    } else if (provider === "ollama") {
      const responseText = await queryOllama(prompt, schemaConfig);
      parsedJson = JSON.parse(cleanOllamaJson(responseText));
    } else {
      // Default: Gemini AI (best quality)
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schemaConfig
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from GenAI model");
      }
      parsedJson = JSON.parse(resultText.trim());
    }

    res.json(parsedJson);

  } catch (err: any) {
    console.error("Translation server-side error: ", err);
    res.status(500).json({ error: err.message || "Failed to process translation" });
  }
});

// Real-time Conversation Voice Speech Coach API!
app.post("/api/speech-coach", async (req, res) => {
  try {
    const { text, direction, fast, provider } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Speech text is required" });
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return res.status(400).json({ error: "Speech text cannot be empty" });
    }

    const activeDirection = direction === "ar_to_en" ? "ar_to_en" : "en_to_ar";

    let prompt = "";
    let schemaConfig: any = null;

    if (fast) {
      const srcLang = activeDirection === "ar_to_en" ? "Arabic" : "English";
      const tgtLang = activeDirection === "ar_to_en" ? "English" : "Arabic";
      prompt = `Correct the spoken ${srcLang} phrase/sentence and provide its natural and highly accurate ${tgtLang} translation: "${trimmedText}"
Respond strictly with a single JSON object. Do not include markdown code block characters or formatting. The JSON must feature these exact keys:
1. originalText: Corrected original phrasing or speech transcription typos.
2. translatedText: The accurate translation into ${tgtLang}.
3. phonetics: Visual phonetic pronunciation guide of the English phrasing (e.g. "[haʊ vɛri naɪs]").
4. category: A short Arabic category indicating context.`;

      schemaConfig = {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING },
          translatedText: { type: Type.STRING },
          phonetics: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["originalText", "translatedText", "phonetics", "category"]
      };
    } else {
      prompt = `You are an expert bilingual speech-to-speech translator and interactive language acquisition coach (LingoLens Co-Pilot).
Analyze the following text input captured from an interactive speech signal.
Input Text: "${trimmedText}"
Translation Direction: "${activeDirection}" (en_to_ar means user spoke English and wants Arabic coaching, ar_to_en means user spoke Arabic and wants to learn corresponding premium English phrasing).

Respond strictly with a single JSON object. Do not include markdown code block characters or formatting. The JSON must feature these exact keys:
1. originalText: Cleaned and corrected original input text with any minor speech transcription typos or spacing issues corrected.
2. translatedText: The highest quality natural and educational translation (into Arabic for en_to_ar, or into English for ar_to_en).
3. phonetics: Visual phonetic pronunciation guide of the English text (e.g. "[haʊ vɛri naɪs]").
4. category: A short Arabic category showing context (e.g. "حوار يومي", "سفر ومطارات", "إدارة وتواصل").
5. grammarInsight: An expert linguistic and grammar tip in Arabic explaining helpers, construct patterns, word ordering, or cultural context.
6. scores: An object rating the speaking metrics to gamify the lesson:
   - fluency: (integer, 1-100) estimated level of flow.
   - vocabulary: (integer, 1-100) estimated vocabulary structure depth.
   - complexity: (integer, 1-100) estimated sentence complexity.
   - feedback: (string) a helpful brief 1-sentence tip in Arabic advising on how to perfect the pronunciation, tone, or sentence structure.
7. alternativePhrasing: An array of 3 native alternative English ways to formulate the same thought, with their respective Arabic translation in parentheses in the same string.
8. vocabulary: An array of up to 5 key vocabulary words, each represented as an object with: "word", "role" (part of speech like noun, verb, adj in Arabic), "translation" (Arabic meaning), "phonetics" (phonetic guide), and "guide" (very brief educational explanation of how to use it).`;

      schemaConfig = {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING },
          translatedText: { type: Type.STRING },
          phonetics: { type: Type.STRING },
          category: { type: Type.STRING },
          grammarInsight: { type: Type.STRING },
          scores: {
            type: Type.OBJECT,
            properties: {
              fluency: { type: Type.INTEGER },
              vocabulary: { type: Type.INTEGER },
              complexity: { type: Type.INTEGER },
              feedback: { type: Type.STRING }
            },
            required: ["fluency", "vocabulary", "complexity", "feedback"]
          },
          alternativePhrasing: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                role: { type: Type.STRING },
                translation: { type: Type.STRING },
                phonetics: { type: Type.STRING },
                guide: { type: Type.STRING }
              },
              required: ["word", "role", "translation", "phonetics", "guide"]
            }
          }
        },
        required: ["originalText", "translatedText", "phonetics", "category", "grammarInsight", "scores", "alternativePhrasing", "vocabulary"]
      };
    }

    let parsedJson;
    if (provider === "ollama") {
      const responseText = await queryOllama(prompt, schemaConfig);
      parsedJson = JSON.parse(cleanOllamaJson(responseText));
    } else {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schemaConfig
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from GenAI model");
      }
      parsedJson = JSON.parse(resultText.trim());
    }

    res.json(parsedJson);

  } catch (err: any) {
    console.error("Speech coach server-side error: ", err);
    res.status(500).json({ error: err.message || "Failed to process speech coaching" });
  }
});

// Real-time Scenario Roleplay AI Coach API!
app.post("/api/scenario-coach", async (req, res) => {
  try {
    const { scenarioId, history, userMessage, provider } = req.body;
    
    const validScenarios: Record<string, { title: string; rolePrompt: string; initEn: string; initAr: string }> = {
      airport: {
        title: "إنهاء إجراءات السفر في المطار الدولي (International Airport Terminal)",
        rolePrompt: "You are a polite airport immigration and check-in officer helper (Mr. Harris) at JFK Airport. Converse with the user who is checking in for their flight.",
        initEn: "Hello, passport and boarding ticket please. Are you checking any bags today?",
        initAr: "مرحباً، جواز السفر وتذكرة صعود الطائرة من فضلك. هل تود شحن أي حقائب اليوم؟"
      },
      restaurant: {
        title: "طلب الوجبات في مطعم رفيع (Fine Dining Restaurant)",
        rolePrompt: "You are a gourmet restaurant waiter (Thomas) at a premium bistro. Take the user's order and suggest nice options.",
        initEn: "Good evening, welcome to the Chef's Bistro. May I start you off with some drinks or appetisers?",
        initAr: "مساء الخير، أهلاً بك في بيسترو الشيف. هل تحب أن نبدأ ببعض المشروبات أو المقبلات؟"
      },
      hotel: {
        title: "حجز غرف وخدمات الفندق (Hotel Reception Desk)",
        rolePrompt: "You are a warm, professional hotel receptionist (Clara) at a premium hotel resort. Check the user in and advise on amenities.",
        initEn: "Welcome to our resort! I can see your reservation under the name. Could we confirm the room preference?",
        initAr: "أهلاً بك في منتجعنا! أرى حجزك بالفعل. هل يمكننا تأكيد خيار غرفتك المفضلة؟"
      },
      interview: {
        title: "مقابلة توظيف تفاعلية (Interactive Job Interview)",
        rolePrompt: "You are an HR Manager (Sarah) conducting a friendly job interview for an administrative and coordinator role. Ask professional questions.",
        initEn: "Thanks for coming in today. To start off, could you tell me a little bit about yourself and your key strengths?",
        initAr: "شكراً لحضورك المقابلة اليوم. للبدء، هل يمكنك إخباري بقليل عن نفسك وأبرز نقاط قوتك؟"
      },
      taxi: {
        title: "مخاطبة سائق تاكسي وتحديد الوجهة (Taxi & Transport Ride)",
        rolePrompt: "You are an urban taxi driver (Jimmy) in London. Drive the user to their destination, negotiate fees or direct them politely.",
        initEn: "Hop in! Where can I take you today? I hope you don't mind taking the highway, it's faster.",
        initAr: "تفضل بالركوب! إلى أين نتوجه اليوم؟ أرجو ألا مانع لديك من سلك الطريق السريع، فهو أسرع."
      }
    };

    const scenario = validScenarios[scenarioId] || validScenarios.airport;

    // Format chat history for Gemini
    let formattedHistory = "";
    if (Array.isArray(history)) {
      formattedHistory = history.map((h: any) => `${h.sender === "coach" ? "Coach Persona" : "Student User"}: ${h.text}`).join("\n");
    }

    const prompt = `You are playing an exquisite educational conversational roleplay scenario as a language partner.
Your Role instructions: "${scenario.rolePrompt}"
Scenario Context: "${scenario.title}"

Below is the dialogue history for context:
${formattedHistory}

The Student User has replied with this text/speech signal: "${userMessage || ""}"

Respond strictly with a single JSON object. Do not include markdown code block characters like \`\`\`json. The JSON must feature these exact keys:
1. coachReplyEn: Your natural conversational response in English. Keep it brief, polite, and encouraging (1 to 2 sentences maximum).
2. coachReplyAr: The high-quality Arabic translation of your reply, so the student can easily understand context.
3. helperHint: A helpful tip in Arabic advising the user on what they can say in their next reply (e.g. suggesting realistic options or giving a sample sentence they might tweak).
4. feedback: An expert speech-coaching feedback in Arabic on the user's latest message. Correct any minor grammar/vocabulary mistakes they made, or praise their vocabulary choice if perfect.
5. pronunciation: Phonetic guides for the English reply you just gave (e.g. "[həˈloʊ plenz]") so they can read and pronounce your reply.
6. usefulVocabulary: An array of up to 3 helpful words/collocations from the exchange, each with "word" (English), "translation" (Arabic meaning), and "phonetic" (English phonetics guide).`;

    const schemaConfig = {
      type: Type.OBJECT,
      properties: {
        coachReplyEn: { type: Type.STRING },
        coachReplyAr: { type: Type.STRING },
        helperHint: { type: Type.STRING },
        feedback: { type: Type.STRING },
        pronunciation: { type: Type.STRING },
        usefulVocabulary: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              translation: { type: Type.STRING },
              phonetic: { type: Type.STRING }
            },
            required: ["word", "translation", "phonetic"]
          }
        }
      },
      required: ["coachReplyEn", "coachReplyAr", "helperHint", "feedback", "pronunciation", "usefulVocabulary"]
    };

    let parsedJson;
    if (provider === "ollama") {
      const responseText = await queryOllama(prompt, schemaConfig);
      parsedJson = JSON.parse(cleanOllamaJson(responseText));
    } else {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schemaConfig
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from GenAI scenario engine");
      }
      parsedJson = JSON.parse(resultText.trim());
    }

    res.json(parsedJson);

  } catch (err: any) {
    console.error("Scenario coach server-side error: ", err);
    res.status(500).json({ error: err.message || "Failed to process roleplay scenario coaching" });
  }
});

// Real-time Interactive AI Pronunciation Coach & Makharij correction!
app.post("/api/pronunciation-coach", async (req, res) => {
  try {
    const { targetText, spokenText, language, provider } = req.body;
    if (!targetText || !spokenText) {
      return res.status(400).json({ error: "Both target text and spoken text are required." });
    }

    const activeLang = language === "ar-SA" ? "Arabic" : "English";
    
    const prompt = `You are "Al-Moallem Al-Zaki" (المعلم الذكي للأصوات ومخارج الحروف), an elite speech-language pathologist, expert bilingual phonetician, and encouraging speech therapist inside the "LingoLens" smart glasses app.
Your task is to analyze the student's spoken/recorded text of a specific target phrase and give a professional, detailed phonetic and pronunciation correction (focusing on "مخارج الحروف" - phonetic exits, vowels, tension, breath, and tongue or lip positioning).

Target phrase: "${targetText}"
Student uttered/spoken transcript: "${spokenText}"
Language of spoken phrase: ${activeLang}

Analyze exactly how close the student got. Keep in mind that speech-to-text models might misrecognize sounds if spoken with an accent, so evaluate carefully.
Provide a comforting, extremely professional Arabic correction including:
1. An overall score (0 to 100). If the spoken transcript perfectly or almost perfectly matches the target phrase, give a high score (90-100) and say "متقن وصحيح تماماً!". If they omitted or heavily mispronounced key parts, give a lower score reflecting the accuracy.
2. A very detailed, professional Arabic teacher feedback ("arabicFeedback") explaining which letters/syllables might have been mispronounced (e.g., getting the 'vowel' sounds short, or pronouncing some consonants with the wrong throat or mouth position) and how to fix them. Give practical instructions on how to pronounce it like a native. For example: "في كلمة Welcome، يبدو أنك فخمت حرف اللام كحرف اللام العربي المفخم، تذكر أن اللام في الإنجليزية تكون مرققة وخفيفة هنا. أيضاً، احرص على جعل الشفتين مستديرتين لنطق حرف W بشكل صحيح."
3. An "evaluatedWords" list of ALL individual words in the Target phrase (split the Target phrase correctly). For each word specify:
   - "word": representing the target word.
   - "status": must be either "correct" (fully correct), "imperfect" (accent issues, vowel errors, partial mispronunciation), or "missing" (word was omitted or spoken entirely wrong).
   - "phonemeTips": brief, quick 1-sentence tip in Arabic on how to pronounce this specific word correctly (e.g. how the lips, tongue, or breath should shift).
4. "oralGuidance": A short 1-sentence supportive voice guidance in Arabic (or English if they were speaking Arabic, or Arabic if they were speaking English) that the coach will dictate/speak out loud to the user (e.g. "أقرب كثيراً! انتبه لنطق حرف الواو في البداية واستمع لتقليدي.").

Respond strictly with a single JSON object. Do not include markdown code block characters or formatting. The JSON must feature these exact keys:
{
  "score": integer,
  "isPerfect": boolean,
  "arabicFeedback": "string",
  "evaluatedWords": [
    { "word": "string", "status": "string", "phonemeTips": "string" }
  ],
  "oralGuidance": "string"
}`;

    const schemaConfig = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        isPerfect: { type: Type.BOOLEAN },
        arabicFeedback: { type: Type.STRING },
        oralGuidance: { type: Type.STRING },
        evaluatedWords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              status: { type: Type.STRING }, // "correct", "imperfect", "missing"
              phonemeTips: { type: Type.STRING }
            },
            required: ["word", "status", "phonemeTips"]
          }
        }
      },
      required: ["score", "isPerfect", "arabicFeedback", "oralGuidance", "evaluatedWords"]
    };

    let parsedJson;
    if (provider === "ollama") {
      const responseText = await queryOllama(prompt, schemaConfig);
      parsedJson = JSON.parse(cleanOllamaJson(responseText));
    } else {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schemaConfig
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from GenAI pronunciation engine");
      }
      parsedJson = JSON.parse(resultText.trim());
    }

    res.json(parsedJson);

  } catch (err: any) {
    console.error("Pronunciation coach server error: ", err);
    res.status(500).json({ error: err.message || "Failed to process pronunciation coaching" });
  }
});


// Real-time general purpose AI LingoLens Advisor Chat API!
app.post("/api/copilot", async (req, res) => {
  try {
    const { prompt, history, userRank, provider } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt message is required" });
    }

    // Set up a friendly bilingual tutoring persona
    const systemInstruction = `You are Mr. Mansour (الأستاذ منصور), an enthusiastic, polite, and expert bilingual (Arabic-English) language teacher and AI Copilot inside the "LingoLens" smart glasses app.
Your goal is to help students of various levels (current user level: "${userRank || "beginner"}") learn English, correct their grammar, explain complex linguistic nuances, conjugate verbs, write formal letters, or translate phrases.
Provide a friendly, highly professional response in Arabic, and include clearly formatted English examples with intuitive Arabic translations in parentheses next to them. If appropriate, use tables and bullet points to organize definitions. Always maintain a highly encouraging and supportive educational tone. Keep explanations clear, scannable, and extremely practical.`;

    let replyText = "";

    if (provider === "ollama") {
      // Build a prompt context with history for Ollama
      let ollamaPrompt = `System/Instructions:\n${systemInstruction}\n\n`;
      if (Array.isArray(history)) {
        for (const msg of history) {
          const roleLabel = msg.role === 'user' ? 'Student' : 'Mr. Mansour';
          const textVal = msg.parts?.[0]?.text || "";
          if (textVal) {
            ollamaPrompt += `${roleLabel}: ${textVal}\n`;
          }
        }
      }
      ollamaPrompt += `Student: ${prompt}\nMr. Mansour:`;

      // Query Ollama in text mode (schema layout is null)
      replyText = await queryOllama(ollamaPrompt, null);
    } else {
      const ai = getAiClient();
      // Construct dialog history for Gemini
      const contents = [];
      if (Array.isArray(history)) {
        for (const msg of history) {
          if (msg.role === 'user' || msg.role === 'model') {
            contents.push({
              role: msg.role,
              parts: [{ text: msg.parts[0]?.text || "" }]
            });
          }
        }
      }
      
      // Add current user prompt
      contents.push({
        role: "user",
        parts: [{ text: prompt }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      replyText = response.text || "";
    }

    res.json({ reply: replyText || "عذراً يا صديقي، لم أستطع صياغة رد مناسب حالياً." });

  } catch (err: any) {
    console.error("AI Copilot server-side error: ", err);
    res.status(500).json({ error: err.message || "Failed to process AI copilot tutoring" });
  }
});

// Real-time complete lecture/lecture translation & pagination layout API!
app.post("/api/translate-lecture", async (req, res) => {
  try {
    const { text, provider } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return res.status(400).json({ error: "Text cannot be empty" });
    }

    const prompt = `You are the bilingual intelligence of LingoLens smart glasses. The user has finished or is requesting a complete translation of a long voice-recognition session of a lecture, explanation, or meeting which may have been running for over an hour.
Your task is to:
1. Translate the original text (usually English) into natural, highly professional, and grammatically rich Arabic.
2. Structure the text logically into comfortable, well-formatted pages.
3. CRITICAL INSTRUCTION FOR LONG CONTENT (UP TO AND EXCEEDING 1000 WORDS): If the input text is long (especially approaching or exceeding 1000 words), you MUST split it into longer pages ("صفحات طويلة"). Each page should contain a substantial portion of the text (about 400 to 600 words per page to ensure a serious book-like reading experience without creating too many shallow pages). Minimize the number of pages by making them rich and long.
4. If the text is short, put all of it on a single page (Page 1).
5. For each page, generate:
   - pageNumber: integer starting from 1.
   - originalText: the source language text for this page.
   - translatedText: the Arabic translation for this page text.
   - summary: a high-quality 2-3 sentence Arabic summary of the key themes of this page.
   - grammarInsights: educational and helpful grammar, idiom, or word-choice tips in Arabic corresponding to formulas or phrases used on this page.
   - keyVocabulary: an array of up to 5 key vocabulary words/phrases with "word", "meaning" (Arabic translation), and "phonetic" guide.

Source text to translate and paginate:
"${trimmedText}"

Respond strictly with a JSON object. Do not include markdown headers or code block tags. The JSON structure must feature: "totalWords" and "pages" collection.`;

    const schemaConfig = {
      type: Type.OBJECT,
      properties: {
        totalWords: { type: Type.INTEGER },
        pages: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pageNumber: { type: Type.INTEGER },
              originalText: { type: Type.STRING },
              translatedText: { type: Type.STRING },
              summary: { type: Type.STRING },
              grammarInsights: { type: Type.STRING },
              keyVocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    phonetic: { type: Type.STRING }
                  },
                  required: ["word", "meaning", "phonetic"]
                }
              }
            },
            required: ["pageNumber", "originalText", "translatedText", "summary", "grammarInsights", "keyVocabulary"]
          }
        }
      },
      required: ["totalWords", "pages"]
    };

    let parsedJson;
    if (provider === "ollama") {
      const responseText = await queryOllama(prompt, schemaConfig);
      parsedJson = JSON.parse(cleanOllamaJson(responseText));
    } else {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schemaConfig
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response from lecture translation server");
      }
      parsedJson = JSON.parse(resultText.trim());
    }

    res.json(parsedJson);

  } catch (err: any) {
    console.error("Lecture translation server error: ", err);
    res.status(500).json({ error: err.message || "فشلت ترجمة وتقسيم المحاضرة" });
  }
});

// Configure Vite or Static Asset delivery
async function setupViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from dist/ folder.");
  }
}

setupViteMiddleware().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
});
