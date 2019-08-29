import { ViewportInstruction } from './viewport-instruction';

export interface IInstructionResolverOptions {
  separators?: IRouteSeparators;
}

export interface IRouteSeparators extends Partial<ISeparators> { }

interface ISeparators {
  viewport: string;
  sibling: string;
  scope: string;
  scopeStart: string;
  scopeEnd: string;
  noScope: string;
  parameters: string;
  parametersEnd: string;
  parameter?: string;
  add: string;
  clear: string;
  action: string;
}

export class InstructionResolver {
  public separators: ISeparators = {
    viewport: '@', // ':',
    sibling: '+', // '/',
    scope: '/', // '+',
    scopeStart: '(', // ''
    scopeEnd: ')', // ''
    noScope: '!',
    parameters: '(', // '='
    parametersEnd: ')', // ''
    parameter: '&',
    add: '+',
    clear: '-',
    action: '.',
  };

  public activate(options?: IInstructionResolverOptions): void {
    options = options || {};
    this.separators = { ...this.separators, ...options.separators };
  }

  public get clearViewportInstruction(): string {
    return this.separators.clear;
  }

  public parseViewportInstructions(instructions: string): ViewportInstruction[] {
    if (instructions === null || instructions === '') {
      return [];
    }
    if (instructions.startsWith('/')) {
      instructions = instructions.slice(1);
    }
    return instructions.split(this.separators.sibling).map((instruction) => this.parseViewportInstruction(instruction));
  }

  public parseViewportInstruction(instruction: string): ViewportInstruction {
    return this.parseViewportInstructionX(instruction).instructions[0];
    // const instructions = instruction.split(this.separators.scope).map((scopeInstruction) => this.parseAViewportInstruction(scopeInstruction));
    // for (let i = 0; i < instructions.length - 1; i++) {
    //   instructions[i].nextScopeInstructions = [instructions[i + 1]];
    // }
    // return instructions[0];
  }

  public stringifyViewportInstructions(instructions: ViewportInstruction[], excludeViewport: boolean = false): string {
    return instructions.map((instruction) => this.stringifyViewportInstruction(instruction, excludeViewport)).join(this.separators.sibling);
  }

  public stringifyViewportInstruction(instruction: ViewportInstruction | string, excludeViewport: boolean = false): string {
    if (typeof instruction === 'string') {
      return this.stringifyAViewportInstruction(instruction, excludeViewport);
    } else {
      let stringified = this.stringifyAViewportInstruction(instruction, excludeViewport)
      if (instruction.nextScopeInstructions && instruction.nextScopeInstructions.length) {
        stringified += instruction.nextScopeInstructions.length === 1
          ? `${this.separators.scope}${this.stringifyViewportInstructions(instruction.nextScopeInstructions, excludeViewport)}`
          : `${this.separators.scope}${this.separators.scopeStart}${this.stringifyViewportInstructions(instruction.nextScopeInstructions, excludeViewport)}${this.separators.scopeEnd}`;
      }
      return stringified;
      // const instructions = [instruction];
      // let viewportInstruction = instruction as ViewportInstruction;
      // while (viewportInstruction.nextScopeInstructions && viewportInstruction.nextScopeInstructions.length) {
      //   viewportInstruction = viewportInstruction.nextScopeInstructions[0];
      //   instructions.push(viewportInstruction);
      // }
      // return instructions.map((scopeInstruction) => this.stringifyAViewportInstruction(scopeInstruction, excludeViewport)).join(this.separators.scope);
    }
  }

  public parseScopedViewportInstruction(instruction: string): ViewportInstruction[] {
    return instruction.split(this.separators.scope).map((scopeInstruction) => this.parseViewportInstruction(scopeInstruction));
  }

  public stringifyScopedViewportInstruction(instructions: ViewportInstruction | string | (ViewportInstruction | string)[]): string {
    if (!Array.isArray(instructions)) {
      return this.stringifyScopedViewportInstruction([instructions]);
    }
    return instructions.map((instruction) => this.stringifyViewportInstruction(instruction)).join(this.separators.scope);
  }

  public encodeViewportInstructions(instructions: ViewportInstruction[]): string {
    return encodeURIComponent(this.stringifyViewportInstructions(instructions)).replace(/\(/g, '%28').replace(/\)/g, '%29');
  }
  public decodeViewportInstructions(instructions: string): ViewportInstruction[] {
    return this.parseViewportInstructions(decodeURIComponent(instructions));
  }

  public buildScopedLink(scopeContext: string, href: string): string {
    if (scopeContext) {
      href = `/${scopeContext}${this.separators.scope}${href}`;
    }
    return href;
  }

  public shouldClearViewports(path: string): { clear: boolean; newPath: string } {
    const clearViewports = (path === this.separators.clear || path.startsWith(this.separators.clear + this.separators.add));
    const newPath = path.startsWith(this.separators.clear) ? path.slice(2) : path;
    return { clear: clearViewports, newPath };
  }

  public mergeViewportInstructions(instructions: (string | ViewportInstruction)[]): ViewportInstruction[] {
    const merged: ViewportInstruction[] = [];

    for (let instruction of instructions) {
      if (typeof instruction === 'string') {
        instruction = this.parseViewportInstruction(instruction);
      }
      const index = merged.findIndex(merge => merge.sameViewport(instruction as ViewportInstruction));
      if (index >= 0) {
        merged.splice(index, 1, instruction);
      } else {
        merged.push(instruction);
      }
    }
    return merged;
  }

  public removeStateDuplicates(states: string[]): string[] {
    let sorted: string[] = states.slice().sort((a, b) => b.split(this.separators.scope).length - a.split(this.separators.scope).length);
    sorted = sorted.map((value) => `${this.separators.scope}${value}${this.separators.scope}`);

    let unique: string[] = [];
    if (sorted.length) {
      unique.push(sorted.shift() as string);
      while (sorted.length) {
        const state = sorted.shift();
        if (state && unique.every(value => {
          return value.indexOf(state) === -1;
        })) {
          unique.push(state);
        }
      }
    }
    unique = unique.map((value) => value.substring(1, value.length - 1));
    unique.sort((a, b) => a.split(this.separators.scope).length - b.split(this.separators.scope).length);

    return unique;
  }

  public flattenViewportInstructions(instructions: ViewportInstruction[]): ViewportInstruction[] {
    const flat: ViewportInstruction[] = [];
    for (const instruction of instructions) {
      flat.push(instruction);
      if (instruction.nextScopeInstructions) {
        flat.push(...this.flattenViewportInstructions(instruction.nextScopeInstructions));
      }
    }
    return flat;
  }

  public stateStringsToString(stateStrings: string[], clear: boolean = false): string {
    const strings = stateStrings.slice();
    if (clear) {
      strings.unshift(this.clearViewportInstruction);
    }
    return strings.join(this.separators.sibling);
  }





  public parseViewportInstructionX(instructions: string, grouped: boolean = false): { instructions: ViewportInstruction[]; remaining: string } {
    if (!instructions) {
      return { instructions: [], remaining: '' };
    }
    if (instructions.startsWith(this.separators.scopeStart)) {
      instructions = `${this.separators.scope}${instructions}`;
    }
    // if (instructions.startsWith(this.separators.scope) && !instructions.startsWith(`${this.separators.scope}${this.separators.scopeStart}`)) {
    //   instructions = instructions.slice(1);
    // }
    const viewportInstructions: ViewportInstruction[] = [];
    let guard = 10;
    while (instructions.length && guard) {
      guard--;
      if (instructions.startsWith(this.separators.scope)) {
        instructions = instructions.slice(this.separators.scope.length);
        const scopeStart = instructions.startsWith(this.separators.scopeStart);
        if (scopeStart) {
          instructions = instructions.slice(this.separators.scopeStart.length);
        }
        const { instructions: found, remaining } = this.parseViewportInstructionX(instructions, scopeStart);
        if (viewportInstructions.length) {
          viewportInstructions[viewportInstructions.length - 1].nextScopeInstructions = found;
        } else {
          viewportInstructions.push(...found);
        }
        instructions = remaining;
      } else if (instructions.startsWith(this.separators.scopeEnd)) {
        if (grouped) {
          instructions = instructions.slice(this.separators.scopeEnd.length);
        }
        return { instructions: viewportInstructions, remaining: instructions };
      } else if (instructions.startsWith(this.separators.sibling)) {
        instructions = instructions.slice(this.separators.sibling.length);
      } else {
        const { instruction: viewportInstruction, remaining } = this.parseAViewportInstruction(instructions);
        viewportInstructions.push(viewportInstruction);
        instructions = remaining;
      }
    }

    return { instructions: viewportInstructions, remaining: instructions };
  }

  private findNextToken(instruction: string, tokens: string[]): { token: string; pos: number } {
    const matches: Record<string, number> = {};
    // Tokens can have length > 1
    for (const token of tokens) {
      const pos = instruction.indexOf(token);
      if (pos > -1) {
        matches[token] = instruction.indexOf(token);
      }
    }
    const pos = Math.min(...Object.values(matches));
    for (const token in matches) {
      if (matches[token] === pos) {
        return { token, pos };
      }
    }
    return { token: '', pos: -1 };
  }

  private findEndToken(instruction: string, incToken: string, decToken: string): number {
    let stack = 1;
    let pos = 0;
    for (const len = instruction.length; pos < len; pos++) {
      if (instruction[pos] === incToken) {
        stack++;
      } else if (instruction[pos] === decToken) {
        stack--;
        if (stack === 0) {
          return pos;
        }
      }
    }
    return pos;
  }

  private parseAViewportInstruction(instruction: string): { instruction: ViewportInstruction; remaining: string } {
    const seps = this.separators;
    const tokens = [seps.parameters, seps.viewport, seps.noScope, seps.scopeEnd, seps.scope, seps.sibling];

    let { token, pos } = this.findNextToken(instruction, tokens);

    const component = pos !== -1 ? instruction.slice(0, pos) : instruction;
    instruction = pos !== -1 ? instruction.slice(pos + token.length) : '';

    let parametersString: string | undefined = void 0;
    tokens.shift(); // parameters
    if (token === seps.parameters) {
      ({ token, pos } = this.findNextToken(instruction, [seps.parametersEnd]));
      parametersString = instruction.slice(0, pos);
      instruction = instruction.slice(pos + token.length);

      ({ token, pos } = this.findNextToken(instruction, tokens));
      instruction = instruction.slice(token.length);
    }

    let viewport: string | undefined = void 0;
    tokens.shift(); // viewport
    if (token === seps.viewport) {
      ({ token, pos } = this.findNextToken(instruction, tokens));
      viewport = pos !== -1 ? instruction.slice(0, pos) : instruction;
      instruction = pos !== -1 ? instruction.slice(pos + token.length) : '';
    }

    let scope: boolean = true;
    tokens.shift(); // noScope
    if (token === seps.noScope) {
      scope = false;
    }

    // Restore token that belongs to next instruction
    if (token === seps.scopeEnd || token === seps.scope || token === seps.sibling) {
      instruction = `${token}${instruction}`;
    }

    return { instruction: new ViewportInstruction(component, viewport, parametersString, scope), remaining: instruction };
  }














  private parseAViewportInstructionOld(instruction: string): ViewportInstruction {
    let scope: boolean = true;

    // No scope is always at the end, regardless of anything else
    if (instruction.endsWith(this.separators.noScope)) {
      scope = false;
      instruction = instruction.slice(0, -this.separators.noScope.length);
    }

    const [componentPart, viewport] = instruction.split(this.separators.viewport);
    const [component, ...parameters] = componentPart.split(this.separators.parameters);

    let parametersString = parameters.length ? parameters.join(this.separators.parameters) : undefined;
    // The parameter separator can be either a standalone character (such as / or =) or a pair of enclosing characters
    // (such as ()). The separating character is consumed but the end character is not, so we still need to remove that.
    if (this.separators.parametersEnd.length && parametersString && parametersString.endsWith(this.separators.parametersEnd)) {
      parametersString = parametersString.slice(0, -this.separators.parametersEnd.length);
    }
    return new ViewportInstruction(component, viewport, parametersString, scope);
  }

  private stringifyAViewportInstruction(instruction: ViewportInstruction | string, excludeViewport: boolean = false): string {
    if (typeof instruction === 'string') {
      return this.stringifyViewportInstruction(this.parseViewportInstruction(instruction), excludeViewport);
    } else {
      let instructionString = instruction.componentName;
      if (instruction.parametersString) {
        // TODO: Review parameters in ViewportInstruction
        instructionString += this.separators.parameters + instruction.parametersString + this.separators.parametersEnd;
      }
      if (instruction.viewportName !== null && !excludeViewport) {
        instructionString += this.separators.viewport + instruction.viewportName;
      }
      if (!instruction.ownsScope) {
        instructionString += this.separators.noScope;
      }
      return instructionString || '';
    }
  }
}
