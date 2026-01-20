/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Converte uma string base64 ou DataURL em um objeto inlineData para Gemini.
 */
const dataUrlToParts = (dataUrl: string) => {
  const arr = dataUrl.split(",");
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
  return { mimeType: mimeMatch[1], data: arr[1] };
};

const dataUrlToPart = (dataUrl: string) => {
  const { mimeType, data } = dataUrlToParts(dataUrl);
  return { inlineData: { mimeType, data } };
};

/**
 * Extrai a imagem da resposta do Gemini.
 */
const handleApiResponse = (response: GenerateContentResponse): string => {
  if (response.candidates && response.candidates.length > 0) {
    for (const candidate of response.candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            return `data:${mimeType};base64,${base64EncodeString}`;
          }
        }
      }
    }
  }

  const textFeedback = response.text;
  const errorMessage =
    `O modelo não retornou uma imagem. ` +
    (textFeedback
      ? `Resposta: "${textFeedback}"`
      : "Isso pode ocorrer devido a filtros de segurança ou se o pedido for muito complexo.");
  throw new Error(errorMessage);
};

const model = "gemini-2.5-flash-image";

/**
 * Gera uma imagem de modelo a partir de uma foto enviada.
 */
export const generateModelImage = async (userImageBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const userImagePart = dataUrlToPart(userImageBase64);
  const prompt =
    "Você é um fotógrafo de moda especializado em IA. Transforme a pessoa nesta imagem em uma foto de modelo de corpo inteiro para um site de e-commerce. Fundo neutro e limpo (cinza claro). Preserve a identidade e características físicas da pessoa, mas coloque-a em uma pose de modelo padrão. Retorne APENAS a imagem final.";
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [userImagePart, { text: prompt }] },
  });
  return handleApiResponse(response);
};

/**
 * Extrai apenas a peça de roupa principal da imagem.
 */
export const extractGarmentOnly = async (garmentImageBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const garmentPart = dataUrlToPart(garmentImageBase64);
  const prompt =
    "Você é um assistente de moda digital. Analise esta imagem e extraia APENAS a peça de roupa principal (camiseta, jaqueta, calça, etc.). Se houver uma pessoa vestindo a roupa, REMOVA a pessoa completamente. Coloque a peça de roupa em um fundo branco sólido, como se fosse uma foto de catálogo de produto (flat lay). O resultado deve conter APENAS a peça de roupa isolada. Retorne apenas a imagem.";
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [garmentPart, { text: prompt }] },
  });
  return handleApiResponse(response);
};

/**
 * Veste o modelo com a peça fornecida.
 */
export const generateVirtualTryOnImage = async (
  modelImageBase64: string,
  garmentImageBase64: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelImagePart = dataUrlToPart(modelImageBase64);
  const garmentImagePart = dataUrlToPart(garmentImageBase64);

  const prompt = `Você é um especialista em provador virtual. Receberá uma 'imagem do modelo' e uma 'imagem da peça'.
Sua tarefa é vestir o modelo com a peça de roupa fornecida.

**REGRAS CRÍTICAS:**
1. **Foco na Peça:** A 'imagem da peça' pode conter uma pessoa ou fundo. Ignore tudo e reconheça APENAS a peça de roupa principal.
2. **Substituição Total:** Remova a roupa original do modelo e aplique a nova peça de forma fotorrealista.
3. **Preservação:** Mantenha o rosto, corpo, pose e fundo da 'imagem do modelo' intactos.
4. **Naturalidade:** Ajuste a peça ao corpo do modelo com dobras e sombras naturais.
5. **Saída:** Retorne APENAS a imagem final editada.`;

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
  });
  return handleApiResponse(response);
};

/**
 * Gera variações de pose mantendo pessoa e roupa.
 */
export const generatePoseVariation = async (
  tryOnImageBase64: string,
  poseInstruction: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const tryOnImagePart = dataUrlToPart(tryOnImageBase64);
  const prompt = `Mantenha a pessoa, a roupa e o cenário idênticos. Altere apenas a pose para: "${poseInstruction}". Retorne APENAS a imagem final.`;
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [tryOnImagePart, { text: prompt }] },
  });
  return handleApiResponse(response);
};
