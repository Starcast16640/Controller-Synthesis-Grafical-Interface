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
  if (!expr || expr.trim() === '' || expr.toUpperCase() === 'TRUE') {
    return { isValid: true, errorMessage: null, errorPos: null };
  }
  
  const BINARY_OPS = ['AND', 'OR', 'XOR', '>', '<'];
  const UNARY_OPS = ['NOT', '↑', '↓'];
  const regex = /([A-Za-z0-9_↑↓]+)|(\(|\)|\[|\])|(>|<)|(\s+)|(.)/gi;
  let match;
  const tokens: Token[] = [];

  while ((match = regex.exec(expr)) !== null) {
    const [full, word, sym, ws, unknown] = match;
    const pos = match.index;
    if (ws) continue;
    if (word) {
      const val = word.toUpperCase();
      if (BINARY_OPS.includes(val) || UNARY_OPS.includes(val)) {
        tokens.push({ type: 'OPERATOR', value: val, pos });
      } else {
        tokens.push({ type: 'ID', value: word, pos });
      }
    } else if (sym) {
      tokens.push({ type: 'PAREN', value: sym, pos });
    } else if (unknown) {
      return { isValid: false, errorMessage: `Caractère non reconnu : ${unknown}`, errorPos: pos };
    }
  }

  if (tokens.length === 0) return { isValid: true, errorMessage: null, errorPos: null };
  const firstToken = tokens[0];
  const lastToken = tokens[tokens.length - 1];
  if (firstToken.type === 'OPERATOR' && BINARY_OPS.includes(firstToken.value)) {
    return { 
      isValid: false, 
      errorMessage: `L'expression ne peut pas commencer par l'opérateur "${firstToken.value}"`, 
      errorPos: firstToken.pos 
    };
  }
  if (lastToken.type === 'OPERATOR') {
    return { 
      isValid: false, 
      errorMessage: `L'expression ne peut pas se terminer par l'opérateur "${lastToken.value}"`, 
      errorPos: lastToken.pos 
    };
  }
  
  return { isValid: true, errorMessage: null, errorPos: null };
}