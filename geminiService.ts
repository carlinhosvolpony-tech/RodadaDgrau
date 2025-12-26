
import { GoogleGenAI, Type } from "@google/genai";
import { Match } from "./types";

// Initialize the Google GenAI SDK with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getVolponyIndicaPicks = async (matches: Match[]): Promise<('H' | 'D' | 'A')[]> => {
  try {
    // Check if API key is available. Assume process.env.API_KEY is handled externally.
    if (!process.env.API_KEY) {
      console.warn("API_KEY não configurada. Usando palpites aleatórios.");
      return Array(12).fill(null).map(() => (['H', 'D', 'A'][Math.floor(Math.random() * 3)])) as ('H' | 'D' | 'A')[];
    }

    // Fix property names from camelCase to snake_case as defined in Match type.
    const prompt = `Como um especialista em futebol (Volpony Indica), analise os seguintes 12 confrontos e sugira o palpite mais provável para cada um (H para Home/Casa, D para Draw/Empate, A para Away/Fora). 
    Retorne APENAS um array de strings com os 12 palpites na ordem.
    Jogos: ${matches.map((m, i) => `${i+1}. ${m.home_team} vs ${m.away_team} (${m.league})`).join(', ')}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { 
            type: Type.STRING,
            description: "Winning side: 'H', 'D', or 'A'"
          }
        }
      }
    });

    // Access the .text property directly as per latest SDK guidelines.
    const text = response.text;
    if (!text) return Array(12).fill('H');

    const result = JSON.parse(text.trim());
    if (Array.isArray(result) && result.length === 12) {
      return result as ('H' | 'D' | 'A')[];
    }
    
    return Array(12).fill('H');
  } catch (error) {
    console.error("Erro no Volpony Indica:", error);
    return Array(12).fill('H');
  }
};
