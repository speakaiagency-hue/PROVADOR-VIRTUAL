/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyErrorMessage(error: unknown, context: string): string {
    let rawMessage = 'Ocorreu um erro desconhecido.';
    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    } else if (error) {
        rawMessage = String(error);
    }

    if (rawMessage.includes("Unsupported MIME type")) {
        try {
            const errorJson = JSON.parse(rawMessage);
            const nestedMessage = errorJson?.error?.message;
            if (nestedMessage && nestedMessage.includes("Unsupported MIME type")) {
                const mimeType = nestedMessage.split(': ')[1] || 'não suportado';
                return `O tipo de arquivo '${mimeType}' não é suportado. Por favor, use um formato como PNG, JPEG ou WEBP.`;
            }
        } catch (e) {
        }
        return `Formato de arquivo não suportado. Por favor, envie uma imagem nos formatos PNG, JPEG ou WEBP.`;
    }
    
    return `${context}. ${rawMessage}`;
}