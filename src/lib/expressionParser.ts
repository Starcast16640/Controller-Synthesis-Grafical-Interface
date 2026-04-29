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
  tokens: Token[];
}

export function analyzeExpression(expr: string, validNames: string[]): ParseResult {
  if (!expr || expr.trim() === '' || expr.toUpperCase() === 'TRUE') {
    return { isValid: true, errorMessage: null, errorPos: null, tokens[] };
  }
  
  const BINARY_OPS = ['AND', 'OR', 'XOR', 'NOT', '>=', '<=', '>', '<', '=', '!='];
  const UNARY_OPS = ['↑', '↓'];
  const regex = /([A-Za-z0-9_]+)|(\(|\)|\[|\])|(>=|<=|!=|↑|↓|>|<|=)|(\s+)|(.)/gi;
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
      return { isValid: false, errorMessage: `Caractère non reconnu : ${unknown}`, errorPos: pos, tokens[] };
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
            errorPos: token.pos, 
            tokens: []
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
      errorPos: last?.pos || 0, 
      tokens: []
    };
  }

  for (const token of tokens) {
    if (token.type === 'ID') {
      const isNumeric = /^\d+$/.test(token.value);
      if (!isNumeric && !validNames.includes(token.value)) {
        return { 
          isValid: false, 
          errorMessage: `L'élément "${token.value}" n'existe pas dans le modèle`, 
          errorPos: token.pos, 
          tokens: []
        };
      }
    }
  }
  
  let isInsideBrackets = false;
  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];

    if (UNARY_OPS.includes(current.value)) {
      if (next.pos > (current.pos + current.value.length)) {
        return { 
          isValid: false, 
          errorMessage: `L'opérateur "${current.value}" doit être collé à son élément (pas d'espace)`, 
          errorPos: current.pos,
          tokens: [] 
        };
      }
    }

    if (current.value === '=') {
      if (next && (next.value === '>' || next.value === '<' || next.value === '!')) {
        let correctSymbol = next.value === '!' ? '!=' : next.value + '=';
        return { 
          isValid: false, 
          errorMessage: `Erreur de syntaxe : le signe "=" doit être à droite (ex: ${correctSymbol})`, 
          errorPos: current.pos,
          tokens: [] 
        };
      }
    }
    
    if (current.value === '[') isInsideBrackets = true;
    if (current.value === ']') isInsideBrackets = false;
    if (!isInsideBrackets) {
      if (['>', '<', '=', '!=', '>=', '<='].includes(current.value)) {
        return { 
          isValid: false, 
          errorMessage: `L'opérateur "${current.value}" n'est autorisé qu'à l'intérieur de crochets [ ]`, 
          errorPos: current.pos, tokens: [] 
        };
      }
      if (current.type === 'ID' && /^\d+$/.test(current.value)) {
        return { 
          isValid: false, 
          errorMessage: `Les valeurs numériques doivent être placées dans des crochets [ ]`, 
          errorPos: current.pos, tokens: [] 
        };
      }
    }
    if (next) {
      if (current.type === 'OPERATOR' && next.type === 'PAREN' && [')', ']'].includes(next.value)) {
        return { isValid: false, errorMessage: `L'opérateur "${current.value}" attend une suite`, errorPos: current.pos, tokens: [] };
      }
      if (current.type === 'ID' && next.type === 'ID') {
        return { isValid: false, errorMessage: `Opérateur manquant entre "${current.value}" et "${next.value}"`, errorPos: next.pos, tokens: [] };
      }
      if (current.type === 'PAREN' && ['(', '['].includes(current.value) && [')', ']'].includes(next.value)) {
        return { isValid: false, errorMessage: `Les parenthèses ou crochets ne peuvent pas être vides`, errorPos: current.pos, tokens: [] };
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
      errorPos: firstToken.pos,
      tokens: []
    };
  }
  if (lastToken.type === 'OPERATOR') {
    return { 
      isValid: false, 
      errorMessage: `L'expression ne peut pas se terminer par l'opérateur "${lastToken.value}"`, 
      errorPos: lastToken.pos, 
      tokens: []
    };
  }
  
  return { isValid: true, errorMessage: null, errorPos: null, tokens: tokens };
}

export function normalizeExpression(tokens: Token[]): string {
  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const next = tokens[i + 1];

    result += token.value;
    if (next) {
      const isCurrentPunctuation = ['(', '[', '↑', '↓', 'NOT'].includes(token.value);
      const isNextPunctuation = [')', ']', ',', '.'].includes(next.value);
      
      if (!isCurrentPunctuation && !isNextPunctuation) {
        result += " ";
      }
    }
  }
  return result.trim();
}