export type TokenType = 'ID' | 'OPERATOR' | 'PAREN' | 'WHITESPACE' | 'UNKNOWN';

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export interface ParseResult {
  isValid: boolean;
  errorMessage: string | null;
  errorPos: number | null;
}

export function analyzeExpression(expr: string): ParseResult {
  
}