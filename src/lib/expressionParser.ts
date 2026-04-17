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

export function analyzeExpression(expr: string, validNames: string[]): ParseResult {
  if (!expr || expr.trim() === '' || expr.toUpperCase() === 'TRUE') {
    return { isValid: true, errorMessage: null, errorPos: null };
  }
  
  const BINARY_OPS = ['AND', 'OR', 'XOR', '>', '<'];
  const UNARY_OPS = ['NOT', '↑', '↓'];
  const regex = /([A-Za-z0-9_↑↓]+)|(\(|\)|\[|\])|(>|<)|(\s+)|(.)/gi;
  let match;
  const tokens: Token[] = [];

  while ((match = regex.exec(expr)) !== null) {
    const [full, word, paren, symbol, ws, unknown] = match;
    const pos = match.index;
    if (ws) continue;
    if (word) {
      const val = word.toUpperCase();
      if (BINARY_OPS.includes(val) || UNARY_OPS.includes(val)) {
        tokens.push({ type: 'OPERATOR', value: val, pos });
      } else {
        tokens.push({ type: 'ID', value: word, pos });
      }
    } 
    else if (paren) {
      tokens.push({ type: 'PAREN', value: paren, pos });
    } 
    else if (symbol) {
      tokens.push({ type: 'OPERATOR', value: symbol, pos });
    } 
    else if (unknown) {
      return { isValid: false, errorMessage: `Caractère non reconnu : ${unknown}`, errorPos: pos };
    }
  }

  const stack = [];
  const pairs: { [key: string]: string } = { ')': '(', ']': '[' };

  for (const token of tokens) {
    if (token.type === 'PAREN') {
      if (['(', '['].includes(token.value)) {
        stack.push(token);
      } else {
        const lastOpen = stack.pop();
        if (!lastOpen || lastOpen.value !== pairs[token.value]) {
          return { 
            isValid: false, 
            errorMessage: `Symbole fermant "${token.value}" sans ouverture correspondante`, 
            errorPos: token.pos 
          };
        }
      }
    }
  }

  if (stack.length > 0) {
    const last = stack.pop();
    return { 
      isValid: false, 
      errorMessage: `Le symbole "${last?.value}" n'est pas refermé`, 
      errorPos: last?.pos || 0 
    };
  }

  for (const token of tokens) {
    if (token.type === 'ID') {
      const isNumeric = /^\d+$/.test(token.value);
      if (!isNumeric && !validNames.includes(token.value)) {
        return { 
          isValid: false, 
          errorMessage: `L'élément "${token.value}" n'existe pas dans le modèle`, 
          errorPos: token.pos 
        };
      }
    }
  }
  
  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    if (current.type === 'OPERATOR') {
      if (next.type === 'PAREN' && [')', ']'].includes(next.value)) {
        return { 
          isValid: false, 
          errorMessage: `L'opérateur "${current.value}" ne peut pas être suivi d'une fermeture`, 
          errorPos: current.pos 
        };
      }
      if (BINARY_OPS.includes(current.value) && BINARY_OPS.includes(next.value)) {
        return { 
          isValid: false, 
          errorMessage: `L'opérateur "${current.value}" ne peut pas être suivi de "${next.value}"`, 
          errorPos: next.pos 
        };
      }
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