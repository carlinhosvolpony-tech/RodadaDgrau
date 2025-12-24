import { GoogleGenAI, Type } from "@google/genai";
import { Match } from "./types";

// Always use the API_KEY directly from process.env.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getVolponyIndicaPicks = async (matches: Match[]): Promise<('H' | 'D' | 'A')[]> => {
  try {
    const prompt = `Como um especialista em futebol (Volpony Indica), analise os seguintes 12 confrontos e sugira o palpite mais provável para cada um (H para Home/Casa, D para Draw/Empate, A para Away/Fora). 
    Retorne APENAS um array de strings com os 12 palpites na ordem.
    Jogos: ${matches.map((m, i) => `${i+1}. ${m.homeTeam} vs ${m.awayTeam} (${m.league})`).join(', ')}`;

    // Generate content using a structured schema for JSON output.
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

    // Access the generated text directly from the text property.
    const text = response.text;
    if (!text) return Array(12).fill('H');

    const result = JSON.parse(text.trim());
    if (Array.isArray(result) && result.length === 12) {
      return result as ('H' | 'D' | 'A')[];
    }
    
    // Fallback in case of AI error or format mismatch
    return Array(12).fill('H');
  } catch (error) {
    console.error("Erro no Volpony Indica:", error);
    return Array(12).fill('H');
  }
};