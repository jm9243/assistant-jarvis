import { UIElement, ElementSelector, SelectorStrategy, SelectorFeatures } from './types';

export class SelectorGenerator {
  static generateSelectors(element: UIElement): ElementSelector {
    const features: SelectorFeatures = {};
    const fallback: string[] = [];

    // Try to generate multiple selector strategies
    if (element.properties.role) {
      features.role = element.properties.role;
      fallback.push(`[role="${element.properties.role}"]`);
    }

    if (element.name) {
      features.name = element.name;
      fallback.push(`[aria-label="${element.name}"]`);
    }

    const xpath = this.generateXPath(element);
    if (xpath) {
      features.xpath = xpath;
      fallback.push(xpath);
    }

    const cssPath = this.generateCSSPath(element);
    if (cssPath) {
      features.cssPath = cssPath;
      fallback.push(cssPath);
    }

    // Primary selector is typically the most reliable one
    const primary = features.xpath || features.cssPath || features.role || element.id;

    return {
      primary,
      fallback,
      strategy: this.determinePrimaryStrategy(element),
      confidence: this.calculateConfidence(element, features),
      features,
    };
  }

  private static generateXPath(element: UIElement): string {
    // Placeholder for XPath generation
    // In production, this would build proper XPath selectors
    return `//${element.type}[@id="${element.id}"]`;
  }

  private static generateCSSPath(element: UIElement): string {
    // Placeholder for CSS path generation
    // In production, this would build proper CSS selectors
    if (element.properties.className) {
      return `.${element.properties.className}`;
    }
    if (element.id) {
      return `#${element.id}`;
    }
    return '';
  }

  private static determinePrimaryStrategy(element: UIElement): SelectorStrategy {
    if (element.properties.role) {
      return SelectorStrategy.Role;
    }
    if (element.name) {
      return SelectorStrategy.Name;
    }
    if (element.properties.xpath) {
      return SelectorStrategy.XPath;
    }
    return SelectorStrategy.CSSPath;
  }

  private static calculateConfidence(element: UIElement, features: SelectorFeatures): number {
    let confidence = 0.5; // Base confidence

    if (features.role) confidence += 0.15;
    if (features.name) confidence += 0.15;
    if (features.xpath) confidence += 0.1;
    if (features.cssPath) confidence += 0.1;

    // Unique identifiers increase confidence
    if (element.id && !element.id.startsWith('generated_')) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }
}
