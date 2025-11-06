export interface UIElement {
  id: string;
  type: string;
  role: string;
  name: string;
  bounds: Bounds;
  selector: ElementSelector;
  properties: ElementProperties;
  children?: UIElement[];
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementSelector {
  primary: string;
  fallback: string[];
  strategy: SelectorStrategy;
  confidence: number;
  features: SelectorFeatures;
}

export interface ElementProperties {
  [key: string]: any;
  text?: string;
  value?: string;
  placeholder?: string;
  enabled?: boolean;
  visible?: boolean;
}

export interface SelectorFeatures {
  role?: string;
  name?: string;
  xpath?: string;
  cssPath?: string;
  image?: string;
  ocr?: string;
}

export enum SelectorStrategy {
  XPath = 'xpath',
  CSSPath = 'csspath',
  Role = 'role',
  Name = 'name',
  Image = 'image',
  OCR = 'ocr',
}

export interface SelectorValidation {
  isValid: boolean;
  confidence: number;
  matchCount: number;
  lastValidated?: Date;
}
