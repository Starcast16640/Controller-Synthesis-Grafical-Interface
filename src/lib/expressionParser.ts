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
  if (!expr || expr.trim() === '' || expr.toUpperCase() === 'TRUE') return { isValid: true, errorMessage: null, errorPos: null };
  
  const regex = /([A-Za-z0-9_]+)|(AND|OR|XOR|NOT|↑|↓|>|<)|(\(|\)|\[|\])|(\s+)|(.)/gi;
  let match;
  const tokens: Token[] = [];

  while ((match = regex.exec(expr)) !== null) {
    const [full, id, op, sym, ws, unknown] = match;
    const pos = match.index;

    if (ws) continue;
    if (op) tokens.push({ type: 'OPERATOR', value: op.toUpperCase(), pos });
    else if (id) tokens.push({ type: 'ID', value: id, pos });
    else if (sym) tokens.push({ type: 'PAREN', value: sym, pos });
    else if (unknown) {
      return { isValid: false, errorMessage: `Caractère non reconnu : ${unknown}`, errorPos: pos };
    }
  }

  const lastToken = tokens[tokens.length - 1];
  if (lastToken && lastToken.type === 'OPERATOR') {
    const binaryOps = ['AND', 'OR', 'XOR', '>', '<'];
    if (binaryOps.includes(lastToken.value)) {
      return { 
        isValid: false, 
        errorMessage: `L'expression ne peut pas se terminer par l'opérateur "${lastToken.value}"`, 
        errorPos: lastToken.pos 
      };
    }
  }
  
  return { isValid: true, errorMessage: null, errorPos: null };
}