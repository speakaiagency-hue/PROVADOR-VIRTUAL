
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

/**
 * Extracts the image from the GenerateContentResponse following the guidelines.
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
    const errorMessage = `O modelo não retornou uma imagem. ` + (textFeedback ? `Resposta: "${textFeedback}"` : "Isso pode ocorrer devido a filtros de segurança ou se o pedido for muito complexo.");
    throw new Error(errorMessage);
};

const model = 'gemini-2.5-flash-image';

export const generateModelImage = async (userImage: File): Promise<string> => {
    // DO: Initialize GoogleGenAI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userImagePart = await fileToPart(userImage);
    const prompt = "Você é um fotógrafo de moda especializado em IA. Transforme a pessoa nesta imagem em uma foto de modelo de corpo inteiro para um site de e-commerce. Fundo neutro e limpo (cinza claro). Preserve a identidade e características físicas da pessoa, mas coloque-a em uma pose de modelo padrão. Retorne APENAS a imagem final.";
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [userImagePart, { text: prompt }] },
    });
    return handleApiResponse(response);
};

/**
 * Extracts ONLY the clothing item from an image, removing the person and background.
 * This satisfies the request to recognize only the clothing.
 */
export const extractGarmentOnly = async (garmentImage: File): Promise<string> => {
    // DO: Initialize GoogleGenAI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const garmentPart = await fileToPart(garmentImage);
    const prompt = "Você é um assistente de moda digital. Analise esta imagem e extraia APENAS a peça de roupa principal (camiseta, jaqueta, calça, etc.). Se houver uma pessoa vestindo a roupa, REMOVA a pessoa completamente. Coloque a peça de roupa em um fundo branco sólido, como se fosse uma foto de catálogo de produto (flat lay). O resultado deve conter APENAS a peça de roupa isolada. Retorne apenas a imagem.";
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [garmentPart, { text: prompt }] },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File | string): Promise<string> => {
    // DO: Initialize GoogleGenAI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = typeof garmentImage === 'string' ? dataUrlToPart(garmentImage) : await fileToPart(garmentImage);
    
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

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    // DO: Initialize GoogleGenAI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `Mantenha a pessoa, a roupa e o cenário idênticos. Altere apenas a pose para: "${poseInstruction}". Retorne APENAS a imagem final.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
    });
    return handleApiResponse(response);
};
